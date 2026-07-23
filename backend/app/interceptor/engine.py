import hashlib
import json

from app.contracts.models import ActionName
from app.worker.models import ActionSourceType, AgentActionType

from .models import (
    ActionEvaluationRequest,
    ActionEvaluationResponse,
    ConsequenceAssessment,
    ContractConflict,
    DecisionTrace,
    PolicyFinding,
    PolicyRuleId,
    PolicySeverity,
    RuleZeroDecision,
    SourceTrustAssessment,
)

READ_ONLY_ACTIONS = {
    AgentActionType.INSPECT_CATALOGUE,
    AgentActionType.INSPECT_PRODUCT,
    AgentActionType.REVIEW_CART,
}
FINANCIAL_MUTATIONS = {
    AgentActionType.ADD_ITEM,
    AgentActionType.UPDATE_QUANTITY,
    AgentActionType.TOGGLE_ADDON,
    AgentActionType.ACTIVATE_SUBSCRIPTION,
    AgentActionType.SUBMIT_ORDER,
    AgentActionType.MAKE_PAYMENT,
}
ACTION_PERMISSION_MAP: dict[AgentActionType, ActionName] = {
    AgentActionType.INSPECT_CATALOGUE: "browse_catalogue",
    AgentActionType.INSPECT_PRODUCT: "inspect_product",
    AgentActionType.ADD_ITEM: "add_item_to_cart",
    AgentActionType.REMOVE_ITEM: "remove_item_from_cart",
    AgentActionType.UPDATE_QUANTITY: "update_cart_quantity",
    AgentActionType.ACTIVATE_SUBSCRIPTION: "activate_subscription",
    AgentActionType.ENTER_SENSITIVE_DATA: "share_sensitive_data",
    AgentActionType.SUBMIT_ORDER: "submit_order",
    AgentActionType.MAKE_PAYMENT: "initiate_payment",
    AgentActionType.NAVIGATE_EXTERNAL: "navigate_external",
}
TRACE_PRECEDENCE = [
    "schema validation",
    "explicit contract prohibitions",
    "category, subscription, recurring, payment, order, and sensitive-data blocks",
    "known budget violations",
    "untrusted-instruction contract conflicts",
    "unknown impact and missing authority defaults",
    "human-approval requirements",
    "safe read-only, permitted, and finish actions",
]


def _finding(
    rule_id: PolicyRuleId,
    severity: PolicySeverity,
    decision: RuleZeroDecision,
    message: str,
    *evidence: str,
) -> PolicyFinding:
    return PolicyFinding(
        rule_id=rule_id,
        severity=severity,
        recommended_decision=decision,
        message=message,
        evidence=list(evidence),
    )


def _stable_evaluation_id(request: ActionEvaluationRequest) -> str:
    canonical = json.dumps(request.model_dump(mode="json"), sort_keys=True, separators=(",", ":"))
    return f"rz-eval-{hashlib.sha256(canonical.encode('utf-8')).hexdigest()[:16]}"


def _resolve(findings: list[PolicyFinding]) -> RuleZeroDecision:
    decisions = {finding.recommended_decision for finding in findings}
    if RuleZeroDecision.BLOCK in decisions:
        return RuleZeroDecision.BLOCK
    if RuleZeroDecision.ASK_APPROVAL in decisions:
        return RuleZeroDecision.ASK_APPROVAL
    return RuleZeroDecision.ALLOW


def _consequence(request: ActionEvaluationRequest) -> ConsequenceAssessment:
    context = request.context
    if not context.financial_impact_known:
        summary = "Financial impact is unknown and cannot be safely calculated."
    elif context.recurring_monthly_cost:
        summary = (
            f"Known impact: INR {context.immediate_one_time_cost or 0} immediate and "
            f"INR {context.recurring_monthly_cost}/month recurring; projected due today is "
            f"INR {context.projected_cart_total or 0}."
        )
    else:
        summary = (
            f"Known impact: INR {context.immediate_one_time_cost or 0} immediate; "
            f"projected due today is INR {context.projected_cart_total or 0}."
        )
    return ConsequenceAssessment(
        currency=context.currency,
        immediate_one_time_cost=context.immediate_one_time_cost,
        recurring_monthly_cost=context.recurring_monthly_cost,
        current_due_today_total=context.current_cart_total,
        projected_due_today_total=context.projected_cart_total,
        financial_impact_known=context.financial_impact_known,
        summary=summary,
    )


def evaluate_action(request: ActionEvaluationRequest) -> ActionEvaluationResponse:
    action = request.proposed_action
    contract = request.contract
    context = request.context
    findings: list[PolicyFinding] = []
    conflicts: list[ContractConflict] = []
    matched_permissions: list[str] = []

    mapped_permission = ACTION_PERMISSION_MAP.get(action.action_type)
    if mapped_permission:
        if mapped_permission in contract.permissions.allowed_actions:
            matched_permissions.append(f"allowed:{mapped_permission}")
        if mapped_permission in contract.permissions.prohibited_actions:
            matched_permissions.append(f"prohibited:{mapped_permission}")
            conflicts.append(
                ContractConflict(
                    action_type=action.action_type,
                    contract_field="permissions.prohibited_actions",
                    contract_value=mapped_permission,
                    explanation=f"The proposed action maps to prohibited permission {mapped_permission}.",
                )
            )
        if mapped_permission in contract.permissions.actions_requiring_human_approval:
            matched_permissions.append(f"approval_required:{mapped_permission}")

    if action.action_type in READ_ONLY_ACTIONS and not action.would_mutate_state:
        findings.append(
            _finding(
                PolicyRuleId.BASE_001,
                PolicySeverity.INFO,
                RuleZeroDecision.ALLOW,
                "Read-only inspection is safe to allow.",
                f"action_type={action.action_type.value}",
                "would_mutate_state=false",
            )
        )

    if action.action_type == AgentActionType.ADD_ITEM:
        if not context.item_category or context.item_category not in contract.allowed_item_categories:
            findings.append(
                _finding(
                    PolicyRuleId.CATEGORY_001,
                    PolicySeverity.CRITICAL,
                    RuleZeroDecision.BLOCK,
                    "The item category is absent from the contract's allowed categories.",
                    f"item_category={context.item_category or 'unknown'}",
                )
            )
            conflicts.append(
                ContractConflict(
                    action_type=action.action_type,
                    contract_field="allowed_item_categories",
                    contract_value=",".join(contract.allowed_item_categories) or "none",
                    explanation="The proposed product category is not authorized.",
                )
            )

    budget_maximum = contract.budget.maximum_amount
    known_financial = (
        context.financial_impact_known
        and context.projected_cart_total is not None
        and context.immediate_one_time_cost is not None
    )
    budget_exceeded = (
        action.action_type in FINANCIAL_MUTATIONS
        and known_financial
        and budget_maximum is not None
        and context.projected_cart_total is not None
        and context.projected_cart_total > budget_maximum
    )
    if budget_exceeded:
        findings.append(
            _finding(
                PolicyRuleId.BUDGET_001,
                PolicySeverity.CRITICAL,
                RuleZeroDecision.BLOCK,
                "Projected due-today total exceeds the contract maximum budget.",
                f"projected={context.projected_cart_total}",
                f"maximum={budget_maximum}",
            )
        )
        conflicts.append(
            ContractConflict(
                action_type=action.action_type,
                contract_field="budget.maximum_amount",
                contract_value=str(budget_maximum),
                explanation=f"Projected total INR {context.projected_cart_total} exceeds the maximum.",
            )
        )

    if action.action_type in FINANCIAL_MUTATIONS and not known_financial:
        findings.append(
            _finding(
                PolicyRuleId.BUDGET_002,
                PolicySeverity.WARNING,
                RuleZeroDecision.ASK_APPROVAL,
                "Financial impact is unknown; this mutation cannot be automatically allowed.",
                "financial_impact_known=false or required totals missing",
            )
        )

    if action.action_type in FINANCIAL_MUTATIONS and budget_maximum is None:
        findings.append(
            _finding(
                PolicyRuleId.DEFAULT_001,
                PolicySeverity.CRITICAL,
                RuleZeroDecision.BLOCK,
                "The contract has no usable budget authority for a financial mutation.",
                "budget.maximum_amount=null",
            )
        )

    if action.action_type == AgentActionType.TOGGLE_ADDON and context.optional_addon:
        if budget_exceeded:
            findings.append(
                _finding(
                    PolicyRuleId.ADDON_002,
                    PolicySeverity.CRITICAL,
                    RuleZeroDecision.BLOCK,
                    "The optional paid add-on would push the projected total over budget.",
                    f"projected={context.projected_cart_total}",
                )
            )
        elif known_financial and (context.immediate_one_time_cost or 0) > 0:
            findings.append(
                _finding(
                    PolicyRuleId.ADDON_001,
                    PolicySeverity.WARNING,
                    RuleZeroDecision.ASK_APPROVAL,
                    "An optional paid add-on was not explicitly requested by the user.",
                    f"immediate_cost={context.immediate_one_time_cost}",
                )
            )

    if action.action_type == AgentActionType.ACTIVATE_SUBSCRIPTION:
        if "activate_subscription" in contract.permissions.prohibited_actions:
            findings.append(
                _finding(
                    PolicyRuleId.SUB_001,
                    PolicySeverity.CRITICAL,
                    RuleZeroDecision.BLOCK,
                    "Subscription activation or retention is prohibited by the contract.",
                    "prohibited:activate_subscription",
                )
            )
        if (
            (context.recurring_monthly_cost or 0) > 0
            and "activate_recurring_payment" in contract.permissions.prohibited_actions
        ):
            findings.append(
                _finding(
                    PolicyRuleId.RECUR_001,
                    PolicySeverity.CRITICAL,
                    RuleZeroDecision.BLOCK,
                    "Recurring-payment activation or retention is prohibited by the contract.",
                    f"recurring_monthly_cost={context.recurring_monthly_cost}",
                )
            )
            conflicts.append(
                ContractConflict(
                    action_type=action.action_type,
                    contract_field="permissions.prohibited_actions",
                    contract_value="activate_recurring_payment",
                    explanation="The proposal introduces a prohibited recurring charge.",
                )
            )

    if action.action_type == AgentActionType.MAKE_PAYMENT:
        if "initiate_payment" not in contract.permissions.allowed_actions:
            findings.append(
                _finding(
                    PolicyRuleId.PAY_001,
                    PolicySeverity.CRITICAL,
                    RuleZeroDecision.BLOCK,
                    "Payment authority is absent or explicitly prohibited.",
                    "initiate_payment is not allowed",
                )
            )

    if action.action_type == AgentActionType.SUBMIT_ORDER:
        if "submit_order" not in contract.permissions.allowed_actions:
            findings.append(
                _finding(
                    PolicyRuleId.ORDER_001,
                    PolicySeverity.CRITICAL,
                    RuleZeroDecision.BLOCK,
                    "Order-submission authority is absent or explicitly prohibited.",
                    "submit_order is not allowed",
                )
            )

    if action.action_type == AgentActionType.ENTER_SENSITIVE_DATA:
        if not contract.sensitive_data_policy.sharing_allowed:
            findings.append(
                _finding(
                    PolicyRuleId.DATA_001,
                    PolicySeverity.CRITICAL,
                    RuleZeroDecision.BLOCK,
                    "Sensitive-data entry or sharing is prohibited by the contract.",
                    "sensitive_data_policy.sharing_allowed=false",
                )
            )

    if action.action_type == AgentActionType.NAVIGATE_EXTERNAL:
        if "navigate_external" in contract.permissions.prohibited_actions:
            findings.append(
                _finding(
                    PolicyRuleId.NAV_001,
                    PolicySeverity.CRITICAL,
                    RuleZeroDecision.BLOCK,
                    "External navigation is explicitly prohibited.",
                    "prohibited:navigate_external",
                )
            )
        elif "navigate_external" not in contract.permissions.allowed_actions:
            findings.append(
                _finding(
                    PolicyRuleId.NAV_001,
                    PolicySeverity.WARNING,
                    RuleZeroDecision.ASK_APPROVAL,
                    "External navigation requires human approval.",
                    "navigate_external is not explicitly allowed",
                )
            )

    if mapped_permission in contract.permissions.prohibited_actions:
        findings.append(
            _finding(
                PolicyRuleId.DEFAULT_001,
                PolicySeverity.CRITICAL,
                RuleZeroDecision.BLOCK,
                "The action is explicitly prohibited by the contract.",
                f"prohibited:{mapped_permission}",
            )
        )
    elif (
        action.would_mutate_state
        and mapped_permission
        and mapped_permission not in contract.permissions.allowed_actions
        and mapped_permission not in contract.permissions.actions_requiring_human_approval
        and action.action_type != AgentActionType.NAVIGATE_EXTERNAL
    ):
        findings.append(
            _finding(
                PolicyRuleId.DEFAULT_001,
                PolicySeverity.CRITICAL,
                RuleZeroDecision.BLOCK,
                "Required mutation authority is missing from the contract.",
                f"missing_permission={mapped_permission}",
            )
        )

    if action.source.type == ActionSourceType.UNTRUSTED_WEBPAGE_INSTRUCTION and conflicts:
        findings.append(
            _finding(
                PolicyRuleId.SOURCE_001,
                PolicySeverity.CRITICAL,
                RuleZeroDecision.BLOCK,
                "An untrusted webpage instruction conflicts with the user contract and cannot override it.",
                action.source.evidence,
            )
        )

    findings.append(
        _finding(
            PolicyRuleId.SOURCE_002,
            PolicySeverity.INFO,
            RuleZeroDecision.ALLOW,
            "Source trust is supporting evidence and never grants authority by itself.",
            f"source={action.source.type.value}",
            f"trust={action.source.trust_classification}",
        )
    )

    if action.action_type == AgentActionType.FINISH_TASK and not action.would_mutate_state:
        findings.append(
            _finding(
                PolicyRuleId.FINISH_001,
                PolicySeverity.INFO,
                RuleZeroDecision.ALLOW,
                "A non-mutating finish proposal may be allowed.",
                "would_mutate_state=false",
            )
        )

    if (
        action.would_mutate_state
        and mapped_permission is None
        and action.action_type not in {
            AgentActionType.TOGGLE_ADDON,
            AgentActionType.PROCEED_TO_CHECKOUT,
        }
    ):
        findings.append(
            _finding(
                PolicyRuleId.DEFAULT_001,
                PolicySeverity.WARNING,
                RuleZeroDecision.ASK_APPROVAL,
                "No explicit contract permission maps to this mutating action.",
                f"action_type={action.action_type.value}",
            )
        )

    if action.action_type == AgentActionType.PROCEED_TO_CHECKOUT:
        findings.append(
            _finding(
                PolicyRuleId.DEFAULT_001,
                PolicySeverity.WARNING,
                RuleZeroDecision.ASK_APPROVAL,
                "Checkout navigation is consequential and lacks explicit contract authority.",
                "local checkout preview only",
            )
        )

    if not findings:
        findings.append(
            _finding(
                PolicyRuleId.DEFAULT_001,
                PolicySeverity.WARNING,
                RuleZeroDecision.ASK_APPROVAL,
                "No deterministic allow rule or explicit authority matched.",
                f"action_type={action.action_type.value}",
            )
        )

    decision = _resolve(findings)
    decisive = next(
        finding
        for finding in findings
        if finding.recommended_decision == decision
    )
    summary_by_decision = {
        RuleZeroDecision.ALLOW: "Action is permitted by deterministic policy.",
        RuleZeroDecision.BLOCK: "Action conflicts with the safety contract or policy.",
        RuleZeroDecision.ASK_APPROVAL: "Action requires explicit human approval before execution.",
    }
    consequence = _consequence(request)
    return ActionEvaluationResponse(
        evaluation_id=_stable_evaluation_id(request),
        evaluated_action_id=action.action_id,
        scenario_id=request.scenario_id,
        decision=decision,
        summary=summary_by_decision[decision],
        explanation=decisive.message,
        triggered_policy_findings=findings,
        matched_contract_permissions=matched_permissions,
        detected_contract_conflicts=conflicts,
        action_source_trust_assessment=SourceTrustAssessment(
            source_type=action.source.type,
            trust_classification=action.source.trust_classification,
            summary=(
                "The source is untrusted and supplies evidence only; it cannot authorize this action."
                if action.source.trust_classification == "untrusted"
                else "The source is trusted evidence, but contract and policy checks still control the decision."
            ),
        ),
        consequence_assessment=consequence,
        decision_trace=DecisionTrace(
            precedence=TRACE_PRECEDENCE,
            evaluated_rules=[finding.rule_id for finding in findings],
            resolution=(
                "BLOCK overrides ASK_APPROVAL and ALLOW; ASK_APPROVAL overrides ALLOW. "
                f"Resolved to {decision.value}."
            ),
        ),
        human_approval_required=decision == RuleZeroDecision.ASK_APPROVAL,
    )
