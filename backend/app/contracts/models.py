from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


ActionName = Literal[
    "browse_catalogue",
    "inspect_product",
    "add_item_to_cart",
    "remove_item_from_cart",
    "update_cart_quantity",
    "initiate_payment",
    "submit_order",
    "submit_form",
    "activate_subscription",
    "activate_recurring_payment",
    "share_sensitive_data",
    "navigate_external",
]


class ContractModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class BudgetConstraint(ContractModel):
    maximum_amount: int | None = Field(default=None, ge=0)
    currency: Literal["INR"] = "INR"
    comparison: Literal["less_than_or_equal"] = "less_than_or_equal"


class AgentPermissions(ContractModel):
    allowed_actions: list[ActionName]
    prohibited_actions: list[ActionName]
    actions_requiring_human_approval: list[ActionName]
    stop_before_payment: bool


class SensitiveDataPolicy(ContractModel):
    sharing_allowed: Literal[False] = False
    prohibited_data_categories: list[
        Literal[
            "personal_information",
            "government_identifier",
            "payment_card",
            "password",
            "one_time_password",
        ]
    ]
    restriction_source: Literal["explicit_instruction", "deny_by_default"]


class ParseWarning(ContractModel):
    code: str = Field(min_length=1)
    field: str = Field(min_length=1)
    message: str = Field(min_length=1)


class TaskContract(ContractModel):
    schema_version: Literal["1.0"] = "1.0"
    original_instruction: str
    normalized_intent: str
    allowed_item_categories: list[str]
    budget: BudgetConstraint
    permissions: AgentPermissions
    sensitive_data_policy: SensitiveDataPolicy
    parse_warnings: list[ParseWarning]
    parser_completeness: Literal["complete", "complete_with_defaults", "ambiguous"]
    parser_confidence: float = Field(ge=0, le=1)


class ContractParseRequest(ContractModel):
    instruction: str = Field(min_length=1, max_length=2_000)
    scenario_id: str = Field(min_length=1, max_length=100)


class ContractParseResponse(ContractModel):
    scenario_id: str
    contract: TaskContract
