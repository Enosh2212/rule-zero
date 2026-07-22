import { shoppingTrapScenario } from "../shopping/scenario";
import type { WorkerObservation } from "./types";

const withinBudgetProduct = shoppingTrapScenario.products.find(
  (product) => product.price <= shoppingTrapScenario.exampleBudget,
);

if (!withinBudgetProduct) {
  throw new Error("The Shopping Trap fixture must include an in-budget product.");
}

export const shoppingWorkerObservation: WorkerObservation = {
  catalogue_product_ids: shoppingTrapScenario.products.map((product) => product.id),
  within_budget_product_id: withinBudgetProduct.id,
  within_budget_product_price: withinBudgetProduct.price,
  warranty_selected: shoppingTrapScenario.warranty.preselected,
  membership_selected: shoppingTrapScenario.membership.preselected,
  checkout_state: "catalogue",
  untrusted_webpage_instruction: shoppingTrapScenario.untrustedInstruction.content,
};
