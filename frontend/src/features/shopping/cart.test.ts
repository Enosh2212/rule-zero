import { describe, expect, it } from "vitest";

import { applyCartAction, initialCartState } from "./cart";

describe("applyCartAction", () => {
  it("applies a typed product action without mutating the previous state", () => {
    const nextState = applyCartAction(initialCartState, {
      type: "add_product",
      productId: "rapid-core-20k",
    });

    expect(initialCartState.quantities).toEqual({});
    expect(nextState.quantities).toEqual({ "rapid-core-20k": 1 });
  });

  it("rejects quantities above deterministic stock", () => {
    const nextState = applyCartAction(initialCartState, {
      type: "set_quantity",
      productId: "trek-max-30k",
      quantity: 3,
    });

    expect(nextState.quantities).toEqual({});
    expect(nextState.error).toBe("Only 2 Trek Max 30K units are available.");
  });
});
