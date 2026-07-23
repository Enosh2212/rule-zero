from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.contracts.models import TaskContract
from app.worker.models import ActionSourceType, AgentActionType, ProposedAgentAction


class InterceptorModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class RuleZeroDecision(str, Enum):
    ALLOW = "allow"
    BLOCK = "block"
    ASK_APPROVAL = "ask_approval"


class PolicyRuleId(str, Enum):
    BASE_001 = "RZ-BASE-001"
    BUDGET_001 = "RZ-BUDGET-001"
    BUDGET_002 = "RZ-BUDGET-002"
    CATEGORY_001 = "RZ-CATEGORY-001"
    ADDON_001 = "RZ-ADDON-001"
    ADDON_002 = "RZ-ADDON-002"
    SUB_001 = "RZ-SUB-001"
    RECUR_001 = "RZ-RECUR-001"
    PAY_001 = "RZ-PAY-001"
    ORDER_001 = "RZ-ORDER-001"
    DATA_001 = "RZ-DATA-001"
    NAV_001 = "RZ-NAV-001"
    SOURCE_001 = "RZ-SOURCE-001"
    SOURCE_002 = "RZ-SOURCE-002"
    DEFAULT_001 = "RZ-DEFAULT-001"
    FINISH_001 = "RZ-FINISH-001"


class PolicySeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class PolicyFinding(InterceptorModel):
    rule_id: PolicyRuleId
    severity: PolicySeverity
    recommended_decision: RuleZeroDecision
    message: str = Field(min_length=1)
    evidence: list[str]


class ContractConflict(InterceptorModel):
    action_type: AgentActionType
    contract_field: str = Field(min_length=1)
    contract_value: str = Field(min_length=1)
    explanation: str = Field(min_length=1)


class ConsequenceAssessment(InterceptorModel):
    currency: Literal["INR"]
    immediate_one_time_cost: int | None = Field(default=None, ge=0)
    recurring_monthly_cost: int | None = Field(default=None, ge=0)
    current_due_today_total: int = Field(ge=0)
    projected_due_today_total: int | None = Field(default=None, ge=0)
    financial_impact_known: bool
    summary: str = Field(min_length=1)


class EvaluationContext(InterceptorModel):
    currency: Literal["INR"] = "INR"
    current_cart_total: int = Field(ge=0)
    projected_cart_total: int | None = Field(default=None, ge=0)
    immediate_one_time_cost: int | None = Field(default=None, ge=0)
    recurring_monthly_cost: int | None = Field(default=None, ge=0)
    financial_impact_known: bool
    item_category: str | None = None
    optional_addon: bool = False


class SourceTrustAssessment(InterceptorModel):
    source_type: ActionSourceType
    trust_classification: Literal["trusted", "untrusted"]
    authorizes_action: Literal[False] = False
    summary: str = Field(min_length=1)


class DecisionTrace(InterceptorModel):
    precedence: list[str]
    evaluated_rules: list[PolicyRuleId]
    resolution: str = Field(min_length=1)


class ActionEvaluationRequest(InterceptorModel):
    scenario_id: Literal["shopping-trap"]
    contract: TaskContract
    proposed_action: ProposedAgentAction
    context: EvaluationContext


class ActionEvaluationResponse(InterceptorModel):
    schema_version: Literal["1.0"] = "1.0"
    evaluation_id: str = Field(pattern=r"^rz-eval-[a-f0-9]{16}$")
    evaluated_action_id: str
    scenario_id: Literal["shopping-trap"]
    decision: RuleZeroDecision
    summary: str
    explanation: str
    triggered_policy_findings: list[PolicyFinding]
    matched_contract_permissions: list[str]
    detected_contract_conflicts: list[ContractConflict]
    action_source_trust_assessment: SourceTrustAssessment
    consequence_assessment: ConsequenceAssessment
    decision_trace: DecisionTrace
    human_approval_required: bool
    execution_occurred: Literal[False] = False
