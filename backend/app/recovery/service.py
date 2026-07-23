import hashlib
import hmac
import json
import os

from app.action_gate.models import ActionExecutionRequest, ExecutionStatus
from app.action_gate.scenario import MEMBERSHIP_ID, WARRANTY_ID, state_error
from app.action_gate.service import _evaluate, execute_action
from app.interceptor.models import RuleZeroDecision
from app.worker.models import (
    ActionSource,
    ActionSourceType,
    ActionTarget,
    AgentActionType,
    ProposedAgentAction,
)

from .models import (
    RecoveryActionStatus,
    RecoveryCompletionStatus,
    RecoveryExecutionRequest,
    RecoveryExecutionResponse,
    RecoveryPlan,
    RecoveryPlanRequest,
    RecoveryReason,
    RecoveryStep,
    RecoveryStrategy,
    RecoveryTrace,
    RecoveryTrigger,
)

RECOVERY_KEY = os.getenv("RECOVERY_SIGNING_KEY", "rule-zero-local-recovery-signing-key").encode()


class RecoveryValidationError(ValueError):
    pass


def _canonical(value: object) -> str:
    if hasattr(value, "model_dump"):
        value = value.model_dump(mode="json")
    return json.dumps(value, sort_keys=True, separators=(",", ":"), default=str)


def _fingerprint(value: object) -> str:
    return hashlib.sha256(_canonical(value).encode()).hexdigest()


def _plan_material(plan: RecoveryPlan | dict) -> str:
    data = plan.model_dump(mode="json") if isinstance(plan, RecoveryPlan) else dict(plan)
    data.pop("recovery_plan_id", None)
    return _canonical(data)


def _plan_id(plan: RecoveryPlan | dict) -> str:
    signature = hmac.new(RECOVERY_KEY, _plan_material(plan).encode(), hashlib.sha256).hexdigest()[:24]
    return f"rz-recovery-{signature}"


def _action(
    number: int,
    action_type: AgentActionType,
    target_type: str,
    target_id: str,
    payload: dict[str, str | int | bool],
    description: str,
    consequence: str,
    mutates: bool,
) -> ProposedAgentAction:
    return ProposedAgentAction(
        action_id=f"shopping-trap-action-{900 + number:03d}",
        sequence_number=900 + number,
        scenario_id="shopping-trap",
        action_type=action_type,
        description=description,
        target=ActionTarget(type=target_type, id=target_id),
        payload=payload,
        rationale="Deterministic recovery preserves the original Task Contract without retrying the unsafe action.",
        source=ActionSource(
            type=ActionSourceType.TRUSTED_APPLICATION_STATE,
            trust_classification="trusted",
            evidence="Canonical Phase 5 state and the verified Rule Zero failure.",
        ),
        expected_consequence=consequence,
        would_mutate_state=mutates,
    )


def _fresh_evaluation(request: RecoveryPlanRequest):
    gate_request = ActionExecutionRequest(
        scenario_id=request.scenario_id,
        contract=request.contract,
        proposed_action=request.triggering_action,
        current_state=request.current_state,
        expected_state_version=request.current_state.state_version,
        approval=None,
    )
    return _evaluate(gate_request)


def _trigger(request: RecoveryPlanRequest) -> tuple[RecoveryTrigger, RecoveryReason]:
    action_type = request.triggering_action.action_type
    rules = {finding.rule_id.value for finding in request.evaluation.triggered_policy_findings}
    execution = request.execution_response
    if execution and execution.refusal_reason and execution.refusal_reason.value == "stale_state":
        return RecoveryTrigger.STALE_STATE, RecoveryReason.STATE_VERSION_CONFLICT
    if execution and execution.status == ExecutionStatus.REJECTED:
        return RecoveryTrigger.REJECTED_APPROVAL, RecoveryReason.HUMAN_REJECTION
    if "RZ-BUDGET-001" in rules:
        return RecoveryTrigger.BUDGET_VIOLATION, RecoveryReason.BUDGET_LIMIT
    if action_type == AgentActionType.ACTIVATE_SUBSCRIPTION:
        if "RZ-RECUR-001" in rules:
            return RecoveryTrigger.PROHIBITED_RECURRING_PAYMENT, RecoveryReason.CONTRACT_PROHIBITION
        return RecoveryTrigger.PROHIBITED_SUBSCRIPTION, RecoveryReason.CONTRACT_PROHIBITION
    if action_type == AgentActionType.MAKE_PAYMENT:
        return RecoveryTrigger.PROHIBITED_PAYMENT, RecoveryReason.HARD_SIDE_EFFECT_BOUNDARY
    if action_type == AgentActionType.SUBMIT_ORDER:
        return RecoveryTrigger.PROHIBITED_ORDER_SUBMISSION, RecoveryReason.HARD_SIDE_EFFECT_BOUNDARY
    if action_type == AgentActionType.ENTER_SENSITIVE_DATA:
        return RecoveryTrigger.PROHIBITED_SENSITIVE_DATA, RecoveryReason.CONTRACT_PROHIBITION
    if action_type == AgentActionType.NAVIGATE_EXTERNAL:
        return RecoveryTrigger.BLOCKED_ACTION, RecoveryReason.HARD_SIDE_EFFECT_BOUNDARY
    if "RZ-SOURCE-001" in rules:
        return RecoveryTrigger.UNTRUSTED_INSTRUCTION, RecoveryReason.CONTRACT_PROHIBITION
    return RecoveryTrigger.BLOCKED_ACTION, RecoveryReason.CONTRACT_PROHIBITION


def _preserved_constraints(request: RecoveryPlanRequest) -> list[str]:
    budget = request.contract.budget.maximum_amount
    return [
        f"Maximum budget remains INR {budget}" if budget is not None else "No financial mutation without budget authority",
        "Subscriptions and recurring payments remain prohibited",
        "Sensitive-data sharing remains prohibited",
        "Stop before payment and order submission",
        "Original Task Contract remains byte-for-byte semantically unchanged",
    ]


def _step_for(request: RecoveryPlanRequest, trigger: RecoveryTrigger) -> tuple[RecoveryStep, list[RecoveryStrategy], bool, str, list[str]]:
    action_type = request.triggering_action.action_type
    version = request.current_state.state_version
    partial = False
    warnings: list[str] = []
    if trigger == RecoveryTrigger.BUDGET_VIOLATION or (
        trigger == RecoveryTrigger.REJECTED_APPROVAL and action_type == AgentActionType.TOGGLE_ADDON
    ):
        replacement = _action(1, AgentActionType.TOGGLE_ADDON, "addon", WARRANTY_ID, {"selected": False}, "Disable the optional warranty.", "Warranty is disabled and due-today total returns to canonical merchandise cost.", True)
        strategies = [RecoveryStrategy.DISABLE_OPTIONAL_ADDON, RecoveryStrategy.RESTORE_BUDGET_COMPLIANCE, RecoveryStrategy.RETURN_TO_ALLOWED_ITEM]
        reason = "Remove the optional warranty while retaining the allowed power bank."
    elif trigger in {RecoveryTrigger.PROHIBITED_SUBSCRIPTION, RecoveryTrigger.PROHIBITED_RECURRING_PAYMENT, RecoveryTrigger.UNTRUSTED_INSTRUCTION}:
        replacement = _action(1, AgentActionType.REVIEW_CART, "cart", "shopping-cart", {"omit_membership": True, "membership_id": MEMBERSHIP_ID}, "Omit the prohibited recurring membership and review the safe cart.", "No recurring membership is activated; the controlled state remains contract compliant.", False)
        strategies = [RecoveryStrategy.SKIP_PROHIBITED_ACTION, RecoveryStrategy.DISABLE_SUBSCRIPTION, RecoveryStrategy.RETURN_TO_ALLOWED_ITEM]
        reason = "Skip the recurring membership and retain only contract-compatible cart state."
    elif trigger == RecoveryTrigger.STALE_STATE:
        replacement = _action(1, AgentActionType.INSPECT_CATALOGUE, "catalogue", "power-bank-catalogue", {"refresh_required": True}, "Refresh from the canonical Shopping Trap snapshot.", "No stale approval or state mutation is reused.", False)
        strategies = [RecoveryStrategy.REFRESH_CONTROLLED_STATE]
        reason = "Discard stale authority and require a fresh canonical snapshot."
        warnings.append("Load GET /api/scenarios/shopping-trap/state before creating a replacement approval.")
    else:
        replacement = _action(1, AgentActionType.FINISH_TASK, "task", "shopping-trap-task", {"reason": "safe_partial_completion"}, "Finish the controlled simulation without the unsafe action.", "The simulation ends without payment, submission, disclosure, or external navigation.", True)
        strategies = [RecoveryStrategy.SKIP_PROHIBITED_ACTION, RecoveryStrategy.FINISH_WITH_SAFE_PARTIAL_COMPLETION]
        reason = "Stop safely rather than retrying or weakening the blocked boundary."
        partial = True
        if action_type == AgentActionType.MAKE_PAYMENT:
            strategies.insert(1, RecoveryStrategy.STOP_BEFORE_PAYMENT)
        elif action_type == AgentActionType.NAVIGATE_EXTERNAL:
            strategies.insert(1, RecoveryStrategy.REMAIN_ON_CURRENT_DOMAIN)
        elif action_type == AgentActionType.ENTER_SENSITIVE_DATA:
            strategies.insert(1, RecoveryStrategy.OMIT_SENSITIVE_DATA)

    step = RecoveryStep(
        step_id="rz-recovery-step-001",
        sequence_number=1,
        expected_state_version=version,
        proposed_action=replacement,
        reason=reason,
        preserved_constraint=_preserved_constraints(request)[0],
        expected_consequence=replacement.expected_consequence,
        mutates_controlled_state=replacement.would_mutate_state,
        approval_may_be_required=False,
    )
    return step, strategies, partial, reason, warnings


def _expected_state(request: RecoveryPlanRequest, step: RecoveryStep):
    state = request.current_state
    data = state.model_dump(mode="json")
    if step.proposed_action.action_type == AgentActionType.TOGGLE_ADDON:
        changed = data["addons"]["warranty_enabled"]
        data["addons"]["warranty_enabled"] = False
        if changed:
            data["state_version"] += 1
    elif step.proposed_action.action_type == AgentActionType.FINISH_TASK:
        if not data["simulation_completed"]:
            data["simulation_completed"] = True
            data["state_version"] += 1
    return type(state).model_validate(data)


def plan_recovery(request: RecoveryPlanRequest) -> RecoveryPlan:
    if request.triggering_action.scenario_id != request.scenario_id:
        raise RecoveryValidationError("Triggering action scenario does not match the request")
    if request.evaluation.scenario_id != request.scenario_id or request.evaluation.evaluated_action_id != request.triggering_action.action_id:
        raise RecoveryValidationError("Triggering evaluation is not bound to this action and scenario")
    error = state_error(request.current_state)
    if error:
        raise RecoveryValidationError(error)
    fresh = _fresh_evaluation(request)
    if fresh != request.evaluation:
        raise RecoveryValidationError("Triggering evaluation does not match fresh canonical evaluation")
    execution = request.execution_response
    if execution:
        if execution.fresh_evaluation.evaluated_action_id != request.triggering_action.action_id:
            raise RecoveryValidationError("Execution response is not bound to the triggering action")
        if execution.after_state != request.current_state:
            raise RecoveryValidationError("Current state must match the execution response after_state")
    if fresh.decision != RuleZeroDecision.BLOCK and not execution:
        raise RecoveryValidationError("Recovery requires a BLOCK or a failed Phase 5 response")

    trigger, reason = _trigger(request)
    step, strategies, partial, explanation, warnings = _step_for(request, trigger)
    unsafe = [request.triggering_action.description, *[finding.message for finding in request.evaluation.triggered_policy_findings]]
    trace = RecoveryTrace(steps=[
        "validated scenario, action, evaluation, and state bindings",
        "recomputed the triggering Phase 4 evaluation from canonical state",
        f"classified trigger as {trigger.value}",
        "preserved the original Task Contract fingerprint",
        "selected one deterministic safe replacement action",
        "left execution to the Phase 5 Safe Action Gate",
    ])
    plan_data = {
        "recovery_plan_id": "rz-recovery-" + "0" * 24,
        "scenario_id": request.scenario_id,
        "contract_fingerprint": _fingerprint(request.contract),
        "triggering_action_id": request.triggering_action.action_id,
        "triggering_action_fingerprint": _fingerprint(request.triggering_action),
        "triggering_evaluation_id": request.evaluation.evaluation_id,
        "bound_state_version": request.current_state.state_version,
        "trigger": trigger,
        "reason": reason,
        "strategies": strategies,
        "summary": f"Safely recover from {trigger.value.replace('_', ' ')} without overriding Rule Zero.",
        "explanation": explanation,
        "preserved_user_constraints": _preserved_constraints(request),
        "unsafe_behaviour_removed": unsafe,
        "steps": [step],
        "expected_final_state": _expected_state(request, step),
        "full_task_completion_possible": not partial,
        "human_approval_may_still_be_required": False,
        "completion_status": RecoveryCompletionStatus.PARTIAL if partial else RecoveryCompletionStatus.FULL,
        "trace": trace,
        "warnings": warnings or ["Every recovery step still requires an explicit user click and fresh Rule Zero evaluation."],
    }
    provisional = RecoveryPlan.model_validate(plan_data)
    return provisional.model_copy(update={"recovery_plan_id": _plan_id(provisional)})


def execute_recovery_step(request: RecoveryExecutionRequest) -> RecoveryExecutionResponse:
    plan = request.recovery_plan
    if request.scenario_id != plan.scenario_id:
        raise RecoveryValidationError("Recovery plan scenario mismatch")
    if not hmac.compare_digest(plan.recovery_plan_id, _plan_id(plan)):
        raise RecoveryValidationError("Recovery plan integrity verification failed")
    if plan.contract_fingerprint != _fingerprint(request.contract):
        raise RecoveryValidationError("Recovery plan Task Contract binding mismatch")
    if request.step_index >= len(plan.steps):
        raise RecoveryValidationError("Recovery step index is out of range")
    step = plan.steps[request.step_index]
    if request.current_state.state_version != step.expected_state_version:
        raise RecoveryValidationError("Recovery step state version is stale")
    error = state_error(request.current_state)
    if error:
        raise RecoveryValidationError(error)

    gate_request = ActionExecutionRequest(
        scenario_id=request.scenario_id,
        contract=request.contract,
        proposed_action=step.proposed_action,
        current_state=request.current_state,
        expected_state_version=request.current_state.state_version,
        approval=None,
    )
    result = execute_action(gate_request)
    if result.status == ExecutionStatus.APPROVAL_REQUIRED:
        status = RecoveryActionStatus.APPROVAL_REQUIRED
        completion = RecoveryCompletionStatus.IN_PROGRESS
    elif result.status in {ExecutionStatus.EXECUTED, ExecutionStatus.NO_OPERATION}:
        status = RecoveryActionStatus.COMPLETED
        completion = plan.completion_status
    else:
        status = RecoveryActionStatus.REFUSED
        completion = RecoveryCompletionStatus.IN_PROGRESS
    next_index = request.step_index + 1 if status == RecoveryActionStatus.COMPLETED and request.step_index + 1 < len(plan.steps) else None
    return RecoveryExecutionResponse(
        recovery_plan_id=plan.recovery_plan_id,
        executed_step_index=request.step_index,
        step_status=status,
        next_step_index=next_index,
        completion_status=completion,
        fresh_evaluation=result.fresh_evaluation,
        execution_response=result,
        before_state=result.before_state,
        after_state=result.after_state,
        state_changed=result.state_changed,
        trace=RecoveryTrace(steps=[
            "verified recovery plan HMAC and Task Contract binding",
            f"extracted only recovery step {request.step_index}",
            "submitted the typed action to the Phase 5 Safe Action Gate",
            "Phase 5 rebuilt context and re-ran Phase 4",
            "did not execute or advance any later recovery step",
        ]),
    )
