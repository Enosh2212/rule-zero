import hashlib
import hmac
import json

from app.interceptor.engine import evaluate_action
from app.interceptor.models import ActionEvaluationRequest, EvaluationContext, RuleZeroDecision
from app.worker.models import AgentActionType
from app.config import signing_key

from .models import (
    ActionExecutionRequest,
    ActionExecutionResponse,
    ApprovalDecisionRequest,
    ApprovalRecord,
    ApprovalRequest,
    ApprovalStatus,
    ControlledCartLine,
    ControlledShoppingState,
    ExecutionRefusalReason,
    ExecutionStatus,
    ExecutionTrace,
)
from .scenario import (
    MEMBERSHIP_ID,
    MEMBERSHIP_MONTHLY_PRICE,
    PRODUCTS,
    WARRANTY_ID,
    WARRANTY_PRICE,
    state_error,
)

SIGNING_KEY = signing_key("APPROVAL_SIGNING_KEY", "rule-zero-local-demo-signing-key")
HARD_REFUSALS = {
    AgentActionType.MAKE_PAYMENT,
    AgentActionType.SUBMIT_ORDER,
    AgentActionType.ENTER_SENSITIVE_DATA,
    AgentActionType.NAVIGATE_EXTERNAL,
}
READ_ONLY = {
    AgentActionType.INSPECT_CATALOGUE,
    AgentActionType.INSPECT_PRODUCT,
    AgentActionType.REVIEW_CART,
}


def _fingerprint(value: object) -> str:
    encoded = json.dumps(value, sort_keys=True, separators=(",", ":"), default=str).encode()
    return hashlib.sha256(encoded).hexdigest()


def _state_total(state: ControlledShoppingState) -> int:
    total = sum(line.unit_price * line.quantity for line in state.cart_items)
    return total + (WARRANTY_PRICE if state.addons.warranty_enabled else 0)


def _context(request: ActionExecutionRequest | ApprovalDecisionRequest) -> EvaluationContext:
    action = request.proposed_action
    state = request.current_state
    current = _state_total(state)
    projected: int | None = current
    immediate: int | None = 0
    recurring: int | None = 0
    known = True
    category: str | None = None
    optional = False
    if action.action_type in {AgentActionType.ADD_ITEM, AgentActionType.UPDATE_QUANTITY}:
        product = PRODUCTS.get(action.target.id)
        quantity = action.payload.get("quantity")
        if not product or not isinstance(quantity, int) or isinstance(quantity, bool):
            known, projected, immediate = False, None, None
        else:
            if action.action_type == AgentActionType.UPDATE_QUANTITY:
                existing = next(
                    (line for line in state.cart_items if line.product_id == product.product_id),
                    None,
                )
                previous_cost = existing.unit_price * existing.quantity if existing else 0
                projected = current - previous_cost + product.price * max(quantity, 0)
                immediate = max(projected - current, 0)
            else:
                immediate = product.price * max(quantity, 0)
                projected = current + immediate
            category = product.category
    elif action.action_type == AgentActionType.TOGGLE_ADDON and action.target.id == WARRANTY_ID:
        selected = action.payload.get("selected") is True
        optional = selected
        immediate = WARRANTY_PRICE if selected else 0
        merchandise = sum(line.unit_price * line.quantity for line in state.cart_items)
        projected = merchandise + (WARRANTY_PRICE if selected else 0)
    elif action.action_type == AgentActionType.ACTIVATE_SUBSCRIPTION and action.target.id == MEMBERSHIP_ID:
        recurring = MEMBERSHIP_MONTHLY_PRICE
    elif action.action_type in {AgentActionType.MAKE_PAYMENT, AgentActionType.SUBMIT_ORDER}:
        known, projected, immediate = False, None, None
    return EvaluationContext(
        current_cart_total=current,
        projected_cart_total=projected,
        immediate_one_time_cost=immediate,
        recurring_monthly_cost=recurring,
        financial_impact_known=known,
        item_category=category,
        optional_addon=optional,
    )


def _evaluate(request: ActionExecutionRequest | ApprovalDecisionRequest):
    return evaluate_action(ActionEvaluationRequest(
        scenario_id=request.scenario_id,
        contract=request.contract,
        proposed_action=request.proposed_action,
        context=_context(request),
    ))


def _summary(state: ControlledShoppingState) -> str:
    units = sum(line.quantity for line in state.cart_items)
    return f"version={state.state_version}; units={units}; due_today={_state_total(state)}; warranty={state.addons.warranty_enabled}; membership={state.addons.membership_enabled}; checkout={state.checkout_preview_reached}; complete={state.simulation_completed}"


def _approval_material(request: ActionExecutionRequest | ApprovalDecisionRequest) -> str:
    context = _context(request).model_dump(mode="json")
    material = {
        "scenario_id": request.scenario_id,
        "action": request.proposed_action.model_dump(mode="json"),
        "contract_fingerprint": _fingerprint(request.contract.model_dump(mode="json")),
        "state_version": request.current_state.state_version,
        "context": context,
    }
    return json.dumps(material, sort_keys=True, separators=(",", ":"))


def _approval_id(request: ActionExecutionRequest | ApprovalDecisionRequest) -> str:
    signature = hmac.new(SIGNING_KEY, _approval_material(request).encode(), hashlib.sha256).hexdigest()[:24]
    return f"rz-approval-{signature}"


def _execution_id(request: ActionExecutionRequest | ApprovalDecisionRequest) -> str:
    return f"rz-exec-{_fingerprint(_approval_material(request))[:16]}"


def _response(request, evaluation, status, after, trace, refusal=None, approval_request=None, approval_record=None, occurred=False, changed=False):
    before = request.current_state
    return ActionExecutionResponse(
        execution_id=_execution_id(request),
        status=status,
        refusal_reason=refusal,
        before_state=before,
        after_state=after,
        before_summary=_summary(before),
        after_summary=_summary(after),
        fresh_evaluation=evaluation,
        approval_request=approval_request,
        approval_record=approval_record,
        triggered_rules=[f.rule_id.value for f in evaluation.triggered_policy_findings],
        execution_trace=ExecutionTrace(steps=trace),
        execution_occurred=occurred,
        state_changed=changed,
    )


def _apply(state: ControlledShoppingState, action) -> tuple[ControlledShoppingState, bool, list[str], ExecutionRefusalReason | None]:
    data = state.model_dump(mode="json")
    action_type = action.action_type
    trace = ["canonical executor entered", f"validated action type {action_type.value}"]
    if action_type in READ_ONLY:
        return state, False, trace + ["read-only action; no state mutation"], None
    if action_type in HARD_REFUSALS:
        return state, False, trace + ["hard side-effect boundary refused"], ExecutionRefusalReason.PROHIBITED_SIDE_EFFECT
    if action_type == AgentActionType.ADD_ITEM:
        product = PRODUCTS.get(action.target.id)
        quantity = action.payload.get("quantity")
        if not product or not isinstance(quantity, int) or isinstance(quantity, bool) or quantity < 1 or quantity > product.stock:
            return state, False, trace + ["invalid canonical product or quantity"], ExecutionRefusalReason.INVALID_TARGET
        lines = data["cart_items"]
        existing = next((line for line in lines if line["product_id"] == product.product_id), None)
        new_quantity = quantity + (existing["quantity"] if existing else 0)
        if new_quantity > product.stock:
            return state, False, trace + ["quantity exceeds canonical stock"], ExecutionRefusalReason.INVALID_TARGET
        if existing:
            existing["quantity"] = new_quantity
        else:
            lines.append(ControlledCartLine(product_id=product.product_id, quantity=quantity, unit_price=product.price).model_dump())
    elif action_type == AgentActionType.REMOVE_ITEM:
        before = len(data["cart_items"])
        data["cart_items"] = [line for line in data["cart_items"] if line["product_id"] != action.target.id]
        if len(data["cart_items"]) == before:
            return state, False, trace + ["target product absent; no operation"], None
    elif action_type == AgentActionType.UPDATE_QUANTITY:
        product = PRODUCTS.get(action.target.id)
        quantity = action.payload.get("quantity")
        line = next((item for item in data["cart_items"] if item["product_id"] == action.target.id), None)
        if not product or not line or not isinstance(quantity, int) or isinstance(quantity, bool) or quantity < 0 or quantity > product.stock:
            return state, False, trace + ["invalid quantity update"], ExecutionRefusalReason.INVALID_TARGET
        if quantity == 0:
            data["cart_items"] = [item for item in data["cart_items"] if item["product_id"] != action.target.id]
        else:
            line["quantity"] = quantity
    elif action_type == AgentActionType.TOGGLE_ADDON:
        if action.target.id != WARRANTY_ID or not isinstance(action.payload.get("selected"), bool):
            return state, False, trace + ["invalid warranty toggle"], ExecutionRefusalReason.INVALID_TARGET
        data["addons"]["warranty_enabled"] = action.payload["selected"]
    elif action_type == AgentActionType.ACTIVATE_SUBSCRIPTION:
        data["addons"]["membership_enabled"] = True
    elif action_type == AgentActionType.PROCEED_TO_CHECKOUT:
        data["checkout_preview_reached"] = True
    elif action_type == AgentActionType.FINISH_TASK:
        data["simulation_completed"] = True
    else:
        return state, False, trace + ["unsupported controlled action"], ExecutionRefusalReason.UNSUPPORTED_ACTION
    candidate = ControlledShoppingState.model_validate(data)
    changed = candidate != state
    if changed:
        candidate = candidate.model_copy(update={"state_version": state.state_version + 1})
    return candidate, changed, trace + (["state mutated through canonical boundary"] if changed else ["no semantic state change"]), None


def execute_action(request: ActionExecutionRequest) -> ActionExecutionResponse:
    evaluation = _evaluate(request)
    trace = ["validated typed request", "validated canonical state", "rebuilt canonical evaluation context", "re-ran Phase 4 policy"]
    error = state_error(request.current_state)
    if error:
        return _response(request, evaluation, ExecutionStatus.REFUSED, request.current_state, trace + [error], ExecutionRefusalReason.INVALID_STATE)
    if request.expected_state_version != request.current_state.state_version:
        return _response(request, evaluation, ExecutionStatus.REFUSED, request.current_state, trace + ["stale state version"], ExecutionRefusalReason.STALE_STATE)
    if request.approval is not None:
        return _response(request, evaluation, ExecutionStatus.REFUSED, request.current_state, trace + ["normal boundary does not accept approval records"], ExecutionRefusalReason.INVALID_APPROVAL)
    if evaluation.decision == RuleZeroDecision.BLOCK:
        return _response(request, evaluation, ExecutionStatus.REFUSED, request.current_state, trace + ["Rule Zero BLOCK enforced"], ExecutionRefusalReason.RULE_ZERO_BLOCK)
    if evaluation.decision == RuleZeroDecision.ASK_APPROVAL:
        approval = ApprovalRequest(
            approval_request_id=_approval_id(request),
            scenario_id=request.scenario_id,
            action_id=request.proposed_action.action_id,
            contract_fingerprint=_fingerprint(request.contract.model_dump(mode="json")),
            state_version=request.current_state.state_version,
            immediate_one_time_cost=evaluation.consequence_assessment.immediate_one_time_cost,
            recurring_monthly_cost=evaluation.consequence_assessment.recurring_monthly_cost,
            projected_total=evaluation.consequence_assessment.projected_due_today_total,
            triggered_rules=[f.rule_id.value for f in evaluation.triggered_policy_findings],
            reason=evaluation.explanation,
            single_use_warning="Approval is bound to this action and state version and is consumed once decided.",
        )
        return _response(request, evaluation, ExecutionStatus.APPROVAL_REQUIRED, request.current_state, trace + ["paused for explicit human decision"], approval_request=approval)
    after, changed, executor_trace, refusal = _apply(request.current_state, request.proposed_action)
    if refusal:
        return _response(request, evaluation, ExecutionStatus.REFUSED, request.current_state, trace + executor_trace, refusal)
    return _response(request, evaluation, ExecutionStatus.EXECUTED if changed else ExecutionStatus.NO_OPERATION, after, trace + executor_trace, occurred=changed, changed=changed)


def decide_approval(request: ApprovalDecisionRequest) -> ActionExecutionResponse:
    evaluation = _evaluate(request)
    trace = ["validated approval decision request", "rebuilt canonical context", "re-ran Phase 4 policy"]
    error = state_error(request.current_state)
    if error:
        return _response(request, evaluation, ExecutionStatus.REFUSED, request.current_state, trace + [error], ExecutionRefusalReason.INVALID_STATE)
    expected_id = _approval_id(request)
    if not hmac.compare_digest(request.approval_request_id, expected_id):
        return _response(request, evaluation, ExecutionStatus.REFUSED, request.current_state, trace + ["approval binding verification failed"], ExecutionRefusalReason.APPROVAL_BINDING_MISMATCH)
    if request.decision == "reject":
        record = ApprovalRecord(approval_request_id=request.approval_request_id, scenario_id=request.scenario_id, action_id=request.proposed_action.action_id, state_version=request.current_state.state_version, status=ApprovalStatus.REJECTED, message="Human rejected this single action.")
        return _response(request, evaluation, ExecutionStatus.REJECTED, request.current_state, trace + ["human rejection recorded"], approval_record=record)
    if evaluation.decision == RuleZeroDecision.BLOCK:
        return _response(request, evaluation, ExecutionStatus.REFUSED, request.current_state, trace + ["approval cannot override BLOCK"], ExecutionRefusalReason.RULE_ZERO_BLOCK)
    if evaluation.decision != RuleZeroDecision.ASK_APPROVAL:
        return _response(request, evaluation, ExecutionStatus.REFUSED, request.current_state, trace + ["approval no longer required"], ExecutionRefusalReason.INVALID_APPROVAL)
    after, changed, executor_trace, refusal = _apply(request.current_state, request.proposed_action)
    if refusal:
        return _response(request, evaluation, ExecutionStatus.REFUSED, request.current_state, trace + executor_trace, refusal)
    record = ApprovalRecord(approval_request_id=request.approval_request_id, scenario_id=request.scenario_id, action_id=request.proposed_action.action_id, state_version=request.current_state.state_version, status=ApprovalStatus.CONSUMED, message="Approval was verified, used once, and consumed in this response.")
    return _response(request, evaluation, ExecutionStatus.EXECUTED if changed else ExecutionStatus.NO_OPERATION, after, trace + ["human approval verified"] + executor_trace + ["approval consumed"], approval_record=record, occurred=changed, changed=changed)
