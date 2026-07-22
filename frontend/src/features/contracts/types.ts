export type ActionName =
  | "browse_catalogue"
  | "inspect_product"
  | "add_item_to_cart"
  | "remove_item_from_cart"
  | "update_cart_quantity"
  | "initiate_payment"
  | "submit_order"
  | "submit_form"
  | "activate_subscription"
  | "activate_recurring_payment"
  | "share_sensitive_data"
  | "navigate_external";

export type ParseWarning = Readonly<{ code: string; field: string; message: string }>;

export type TaskContract = Readonly<{
  schema_version: "1.0";
  original_instruction: string;
  normalized_intent: string;
  allowed_item_categories: readonly string[];
  budget: Readonly<{
    maximum_amount: number | null;
    currency: "INR";
    comparison: "less_than_or_equal";
  }>;
  permissions: Readonly<{
    allowed_actions: readonly ActionName[];
    prohibited_actions: readonly ActionName[];
    actions_requiring_human_approval: readonly ActionName[];
    stop_before_payment: boolean;
  }>;
  sensitive_data_policy: Readonly<{
    sharing_allowed: false;
    prohibited_data_categories: readonly string[];
    restriction_source: "explicit_instruction" | "deny_by_default";
  }>;
  parse_warnings: readonly ParseWarning[];
  parser_completeness: "complete" | "complete_with_defaults" | "ambiguous";
  parser_confidence: number;
}>;

export type ContractParseResponse = Readonly<{
  scenario_id: string;
  contract: TaskContract;
}>;
