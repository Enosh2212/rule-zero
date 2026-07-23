from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.contracts.models import TaskContract
from app.interceptor.models import ActionEvaluationResponse
from app.worker.models import ProposedAgentAction


class GateModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ControlledCartLine(GateModel):
    product_id: str
    quantity: int = Field(ge=1)
    unit_price: int = Field(ge=0)


class ControlledAddonState(GateModel):
    warranty_enabled: bool = False
    membership_enabled: bool = False


class ControlledShoppingState(GateModel):
    scenario_id: Literal["shopping-trap"] = "shopping-trap"
    cart_items: list[ControlledCartLine]
    addons: ControlledAddonState
    checkout_preview_reached: bool = False
    simulation_completed: bool = False
    state_version: int = Field(ge=0)


class CanonicalProduct(GateModel):
    product_id: str
    category: Literal["power_bank"]
    price: int
    stock: int


class CanonicalScenarioSnapshot(GateModel):
    schema_version: Literal["1.0"] = "1.0"
    products: list[CanonicalProduct]
    warranty_id: str
    warranty_price: int
    membership_id: str
    membership_monthly_price: int
    supported_actions: list[str]
    state: ControlledShoppingState


class ExecutionStatus(str, Enum):
    EXECUTED = "executed"
    REFUSED = "refused"
    APPROVAL_REQUIRED = "approval_required"
    REJECTED = "rejected"
    NO_OPERATION = "no_operation"


class ExecutionRefusalReason(str, Enum):
    RULE_ZERO_BLOCK = "rule_zero_block"
    INVALID_STATE = "invalid_state"
    STALE_STATE = "stale_state"
    INVALID_TARGET = "invalid_target"
    UNSUPPORTED_ACTION = "unsupported_action"
    INVALID_APPROVAL = "invalid_approval"
    APPROVAL_BINDING_MISMATCH = "approval_binding_mismatch"
    PROHIBITED_SIDE_EFFECT = "prohibited_side_effect"


class ApprovalStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXPIRED = "expired"
    CONSUMED = "consumed"


class ApprovalRequest(GateModel):
    approval_request_id: str
    status: Literal[ApprovalStatus.PENDING] = ApprovalStatus.PENDING
    scenario_id: Literal["shopping-trap"]
    action_id: str
    contract_fingerprint: str
    state_version: int
    immediate_one_time_cost: int | None
    recurring_monthly_cost: int | None
    projected_total: int | None
    triggered_rules: list[str]
    reason: str
    single_use_warning: str


class ApprovalRecord(GateModel):
    approval_request_id: str
    scenario_id: Literal["shopping-trap"]
    action_id: str
    state_version: int
    status: ApprovalStatus
    message: str


class ActionExecutionRequest(GateModel):
    scenario_id: Literal["shopping-trap"]
    contract: TaskContract
    proposed_action: ProposedAgentAction
    current_state: ControlledShoppingState
    expected_state_version: int = Field(ge=0)
    approval: ApprovalRecord | None = None


class ApprovalDecisionRequest(GateModel):
    scenario_id: Literal["shopping-trap"]
    contract: TaskContract
    proposed_action: ProposedAgentAction
    current_state: ControlledShoppingState
    approval_request_id: str
    decision: Literal["approve", "reject"]


class ExecutionTrace(GateModel):
    steps: list[str]


class ActionExecutionResponse(GateModel):
    schema_version: Literal["1.0"] = "1.0"
    execution_id: str
    status: ExecutionStatus
    refusal_reason: ExecutionRefusalReason | None
    before_state: ControlledShoppingState
    after_state: ControlledShoppingState
    before_summary: str
    after_summary: str
    fresh_evaluation: ActionEvaluationResponse
    approval_request: ApprovalRequest | None = None
    approval_record: ApprovalRecord | None = None
    triggered_rules: list[str]
    execution_trace: ExecutionTrace
    execution_occurred: bool
    state_changed: bool
