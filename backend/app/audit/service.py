import hashlib
import hmac
import json
import os
from typing import Any

from pydantic import ValidationError

from app.action_gate.models import ActionExecutionResponse, ExecutionStatus
from app.action_gate.scenario import state_error
from app.interceptor.models import ActionEvaluationResponse, RuleZeroDecision
from app.recovery.models import RecoveryExecutionResponse, RecoveryPlan
from app.worker.models import ProposedAgentAction

from .models import (
    AuditActor, AuditAppendRequest, AuditEvent, AuditEventInput, AuditEventType,
    AuditExportRequest, AuditExportResponse, AuditIntegrityMetadata, AuditIntegrityStatus,
    AuditOutcomeSummary, AuditPhase, AuditReference, AuditSession, AuditSessionStartRequest,
    AuditStateTransition, AuditVerificationFinding, AuditVerificationResponse,
)
from .redaction import redact

_configured_audit_key = os.getenv("AUDIT_SIGNING_KEY")
if os.getenv("ENVIRONMENT", "development").lower() in {"production", "prod"} and not _configured_audit_key:
    raise RuntimeError("AUDIT_SIGNING_KEY is required in production")
AUDIT_KEY = (_configured_audit_key or "rule-zero-local-audit-signing-key").encode()
GENESIS_HASH = "0" * 64


class AuditValidationError(ValueError):
    pass


def _canonical(value: Any) -> str:
    if hasattr(value, "model_dump"):
        value = value.model_dump(mode="json")
    return json.dumps(value, sort_keys=True, separators=(",", ":"), default=str)


def _digest(value: Any) -> str:
    return hashlib.sha256(_canonical(value).encode()).hexdigest()


def _fingerprint(value: Any) -> str:
    return _digest(value)


def _event_material(session_id: str, sequence: int, event_input: AuditEventInput, payload_digest: str, previous_hash: str) -> dict[str, Any]:
    return {
        "session_id": session_id,
        "sequence_number": sequence,
        "event_type": event_input.event_type.value,
        "phase": event_input.phase.value,
        "actor": event_input.actor.value,
        "summary": event_input.summary,
        "explanation": event_input.explanation,
        "references": event_input.references.model_dump(mode="json"),
        "decision_or_status": event_input.decision_or_status,
        "before_state_version": event_input.state_transition.before_state_version,
        "after_state_version": event_input.state_transition.after_state_version,
        "live_state_changed": event_input.state_transition.live_state_changed,
        "redacted_state_summary": event_input.state_transition.redacted_state_summary,
        "policy_rule_ids": event_input.policy_rule_ids,
        "payload_digest": payload_digest,
        "previous_event_hash": previous_hash,
    }


def _event_hash(material: dict[str, Any]) -> str:
    return hmac.new(AUDIT_KEY, _canonical(material).encode(), hashlib.sha256).hexdigest()


def _make_event(session_id: str, sequence: int, previous_hash: str, event_input: AuditEventInput) -> AuditEvent:
    redacted_payload = redact(event_input.redacted_payload_summary)
    transition = event_input.state_transition.model_copy(update={"redacted_state_summary": str(redact(event_input.state_transition.redacted_state_summary))})
    normalized_input = event_input.model_copy(update={
        "summary": str(redact(event_input.summary)),
        "explanation": str(redact(event_input.explanation)),
        "state_transition": transition,
        "redacted_payload_summary": redacted_payload,
    })
    payload_digest = _digest(redacted_payload)
    current_hash = _event_hash(_event_material(session_id, sequence, normalized_input, payload_digest, previous_hash))
    return AuditEvent(
        **normalized_input.model_dump(), session_id=session_id,
        event_id=f"rz-audit-event-{current_hash[:20]}", sequence_number=sequence,
        previous_event_hash=previous_hash, current_event_hash=current_hash,
        payload_digest=payload_digest, integrity=AuditIntegrityMetadata(),
    )


def _contract_summary(contract) -> dict[str, Any]:
    return {
        "normalized_intent": contract.normalized_intent,
        "allowed_item_categories": contract.allowed_item_categories,
        "maximum_budget": contract.budget.maximum_amount,
        "currency": contract.budget.currency,
        "prohibited_actions": contract.permissions.prohibited_actions,
        "approval_actions": contract.permissions.actions_requiring_human_approval,
        "stop_before_payment": contract.permissions.stop_before_payment,
        "sensitive_data_sharing_allowed": contract.sensitive_data_policy.sharing_allowed,
    }


def start_session(request: AuditSessionStartRequest) -> AuditSession:
    error = state_error(request.initial_state)
    if error:
        raise AuditValidationError(error)
    contract_fp = _fingerprint(request.contract)
    binding = {"scenario_id": request.scenario_id, "contract_fingerprint": contract_fp, "initial_state": request.initial_state.model_dump(mode="json")}
    session_id = f"rz-audit-{_digest(binding)[:24]}"
    event_input = AuditEventInput(
        event_type=AuditEventType.SESSION_STARTED, phase=AuditPhase.PHASE_7,
        actor=AuditActor.SYSTEM, summary="Audit session started.",
        explanation="A stateless observer-only audit chain was bound to the validated contract and canonical initial state.",
        references=AuditReference(scenario_id=request.scenario_id, contract_fingerprint=contract_fp),
        state_transition=AuditStateTransition(
            before_state_version=request.initial_state.state_version,
            after_state_version=request.initial_state.state_version,
            live_state_changed=False,
            redacted_state_summary=f"initial controlled state version {request.initial_state.state_version}",
        ),
        policy_rule_ids=[],
        redacted_payload_summary={"scenario_id": request.scenario_id, "original_instruction": request.contract.original_instruction, "contract": _contract_summary(request.contract), "initial_state_version": request.initial_state.state_version},
    )
    event = _make_event(session_id, 1, GENESIS_HASH, event_input)
    return AuditSession(
        session_id=session_id, scenario_id=request.scenario_id,
        contract_fingerprint=contract_fp, original_instruction=str(redact(request.contract.original_instruction)),
        contract_summary=redact(_contract_summary(request.contract)), initial_state=request.initial_state,
        final_state_version=request.initial_state.state_version, events=[event], event_count=1,
        head_hash=event.current_event_hash, integrity_status=AuditIntegrityStatus.VALID,
    )


def _known_action(session: AuditSession, action_id: str) -> bool:
    return any(event.references.action_id == action_id for event in session.events)


def _known_evaluation(session: AuditSession, evaluation_id: str) -> bool:
    return any(event.references.evaluation_id == evaluation_id for event in session.events)


def _known_recovery(session: AuditSession, plan_id: str) -> bool:
    return any(event.references.recovery_plan_id == plan_id for event in session.events)


def _none_transition(session: AuditSession) -> AuditStateTransition:
    return AuditStateTransition(redacted_state_summary=f"live controlled state remains version {session.final_state_version}")


def _artifact_event(session: AuditSession, artifact_type: str, raw: dict[str, Any]) -> AuditEventInput:
    try:
        if artifact_type == "worker_proposal":
            artifact = ProposedAgentAction.model_validate(raw)
            if artifact.scenario_id != session.scenario_id:
                raise AuditValidationError("Worker proposal scenario mismatch")
            return AuditEventInput(
                event_type=AuditEventType.WORKER_ACTION_PROPOSED, phase=AuditPhase.PHASE_3,
                actor=AuditActor.WORKER_AGENT, summary=f"Worker proposed {artifact.action_type.value}.",
                explanation=artifact.description,
                references=AuditReference(scenario_id=session.scenario_id, contract_fingerprint=session.contract_fingerprint, action_id=artifact.action_id),
                decision_or_status="proposed", state_transition=_none_transition(session), policy_rule_ids=[],
                redacted_payload_summary={"action_id": artifact.action_id, "action_type": artifact.action_type.value, "target_type": artifact.target.type, "target_id": artifact.target.id, "would_mutate_state": artifact.would_mutate_state, "source_type": artifact.source.type.value},
            )
        if artifact_type == "evaluation":
            artifact = ActionEvaluationResponse.model_validate(raw)
            if artifact.scenario_id != session.scenario_id or not _known_action(session, artifact.evaluated_action_id):
                raise AuditValidationError("Evaluation is not bound to a recorded action and scenario")
            event_type = AuditEventType.ACTION_BLOCKED if artifact.decision == RuleZeroDecision.BLOCK else AuditEventType.APPROVAL_REQUESTED if artifact.decision == RuleZeroDecision.ASK_APPROVAL else AuditEventType.ACTION_ALLOWED
            return AuditEventInput(
                event_type=event_type, phase=AuditPhase.PHASE_4, actor=AuditActor.RULE_ZERO_INTERCEPTOR,
                summary=f"Rule Zero decided {artifact.decision.value}.", explanation=artifact.explanation,
                references=AuditReference(scenario_id=session.scenario_id, contract_fingerprint=session.contract_fingerprint, action_id=artifact.evaluated_action_id, evaluation_id=artifact.evaluation_id),
                decision_or_status=artifact.decision.value, state_transition=_none_transition(session),
                policy_rule_ids=[finding.rule_id.value for finding in artifact.triggered_policy_findings],
                redacted_payload_summary={"evaluation_id": artifact.evaluation_id, "action_id": artifact.evaluated_action_id, "decision": artifact.decision.value, "rules": [finding.rule_id.value for finding in artifact.triggered_policy_findings], "consequence": artifact.consequence_assessment.summary},
            )
        if artifact_type in {"execution_response", "approval_response"}:
            artifact = ActionExecutionResponse.model_validate(raw)
            action_id = artifact.fresh_evaluation.evaluated_action_id
            evaluation_id = artifact.fresh_evaluation.evaluation_id
            if artifact.fresh_evaluation.scenario_id != session.scenario_id or not _known_action(session, action_id):
                raise AuditValidationError("Execution response is not bound to a recorded action")
            if artifact_type == "approval_response":
                if not artifact.approval_record:
                    raise AuditValidationError("Approval response has no approval record")
                event_type = AuditEventType.APPROVAL_REJECTED if artifact.status == ExecutionStatus.REJECTED else AuditEventType.APPROVAL_APPROVED
                actor = AuditActor.HUMAN_APPROVAL
                approval_id = artifact.approval_record.approval_request_id
            else:
                event_type = AuditEventType.APPROVAL_REQUESTED if artifact.status == ExecutionStatus.APPROVAL_REQUIRED else AuditEventType.ACTION_EXECUTED if artifact.status in {ExecutionStatus.EXECUTED, ExecutionStatus.NO_OPERATION} else AuditEventType.ACTION_REFUSED
                actor = AuditActor.SAFE_ACTION_GATE
                approval_id = artifact.approval_request.approval_request_id if artifact.approval_request else None
            before = artifact.before_state.state_version
            after = artifact.after_state.state_version
            if before != session.final_state_version:
                raise AuditValidationError("Execution state version is discontinuous with the audit session")
            return AuditEventInput(
                event_type=event_type, phase=AuditPhase.PHASE_5, actor=actor,
                summary=f"Phase 5 returned {artifact.status.value}.", explanation=artifact.fresh_evaluation.explanation,
                references=AuditReference(scenario_id=session.scenario_id, contract_fingerprint=session.contract_fingerprint, action_id=action_id, evaluation_id=evaluation_id, approval_request_id=approval_id),
                decision_or_status=artifact.status.value,
                state_transition=AuditStateTransition(before_state_version=before, after_state_version=after, live_state_changed=artifact.state_changed, redacted_state_summary=artifact.after_summary),
                policy_rule_ids=artifact.triggered_rules,
                redacted_payload_summary={"execution_id": artifact.execution_id, "status": artifact.status.value, "refusal_reason": artifact.refusal_reason.value if artifact.refusal_reason else None, "before_summary": artifact.before_summary, "after_summary": artifact.after_summary, "state_changed": artifact.state_changed},
            )
        if artifact_type == "recovery_plan":
            artifact = RecoveryPlan.model_validate(raw)
            if artifact.scenario_id != session.scenario_id or not _known_action(session, artifact.triggering_action_id) or not _known_evaluation(session, artifact.triggering_evaluation_id):
                raise AuditValidationError("Recovery plan is not bound to recorded action/evaluation artifacts")
            return AuditEventInput(
                event_type=AuditEventType.RECOVERY_PLAN_GENERATED, phase=AuditPhase.PHASE_6, actor=AuditActor.RECOVERY_PLANNER,
                summary=artifact.summary, explanation=artifact.explanation,
                references=AuditReference(scenario_id=session.scenario_id, contract_fingerprint=session.contract_fingerprint, action_id=artifact.triggering_action_id, evaluation_id=artifact.triggering_evaluation_id, recovery_plan_id=artifact.recovery_plan_id),
                decision_or_status=artifact.completion_status.value, state_transition=_none_transition(session), policy_rule_ids=[],
                redacted_payload_summary={"recovery_plan_id": artifact.recovery_plan_id, "trigger": artifact.trigger.value, "strategies": [item.value for item in artifact.strategies], "step_ids": [step.step_id for step in artifact.steps], "completion_status": artifact.completion_status.value},
            )
        if artifact_type == "recovery_execution_response":
            artifact = RecoveryExecutionResponse.model_validate(raw)
            if not _known_recovery(session, artifact.recovery_plan_id):
                raise AuditValidationError("Recovery execution is not bound to a recorded recovery plan")
            if artifact.before_state.state_version != session.final_state_version:
                raise AuditValidationError("Recovery state version is discontinuous with the audit session")
            event_type = AuditEventType.RECOVERY_STEP_EXECUTED if artifact.step_status.value == "completed" else AuditEventType.RECOVERY_STEP_REFUSED
            return AuditEventInput(
                event_type=event_type, phase=AuditPhase.PHASE_6, actor=AuditActor.RECOVERY_PLANNER,
                summary=f"Recovery step returned {artifact.step_status.value}.", explanation="The recorded step was previously processed through Phase 5.",
                references=AuditReference(scenario_id=session.scenario_id, contract_fingerprint=session.contract_fingerprint, action_id=artifact.fresh_evaluation.evaluated_action_id, evaluation_id=artifact.fresh_evaluation.evaluation_id, recovery_plan_id=artifact.recovery_plan_id, recovery_step_id=f"rz-recovery-step-{artifact.executed_step_index + 1:03d}"),
                decision_or_status=artifact.step_status.value,
                state_transition=AuditStateTransition(before_state_version=artifact.before_state.state_version, after_state_version=artifact.after_state.state_version, live_state_changed=artifact.state_changed, redacted_state_summary=artifact.execution_response.after_summary),
                policy_rule_ids=artifact.execution_response.triggered_rules,
                redacted_payload_summary={"recovery_plan_id": artifact.recovery_plan_id, "step_index": artifact.executed_step_index, "step_status": artifact.step_status.value, "execution_status": artifact.execution_response.status.value, "state_changed": artifact.state_changed},
            )
    except ValidationError as error:
        raise AuditValidationError(f"Invalid {artifact_type} artifact: {error}") from error
    raise AuditValidationError("Unsupported audit artifact type")


def append_artifact(request: AuditAppendRequest) -> tuple[AuditSession, AuditEvent]:
    verification = verify_session(request.session)
    if verification.integrity_status != AuditIntegrityStatus.VALID:
        raise AuditValidationError("Cannot append to an invalid or tampered audit chain")
    event_input = _artifact_event(request.session, request.source_artifact.artifact_type, request.source_artifact.artifact)
    if request.claimed_decision and request.claimed_decision != event_input.decision_or_status:
        raise AuditValidationError("Client-supplied decision contradicts the typed artifact")
    sequence = request.session.event_count + 1
    event = _make_event(request.session.session_id, sequence, request.session.head_hash, event_input)
    events = [*request.session.events, event]
    transition = event.state_transition
    final_version = transition.after_state_version if transition.after_state_version is not None else request.session.final_state_version
    session = request.session.model_copy(update={
        "events": events, "event_count": len(events), "head_hash": event.current_event_hash,
        "final_state_version": final_version, "integrity_status": AuditIntegrityStatus.VALID,
    })
    return session, event


def _outcome(session: AuditSession) -> AuditOutcomeSummary:
    types = [event.event_type for event in session.events]
    completion = "full" if AuditEventType.TASK_COMPLETED in types or any(event.decision_or_status == "full_completion" for event in session.events) else "partial" if AuditEventType.TASK_PARTIALLY_COMPLETED in types or any(event.decision_or_status == "partial_completion" for event in session.events) else "in_progress"
    blocked = types.count(AuditEventType.ACTION_BLOCKED)
    refused = types.count(AuditEventType.ACTION_REFUSED) + types.count(AuditEventType.RECOVERY_STEP_REFUSED)
    return AuditOutcomeSummary(
        original_goal=str(session.contract_summary.get("normalized_intent", "unknown")),
        constraints_preserved=[f"budget={session.contract_summary.get('maximum_budget')}", "payment/data/subscription restrictions preserved"],
        unsafe_actions_blocked=blocked, allowed_actions=types.count(AuditEventType.ACTION_ALLOWED),
        approvals_requested=types.count(AuditEventType.APPROVAL_REQUESTED), approvals_approved=types.count(AuditEventType.APPROVAL_APPROVED), approvals_rejected=types.count(AuditEventType.APPROVAL_REJECTED),
        controlled_actions_executed=types.count(AuditEventType.ACTION_EXECUTED), refused_actions=refused,
        recovery_plans=types.count(AuditEventType.RECOVERY_PLAN_GENERATED), recovery_steps_executed=types.count(AuditEventType.RECOVERY_STEP_EXECUTED),
        final_state_version=session.final_state_version, completion=completion,
        safety_summary=f"Verified {len(session.events)} recorded events; {blocked + refused} unsafe or refused outcomes remained non-authoritative.",
    )


def verify_session(session: AuditSession) -> AuditVerificationResponse:
    integrity: list[AuditVerificationFinding] = []
    relationships: list[AuditVerificationFinding] = []
    continuity: list[AuditVerificationFinding] = []
    previous = GENESIS_HASH
    state_version = session.initial_state.state_version
    first_invalid: int | None = None
    actions: set[str] = set()
    evaluations: set[str] = set()
    recoveries: set[str] = set()
    expected_session_id = f"rz-audit-{_digest({'scenario_id': session.scenario_id, 'contract_fingerprint': session.contract_fingerprint, 'initial_state': session.initial_state.model_dump(mode='json')})[:24]}"
    if session.session_id != expected_session_id:
        integrity.append(AuditVerificationFinding(code="SESSION_BINDING_INVALID", severity="critical", message="Session ID does not match scenario, contract, and initial state binding"))
        first_invalid = 1
    for index, event in enumerate(session.events, start=1):
        invalid_message: str | None = None
        if event.session_id != session.session_id:
            invalid_message = "Event session ID mismatch"
        elif event.sequence_number != index:
            invalid_message = "Event sequence is not contiguous"
        elif event.references.scenario_id != session.scenario_id:
            invalid_message = "Event scenario mismatch"
        elif event.previous_event_hash != previous:
            invalid_message = "Previous-event hash link mismatch"
        elif event.payload_digest != _digest(event.redacted_payload_summary):
            invalid_message = "Redacted payload digest mismatch"
        else:
            event_input = AuditEventInput.model_validate(event.model_dump(exclude={"schema_version", "session_id", "event_id", "sequence_number", "previous_event_hash", "current_event_hash", "payload_digest", "integrity"}))
            expected = _event_hash(_event_material(session.session_id, index, event_input, event.payload_digest, previous))
            if not hmac.compare_digest(event.current_event_hash, expected):
                invalid_message = "Event HMAC mismatch"
            elif event.event_id != f"rz-audit-event-{event.current_event_hash[:20]}":
                invalid_message = "Event ID is not derived from its authenticated hash"
        if invalid_message:
            first_invalid = first_invalid or index
            integrity.append(AuditVerificationFinding(code="CHAIN_INVALID", severity="critical", sequence_number=index, message=invalid_message))
        previous = event.current_event_hash
        ref = event.references
        if event.event_type == AuditEventType.WORKER_ACTION_PROPOSED and ref.action_id:
            actions.add(ref.action_id)
        elif ref.action_id and event.event_type in {AuditEventType.ACTION_ALLOWED, AuditEventType.ACTION_BLOCKED, AuditEventType.APPROVAL_REQUESTED} and ref.action_id not in actions:
            relationships.append(AuditVerificationFinding(code="ACTION_REFERENCE_MISSING", severity="critical", sequence_number=index, message="Evaluation references an unrecorded action"))
        if ref.evaluation_id:
            evaluations.add(ref.evaluation_id)
        if event.event_type == AuditEventType.RECOVERY_PLAN_GENERATED:
            if ref.action_id not in actions or ref.evaluation_id not in evaluations:
                relationships.append(AuditVerificationFinding(code="RECOVERY_BINDING_INVALID", severity="critical", sequence_number=index, message="Recovery plan binding is incomplete"))
            if ref.recovery_plan_id:
                recoveries.add(ref.recovery_plan_id)
        if event.event_type in {AuditEventType.RECOVERY_STEP_EXECUTED, AuditEventType.RECOVERY_STEP_REFUSED} and ref.recovery_plan_id not in recoveries:
            relationships.append(AuditVerificationFinding(code="RECOVERY_REFERENCE_MISSING", severity="critical", sequence_number=index, message="Recovery step references an unrecorded plan"))
        transition = event.state_transition
        if transition.before_state_version is not None:
            if transition.before_state_version != state_version:
                continuity.append(AuditVerificationFinding(code="STATE_VERSION_DISCONTINUITY", severity="critical", sequence_number=index, message=f"Expected state version {state_version}, found {transition.before_state_version}"))
            if transition.after_state_version is not None:
                if transition.live_state_changed and transition.after_state_version <= transition.before_state_version:
                    continuity.append(AuditVerificationFinding(code="STATE_CHANGE_VERSION_INVALID", severity="critical", sequence_number=index, message="Changed state did not advance its version"))
                if not transition.live_state_changed and transition.after_state_version != transition.before_state_version:
                    continuity.append(AuditVerificationFinding(code="UNCHANGED_STATE_VERSION_INVALID", severity="critical", sequence_number=index, message="Unchanged state altered its version"))
                state_version = transition.after_state_version
    if session.event_count != len(session.events):
        first_invalid = first_invalid or len(session.events) + 1
        integrity.append(AuditVerificationFinding(code="EVENT_COUNT_MISMATCH", severity="critical", message="Stored event count differs from chain length"))
    if session.head_hash != previous:
        first_invalid = first_invalid or max(1, len(session.events))
        integrity.append(AuditVerificationFinding(code="HEAD_HASH_MISMATCH", severity="critical", message="Session head hash does not match the final event"))
    if session.final_state_version != state_version:
        continuity.append(AuditVerificationFinding(code="FINAL_STATE_VERSION_MISMATCH", severity="critical", message="Session final state version is inconsistent"))
    if session.events:
        genesis_payload = session.events[0].redacted_payload_summary
        if genesis_payload.get("contract") != session.contract_summary or genesis_payload.get("original_instruction") != session.original_instruction:
            integrity.append(AuditVerificationFinding(code="SESSION_METADATA_MISMATCH", severity="critical", sequence_number=1, message="Session metadata differs from the authenticated genesis payload"))
            first_invalid = first_invalid or 1
    valid = not integrity and not relationships and not continuity
    return AuditVerificationResponse(
        integrity_status=AuditIntegrityStatus.VALID if valid else AuditIntegrityStatus.INVALID,
        verified_event_count=len(session.events) if valid else max(0, (first_invalid or 1) - 1),
        first_invalid_sequence=first_invalid,
        integrity_findings=integrity or [AuditVerificationFinding(code="CHAIN_VALID", severity="info", message="Every event hash and link is valid")],
        relationship_findings=relationships,
        state_continuity_findings=continuity,
        scenario_consistent=not any(item.code == "CHAIN_INVALID" and "scenario" in item.message.lower() for item in integrity),
        outcome=_outcome(session),
    )


def export_session(request: AuditExportRequest) -> AuditExportResponse:
    verification = verify_session(request.session)
    safe_session = request.session.model_dump(mode="json")
    if request.format == "json":
        content = json.dumps({"project": "Rule Zero", "session": safe_session, "verification": verification.model_dump(mode="json")}, indent=2, ensure_ascii=False)
        filename, media = f"{request.session.session_id}.json", "application/json"
    else:
        lines = [
            "# Rule Zero Audit Report", "", f"- Session: `{request.session.session_id}`",
            f"- Scenario: `{request.session.scenario_id}`", f"- Integrity: **{verification.integrity_status.value}**",
            f"- Original instruction: {request.session.original_instruction}", "", "## Task Contract Summary", "",
            f"- Goal: {verification.outcome.original_goal}", f"- Budget: INR {request.session.contract_summary.get('maximum_budget')}",
            "", "## Chronological Timeline", "",
        ]
        for event in request.session.events:
            transition = event.state_transition
            lines.append(f"{event.sequence_number}. **{event.event_type.value}** — {event.summary} ({event.actor.value}, {event.phase.value}, state {transition.before_state_version} → {transition.after_state_version}, rules: {', '.join(event.policy_rule_ids) or 'none'})")
        lines.extend(["", "## Final Outcome", "", verification.outcome.safety_summary, f"Final controlled state version: {verification.outcome.final_state_version}."])
        content = "\n".join(lines)
        filename, media = f"{request.session.session_id}.md", "text/markdown"
    return AuditExportResponse(format=request.format, filename=filename, media_type=media, content=content, verification=verification)
