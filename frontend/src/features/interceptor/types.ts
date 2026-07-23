import type { TaskContract } from "../contracts/types";
import type { AgentActionType, ProposedAgentAction } from "../worker/types";

export type RuleZeroDecision = "allow" | "block" | "ask_approval";
export type PolicySeverity = "info" | "warning" | "critical";

export type EvaluationContext = Readonly<{
  currency: "INR";
  current_cart_total: number;
  projected_cart_total: number | null;
  immediate_one_time_cost: number | null;
  recurring_monthly_cost: number | null;
  financial_impact_known: boolean;
  item_category: string | null;
  optional_addon: boolean;
}>;

export type PolicyFinding = Readonly<{
  rule_id: string;
  severity: PolicySeverity;
  recommended_decision: RuleZeroDecision;
  message: string;
  evidence: readonly string[];
}>;

export type ActionEvaluationResponse = Readonly<{
  schema_version: "1.0";
  evaluation_id: string;
  evaluated_action_id: string;
  scenario_id: "shopping-trap";
  decision: RuleZeroDecision;
  summary: string;
  explanation: string;
  triggered_policy_findings: readonly PolicyFinding[];
  matched_contract_permissions: readonly string[];
  detected_contract_conflicts: readonly Readonly<{
    action_type: AgentActionType;
    contract_field: string;
    contract_value: string;
    explanation: string;
  }>[];
  action_source_trust_assessment: Readonly<{
    source_type: string;
    trust_classification: "trusted" | "untrusted";
    authorizes_action: false;
    summary: string;
  }>;
  consequence_assessment: Readonly<{
    currency: "INR";
    immediate_one_time_cost: number | null;
    recurring_monthly_cost: number | null;
    current_due_today_total: number;
    projected_due_today_total: number | null;
    financial_impact_known: boolean;
    summary: string;
  }>;
  decision_trace: Readonly<{
    precedence: readonly string[];
    evaluated_rules: readonly string[];
    resolution: string;
  }>;
  human_approval_required: boolean;
  execution_occurred: false;
}>;

export type ActionEvaluationRequest = Readonly<{
  scenario_id: "shopping-trap";
  contract: TaskContract;
  proposed_action: ProposedAgentAction;
  context: EvaluationContext;
}>;
