import { describe, expect, it } from "vitest";

import { initialCartState } from "../shopping/cart";
import type { ProposedAgentAction } from "../worker/types";
import { buildEvaluationContext } from "./context";

function action(overrides: Partial<ProposedAgentAction>): ProposedAgentAction {
  return {
    schema_version: "1.0",
    action_id: "shopping-trap-action-003",
    sequence_number: 3,
    scenario_id: "shopping-trap",
    action_type: "add_item",
    description: "Add item.",
    target: { type: "product", id: "volt-mini-10k" },
    payload: { quantity: 1, unit_price: 1 },
    rationale: "Naive proposal.",
    source: { type: "user_instruction", trust_classification: "trusted", evidence: "Buy a power bank." },
    expected_consequence: "Would add an item.",
    would_mutate_state: true,
    ...overrides,
  };
}

describe("buildEvaluationContext", () => {
  it("uses canonical product price instead of the Worker price claim", () => {
    const result = buildEvaluationContext(action({}), initialCartState);
    expect(result.immediate_one_time_cost).toBe(1499);
    expect(result.projected_cart_total).toBe(1499);
    expect(result.item_category).toBe("power_bank");
  });

  it("uses canonical warranty and membership prices", () => {
    const warranty = buildEvaluationContext(
      action({ action_type: "toggle_addon", target: { type: "addon", id: "extended-warranty" }, payload: { selected: true, price: 1 } }),
      initialCartState,
    );
    const membership = buildEvaluationContext(
      action({ action_type: "activate_subscription", target: { type: "addon", id: "volt-plus" }, payload: { selected: true, price: 1 } }),
      initialCartState,
    );
    expect(warranty.immediate_one_time_cost).toBe(399);
    expect(membership.recurring_monthly_cost).toBe(199);
  });

  it("marks an unknown canonical product impact as unknown", () => {
    const result = buildEvaluationContext(
      action({ target: { type: "product", id: "invented-product" } }),
      initialCartState,
    );
    expect(result.financial_impact_known).toBe(false);
    expect(result.projected_cart_total).toBeNull();
  });
});
