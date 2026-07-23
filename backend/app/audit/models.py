from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

from app.action_gate.models import ControlledShoppingState
from app.contracts.models import TaskContract


class AuditModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class AuditActor(str, Enum):
    USER = "user"
    TASK_CONTRACT_ENGINE = "task_contract_engine"
    WORKER_AGENT = "worker_agent"
    RULE_ZERO_INTERCEPTOR = "rule_zero_interceptor"
    SAFE_ACTION_GATE = "safe_action_gate"
    HUMAN_APPROVAL = "human_approval"
    RECOVERY_PLANNER = "recovery_planner"
    SYSTEM = "system"


class AuditPhase(str, Enum):
    PHASE_2 = "phase_2"
    PHASE_3 = "phase_3"
    PHASE_4 = "phase_4"
    PHASE_5 = "phase_5"
    PHASE_6 = "phase_6"
    PHASE_7 = "phase_7"


class AuditEventType(str, Enum):
    SESSION_STARTED = "session_started"
    CONTRACT_GENERATED = "contract_generated"
    WORKER_ACTION_PROPOSED = "worker_action_proposed"
    ACTION_EVALUATED = "action_evaluated"
    ACTION_ALLOWED = "action_allowed"
    ACTION_BLOCKED = "action_blocked"
    APPROVAL_REQUESTED = "approval_requested"
    APPROVAL_APPROVED = "approval_approved"
    APPROVAL_REJECTED = "approval_rejected"
    ACTION_EXECUTED = "action_executed"
    ACTION_REFUSED = "action_refused"
    RECOVERY_PLAN_GENERATED = "recovery_plan_generated"
    RECOVERY_STEP_EXECUTED = "recovery_step_executed"
    RECOVERY_STEP_REFUSED = "recovery_step_refused"
    STATE_CHANGED = "state_changed"
    TASK_COMPLETED = "task_completed"
    TASK_PARTIALLY_COMPLETED = "task_partially_completed"
    SESSION_RESET = "session_reset"


class AuditIntegrityStatus(str, Enum):
    VALID = "valid"
    INVALID = "invalid"
    UNVERIFIED = "unverified"


class AuditReference(AuditModel):
    scenario_id: Literal["shopping-trap"]
    contract_fingerprint: str | None = None
    action_id: str | None = None
    evaluation_id: str | None = None
    approval_request_id: str | None = None
    recovery_plan_id: str | None = None
    recovery_step_id: str | None = None


class AuditStateTransition(AuditModel):
    before_state_version: int | None = Field(default=None, ge=0)
    after_state_version: int | None = Field(default=None, ge=0)
    live_state_changed: bool = False
    redacted_state_summary: str


class AuditEventInput(AuditModel):
    event_type: AuditEventType
    phase: AuditPhase
    actor: AuditActor
    summary: str
    explanation: str
    references: AuditReference
    decision_or_status: str | None = None
    state_transition: AuditStateTransition
    policy_rule_ids: list[str]
    redacted_payload_summary: dict[str, Any]


class AuditIntegrityMetadata(AuditModel):
    algorithm: Literal["HMAC-SHA256"] = "HMAC-SHA256"
    redaction_version: Literal["1.0"] = "1.0"
    server_signed: Literal[True] = True


class AuditEvent(AuditEventInput):
    schema_version: Literal["1.0"] = "1.0"
    session_id: str
    event_id: str
    sequence_number: int = Field(ge=1)
    previous_event_hash: str
    current_event_hash: str
    payload_digest: str
    integrity: AuditIntegrityMetadata


class AuditSession(AuditModel):
    schema_version: Literal["1.0"] = "1.0"
    session_id: str
    scenario_id: Literal["shopping-trap"]
    contract_fingerprint: str
    original_instruction: str
    contract_summary: dict[str, Any]
    initial_state: ControlledShoppingState
    final_state_version: int
    events: list[AuditEvent]
    event_count: int
    head_hash: str
    integrity_status: AuditIntegrityStatus


class AuditSessionStartRequest(AuditModel):
    scenario_id: Literal["shopping-trap"]
    contract: TaskContract
    initial_state: ControlledShoppingState


class AuditSessionStartResponse(AuditModel):
    session: AuditSession


class AuditSourceArtifact(AuditModel):
    artifact_type: Literal[
        "worker_proposal", "evaluation", "execution_response", "approval_response",
        "recovery_plan", "recovery_execution_response",
    ]
    artifact: dict[str, Any]


class AuditAppendRequest(AuditModel):
    session: AuditSession
    source_artifact: AuditSourceArtifact
    claimed_decision: str | None = None


class AuditAppendResponse(AuditModel):
    session: AuditSession
    appended_event: AuditEvent


class AuditVerificationFinding(AuditModel):
    code: str
    severity: Literal["info", "warning", "critical"]
    sequence_number: int | None = None
    message: str


class AuditOutcomeSummary(AuditModel):
    original_goal: str
    constraints_preserved: list[str]
    unsafe_actions_blocked: int
    allowed_actions: int
    approvals_requested: int
    approvals_approved: int
    approvals_rejected: int
    controlled_actions_executed: int
    refused_actions: int
    recovery_plans: int
    recovery_steps_executed: int
    final_state_version: int
    completion: Literal["in_progress", "full", "partial"]
    safety_summary: str


class AuditVerificationRequest(AuditModel):
    session: AuditSession


class AuditVerificationResponse(AuditModel):
    integrity_status: AuditIntegrityStatus
    verified_event_count: int
    first_invalid_sequence: int | None
    integrity_findings: list[AuditVerificationFinding]
    relationship_findings: list[AuditVerificationFinding]
    state_continuity_findings: list[AuditVerificationFinding]
    scenario_consistent: bool
    outcome: AuditOutcomeSummary


class AuditExportRequest(AuditModel):
    session: AuditSession
    format: Literal["json", "markdown"]


class AuditExportResponse(AuditModel):
    format: Literal["json", "markdown"]
    filename: str
    media_type: str
    content: str
    verification: AuditVerificationResponse
