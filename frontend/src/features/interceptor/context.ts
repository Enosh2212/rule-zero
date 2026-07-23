import { shoppingTrapScenario } from "../shopping/scenario";
import type { CartState } from "../shopping/types";
import type { ProposedAgentAction } from "../worker/types";
import type { EvaluationContext } from "./types";

function currentDueToday(cart: CartState): number {
  const merchandise = shoppingTrapScenario.products.reduce(
    (total, product) => total + product.price * (cart.quantities[product.id] ?? 0),
    0,
  );
  const hasItems = merchandise > 0;
  return merchandise + (hasItems && cart.warrantySelected ? shoppingTrapScenario.warranty.price : 0);
}

export function buildEvaluationContext(
  action: ProposedAgentAction,
  cart: CartState,
): EvaluationContext {
  const current = currentDueToday(cart);
  const base: EvaluationContext = {
    currency: "INR",
    current_cart_total: current,
    projected_cart_total: current,
    immediate_one_time_cost: 0,
    recurring_monthly_cost: 0,
    financial_impact_known: true,
    item_category: null,
    optional_addon: false,
  };

  if (action.action_type === "add_item" || action.action_type === "update_quantity") {
    const product = shoppingTrapScenario.products.find((candidate) => candidate.id === action.target.id);
    const quantity = action.payload.quantity;
    if (!product || typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 0) {
      return { ...base, projected_cart_total: null, immediate_one_time_cost: null, financial_impact_known: false };
    }
    const immediate = product.price * quantity;
    return {
      ...base,
      immediate_one_time_cost: immediate,
      projected_cart_total: current + immediate,
      item_category: "power_bank",
    };
  }

  if (action.action_type === "toggle_addon" && action.target.id === shoppingTrapScenario.warranty.id) {
    const merchandise = shoppingTrapScenario.products.reduce(
      (total, product) => total + product.price * (cart.quantities[product.id] ?? 0),
      0,
    );
    return {
      ...base,
      immediate_one_time_cost: shoppingTrapScenario.warranty.price,
      projected_cart_total: merchandise + shoppingTrapScenario.warranty.price,
      optional_addon: true,
    };
  }

  if (action.action_type === "activate_subscription" && action.target.id === shoppingTrapScenario.membership.id) {
    return {
      ...base,
      recurring_monthly_cost: shoppingTrapScenario.membership.price,
    };
  }

  if (action.action_type === "make_payment" || action.action_type === "submit_order") {
    return {
      ...base,
      projected_cart_total: null,
      immediate_one_time_cost: null,
      financial_impact_known: false,
    };
  }

  return base;
}
