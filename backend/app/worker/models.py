from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.contracts.models import TaskContract


class WorkerModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class AgentActionType(str, Enum):
    INSPECT_CATALOGUE = "inspect_catalogue"
    INSPECT_PRODUCT = "inspect_product"
    ADD_ITEM = "add_item"
    REMOVE_ITEM = "remove_item"
    UPDATE_QUANTITY = "update_quantity"
    TOGGLE_ADDON = "toggle_addon"
    ACTIVATE_SUBSCRIPTION = "activate_subscription"
    REVIEW_CART = "review_cart"
    PROCEED_TO_CHECKOUT = "proceed_to_checkout"
    ENTER_SENSITIVE_DATA = "enter_sensitive_data"
    SUBMIT_ORDER = "submit_order"
    MAKE_PAYMENT = "make_payment"
    NAVIGATE_EXTERNAL = "navigate_external"
    FINISH_TASK = "finish_task"


class ActionSourceType(str, Enum):
    USER_INSTRUCTION = "user_instruction"
    TRUSTED_APPLICATION_STATE = "trusted_application_state"
    VISIBLE_WEBPAGE_CONTENT = "visible_webpage_content"
    UNTRUSTED_WEBPAGE_INSTRUCTION = "untrusted_webpage_instruction"
    WORKER_DEFAULT_BEHAVIOUR = "worker_default_behaviour"


class ActionSource(WorkerModel):
    type: ActionSourceType
    trust_classification: Literal["trusted", "untrusted"]
    evidence: str = Field(min_length=1)


class ActionTarget(WorkerModel):
    type: Literal[
        "catalogue",
        "product",
        "cart",
        "addon",
        "checkout",
        "payment",
        "task",
        "order",
        "field",
        "external",
    ]
    id: str = Field(min_length=1)


ActionPayloadValue = str | int | bool


class ProposedAgentAction(WorkerModel):
    schema_version: Literal["1.0"] = "1.0"
    action_id: str = Field(pattern=r"^shopping-trap-action-[0-9]{3}$")
    sequence_number: int = Field(ge=1)
    scenario_id: Literal["shopping-trap"]
    action_type: AgentActionType
    description: str = Field(min_length=1)
    target: ActionTarget
    payload: dict[str, ActionPayloadValue]
    rationale: str = Field(min_length=1)
    source: ActionSource
    expected_consequence: str = Field(min_length=1)
    would_mutate_state: bool


class WorkerObservation(WorkerModel):
    catalogue_product_ids: list[str] = Field(min_length=1)
    within_budget_product_id: str = Field(min_length=1)
    within_budget_product_price: int = Field(ge=0)
    warranty_selected: bool
    membership_selected: bool
    checkout_state: Literal["catalogue", "cart", "checkout_preview"]
    untrusted_webpage_instruction: str = Field(min_length=1)


class WorkerStepRequest(WorkerModel):
    scenario_id: str = Field(min_length=1, max_length=100)
    step_index: int = Field(ge=0)
    contract: TaskContract | None = None
    observation: WorkerObservation


class WorkerCompletionState(WorkerModel):
    status: Literal["in_progress", "complete"]
    message: str = Field(min_length=1)


class WorkerStepResponse(WorkerModel):
    proposed_action: ProposedAgentAction
    next_step_index: int = Field(ge=1)
    is_complete: bool
    completion: WorkerCompletionState
