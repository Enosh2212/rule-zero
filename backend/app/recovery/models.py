from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.action_gate.models import ActionExecutionResponse, ControlledShoppingState
from app.contracts.models import TaskContract
from app.interceptor.models import ActionEvaluationResponse
from app.worker.models import ProposedAgentAction


class RecoveryModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class RecoveryTrigger(str, Enum):
    BLOCKED_ACTION = "blocked_action"
    REJECTED_APPROVAL = "rejected_approval"
    BUDGET_VIOLATION = "budget_violation"
    PROHIBITED_SUBSCRIPTION = "prohibited_subscription"
    PROHIBITED_RECURRING_PAYMENT = "prohibited_recurring_payment"
    PROHIBITED_PAYMENT = "prohibited_payment"
    PROHIBITED_ORDER_SUBMISSION = "prohibited_order_submission"
    PROHIBITED_SENSITIVE_DATA = "prohibited_sensitive_data"
    UNTRUSTED_INSTRUCTION = "untrusted_instruction"
    STALE_STATE = "stale_state"
    UNSUPPORTED_ACTION = "unsupported_action"
    USER_CANCELLED_APPROVAL = "user_cancelled_approval"


class RecoveryReason(str, Enum):
    CONTRACT_PROHIBITION = "contract_prohibition"
    BUDGET_LIMIT = "budget_limit"
    HUMAN_REJECTION = "human_rejection"
    STATE_VERSION_CONFLICT = "state_version_conflict"
    HARD_SIDE_EFFECT_BOUNDARY = "hard_side_effect_boundary"


class RecoveryStrategy(str, Enum):
    SKIP_PROHIBITED_ACTION = "skip_prohibited_action"
    DISABLE_SUBSCRIPTION = "disable_subscription"
    DISABLE_OPTIONAL_ADDON = "disable_optional_addon"
    RESTORE_BUDGET_COMPLIANCE = "restore_budget_compliance"
    RETURN_TO_ALLOWED_ITEM = "return_to_allowed_item"
    STOP_BEFORE_PAYMENT = "stop_before_payment"
    REMAIN_ON_CURRENT_DOMAIN = "remain_on_current_domain"
    OMIT_SENSITIVE_DATA = "omit_sensitive_data"
    REFRESH_CONTROLLED_STATE = "refresh_controlled_state"
    FINISH_WITH_SAFE_PARTIAL_COMPLETION = "finish_with_safe_partial_completion"


class RecoveryActionStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    REFUSED = "refused"
    APPROVAL_REQUIRED = "approval_required"
    SKIPPED = "skipped"


class RecoveryCompletionStatus(str, Enum):
    IN_PROGRESS = "in_progress"
    FULL = "full_completion"
    PARTIAL = "partial_completion"
    IMPOSSIBLE = "safe_completion_impossible"


class RecoveryStep(RecoveryModel):
    step_id: str = Field(pattern=r"^rz-recovery-step-[0-9]{3}$")
    sequence_number: int = Field(ge=1)
    expected_state_version: int = Field(ge=0)
    proposed_action: ProposedAgentAction
    reason: str
    preserved_constraint: str
    expected_consequence: str
    mutates_controlled_state: bool
    approval_may_be_required: bool
    execution_status: RecoveryActionStatus = RecoveryActionStatus.PENDING


class RecoveryTrace(RecoveryModel):
    steps: list[str]


class RecoveryPlan(RecoveryModel):
    schema_version: Literal["1.0"] = "1.0"
    recovery_plan_id: str = Field(pattern=r"^rz-recovery-[a-f0-9]{24}$")
    scenario_id: Literal["shopping-trap"]
    contract_fingerprint: str
    triggering_action_id: str
    triggering_action_fingerprint: str
    triggering_evaluation_id: str
    bound_state_version: int
    trigger: RecoveryTrigger
    reason: RecoveryReason
    strategies: list[RecoveryStrategy]
    summary: str
    explanation: str
    preserved_user_constraints: list[str]
    unsafe_behaviour_removed: list[str]
    steps: list[RecoveryStep] = Field(min_length=1)
    expected_final_state: ControlledShoppingState
    full_task_completion_possible: bool
    human_approval_may_still_be_required: bool
    completion_status: RecoveryCompletionStatus
    trace: RecoveryTrace
    warnings: list[str]


class RecoveryPlanRequest(RecoveryModel):
    scenario_id: Literal["shopping-trap"]
    contract: TaskContract
    triggering_action: ProposedAgentAction
    evaluation: ActionEvaluationResponse
    execution_response: ActionExecutionResponse | None = None
    current_state: ControlledShoppingState


class RecoveryPlanResponse(RecoveryModel):
    schema_version: Literal["1.0"] = "1.0"
    recovery_plan: RecoveryPlan


class RecoveryExecutionRequest(RecoveryModel):
    scenario_id: Literal["shopping-trap"]
    contract: TaskContract
    recovery_plan: RecoveryPlan
    step_index: int = Field(ge=0)
    current_state: ControlledShoppingState


class RecoveryExecutionResponse(RecoveryModel):
    schema_version: Literal["1.0"] = "1.0"
    recovery_plan_id: str
    executed_step_index: int
    step_status: RecoveryActionStatus
    next_step_index: int | None
    completion_status: RecoveryCompletionStatus
    fresh_evaluation: ActionEvaluationResponse
    execution_response: ActionExecutionResponse
    before_state: ControlledShoppingState
    after_state: ControlledShoppingState
    state_changed: bool
    trace: RecoveryTrace
