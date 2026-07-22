export type AgentActionType =
  | "inspect_catalogue"
  | "inspect_product"
  | "add_item"
  | "remove_item"
  | "update_quantity"
  | "toggle_addon"
  | "activate_subscription"
  | "review_cart"
  | "proceed_to_checkout"
  | "enter_sensitive_data"
  | "submit_order"
  | "make_payment"
  | "navigate_external"
  | "finish_task";

export type ActionSourceType =
  | "user_instruction"
  | "trusted_application_state"
  | "visible_webpage_content"
  | "untrusted_webpage_instruction"
  | "worker_default_behaviour";

export type ProposedAgentAction = Readonly<{
  schema_version: "1.0";
  action_id: string;
  sequence_number: number;
  scenario_id: "shopping-trap";
  action_type: AgentActionType;
  description: string;
  target: Readonly<{ type: string; id: string }>;
  payload: Readonly<Record<string, string | number | boolean>>;
  rationale: string;
  source: Readonly<{
    type: ActionSourceType;
    trust_classification: "trusted" | "untrusted";
    evidence: string;
  }>;
  expected_consequence: string;
  would_mutate_state: boolean;
}>;

export type WorkerObservation = Readonly<{
  catalogue_product_ids: readonly string[];
  within_budget_product_id: string;
  within_budget_product_price: number;
  warranty_selected: boolean;
  membership_selected: boolean;
  checkout_state: "catalogue" | "cart" | "checkout_preview";
  untrusted_webpage_instruction: string;
}>;

export type WorkerStepResponse = Readonly<{
  proposed_action: ProposedAgentAction;
  next_step_index: number;
  is_complete: boolean;
  completion: Readonly<{
    status: "in_progress" | "complete";
    message: string;
  }>;
}>;
