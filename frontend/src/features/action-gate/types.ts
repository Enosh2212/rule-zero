import type { TaskContract } from "../contracts/types";
import type { ActionEvaluationResponse } from "../interceptor/types";
import type { ProposedAgentAction } from "../worker/types";

export type ControlledShoppingState = Readonly<{
  scenario_id: "shopping-trap";
  cart_items: readonly Readonly<{ product_id: string; quantity: number; unit_price: number }>[];
  addons: Readonly<{ warranty_enabled: boolean; membership_enabled: boolean }>;
  checkout_preview_reached: boolean;
  simulation_completed: boolean;
  state_version: number;
}>;

export type ScenarioSnapshot = Readonly<{
  schema_version: "1.0";
  products: readonly Readonly<{ product_id: string; category: "power_bank"; price: number; stock: number }>[];
  warranty_id: string;
  warranty_price: number;
  membership_id: string;
  membership_monthly_price: number;
  supported_actions: readonly string[];
  state: ControlledShoppingState;
}>;

export type ApprovalRequest = Readonly<{
  approval_request_id: string;
  status: "pending";
  scenario_id: "shopping-trap";
  action_id: string;
  contract_fingerprint: string;
  state_version: number;
  immediate_one_time_cost: number | null;
  recurring_monthly_cost: number | null;
  projected_total: number | null;
  triggered_rules: readonly string[];
  reason: string;
  single_use_warning: string;
}>;

export type ActionExecutionResponse = Readonly<{
  schema_version: "1.0";
  execution_id: string;
  status: "executed" | "refused" | "approval_required" | "rejected" | "no_operation";
  refusal_reason: string | null;
  before_state: ControlledShoppingState;
  after_state: ControlledShoppingState;
  before_summary: string;
  after_summary: string;
  fresh_evaluation: ActionEvaluationResponse;
  approval_request: ApprovalRequest | null;
  approval_record: Readonly<{ approval_request_id: string; status: string; message: string }> | null;
  triggered_rules: readonly string[];
  execution_trace: Readonly<{ steps: readonly string[] }>;
  execution_occurred: boolean;
  state_changed: boolean;
}>;

export type ActionExecutionRequest = Readonly<{
  scenario_id: "shopping-trap";
  contract: TaskContract;
  proposed_action: ProposedAgentAction;
  current_state: ControlledShoppingState;
  expected_state_version: number;
  approval: null;
}>;

export type ApprovalDecisionRequest = Readonly<{
  scenario_id: "shopping-trap";
  contract: TaskContract;
  proposed_action: ProposedAgentAction;
  current_state: ControlledShoppingState;
  approval_request_id: string;
  decision: "approve" | "reject";
}>;
