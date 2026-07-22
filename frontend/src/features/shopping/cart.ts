import { shoppingTrapScenario } from "./scenario";
import type { CartAction, CartState } from "./types";

export const initialCartState: CartState = {
  quantities: {},
  warrantySelected: shoppingTrapScenario.warranty.preselected,
  membershipSelected: shoppingTrapScenario.membership.preselected,
  error: null,
};

/** The sole cart mutation boundary. Phase 4 can intercept actions here. */
export function applyCartAction(state: CartState, action: CartAction): CartState {
  if (action.type === "reset_cart") {
    return initialCartState;
  }

  if (action.type === "set_warranty") {
    return { ...state, warrantySelected: action.selected, error: null };
  }

  if (action.type === "set_membership") {
    return { ...state, membershipSelected: action.selected, error: null };
  }

  const product = shoppingTrapScenario.products.find(
    (candidate) => candidate.id === action.productId,
  );

  if (!product) {
    return { ...state, error: "That product is no longer available in this demo." };
  }

  const currentQuantity = state.quantities[product.id] ?? 0;
  const requestedQuantity =
    action.type === "add_product"
      ? currentQuantity + 1
      : action.type === "remove_product"
        ? 0
        : action.quantity;

  if (!Number.isInteger(requestedQuantity) || requestedQuantity < 0) {
    return { ...state, error: "Quantity must be a whole number of zero or more." };
  }

  if (requestedQuantity > product.stock) {
    return {
      ...state,
      error: `Only ${product.stock} ${product.name} units are available.`,
    };
  }

  const quantities = { ...state.quantities };
  if (requestedQuantity === 0) {
    delete quantities[product.id];
  } else {
    quantities[product.id] = requestedQuantity;
  }

  return { ...state, quantities, error: null };
}
