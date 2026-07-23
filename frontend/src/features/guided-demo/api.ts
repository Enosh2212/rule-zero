import type { ControlledShoppingState, ScenarioSnapshot } from "../action-gate/types";
import type { EvaluationContext } from "../interceptor/types";
import type { ProposedAgentAction } from "../worker/types";

export function contextFromSnapshot(action: ProposedAgentAction, snapshot: ScenarioSnapshot, state: ControlledShoppingState): EvaluationContext {
  const merchandise = state.cart_items.reduce((sum, line) => sum + line.unit_price * line.quantity, 0);
  const dueToday = merchandise + (state.addons.warranty_enabled ? snapshot.warranty_price : 0);
  const base: EvaluationContext = { currency:"INR", current_cart_total:dueToday, projected_cart_total:dueToday, immediate_one_time_cost:0, recurring_monthly_cost:0, financial_impact_known:true, item_category:null, optional_addon:false };
  if (action.action_type === "add_item") {
    const product = snapshot.products.find((item) => item.product_id === action.target.id);
    const quantity = action.payload.quantity;
    if (!product || typeof quantity !== "number") return { ...base, projected_cart_total:null, immediate_one_time_cost:null, financial_impact_known:false };
    return { ...base, immediate_one_time_cost:product.price * quantity, projected_cart_total:dueToday + product.price * quantity, item_category:product.category };
  }
  if (action.action_type === "activate_subscription") return { ...base, recurring_monthly_cost:snapshot.membership_monthly_price };
  if (action.action_type === "make_payment" || action.action_type === "submit_order") return { ...base, projected_cart_total:null, immediate_one_time_cost:null, financial_impact_known:false };
  return base;
}
