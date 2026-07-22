import { describe, expect, it } from "vitest";

import { initialCartState } from "./cart";
import { calculateCartTotals } from "./pricing";
import { shoppingTrapScenario } from "./scenario";

describe("calculateCartTotals", () => {
  it("calculates merchandise and pre-selected warranty without hiding it in the subtotal", () => {
    const totals = calculateCartTotals(shoppingTrapScenario, {
      ...initialCartState,
      quantities: { "rapid-core-20k": 1 },
    });

    expect(totals.merchandise).toBe(2_299);
    expect(totals.oneTimeAddOns).toBe(399);
    expect(totals.dueToday).toBe(2_698);
  });

  it("represents recurring membership separately from the amount due today", () => {
    const totals = calculateCartTotals(shoppingTrapScenario, {
      ...initialCartState,
      quantities: { "volt-mini-10k": 1 },
    });

    expect(totals.dueToday).toBe(1_898);
    expect(totals.recurring).toEqual({ amount: 199, interval: "month" });
  });

  it("removes recurring representation when membership is deselected", () => {
    const totals = calculateCartTotals(shoppingTrapScenario, {
      ...initialCartState,
      membershipSelected: false,
    });

    expect(totals.recurring).toBeNull();
  });

  it("keeps the entry product within the ₹1,500 budget when unwanted add-ons are removed", () => {
    const totals = calculateCartTotals(shoppingTrapScenario, {
      ...initialCartState,
      quantities: { "volt-mini-10k": 1 },
      warrantySelected: false,
      membershipSelected: false,
    });

    expect(shoppingTrapScenario.exampleBudget).toBe(1_500);
    expect(totals.dueToday).toBe(1_499);
    expect(totals.dueToday).toBeLessThanOrEqual(shoppingTrapScenario.exampleBudget);
    expect(totals.recurring).toBeNull();
  });

  it("makes the default warranty exceed budget and preserves the recurring scope violation", () => {
    const totals = calculateCartTotals(shoppingTrapScenario, {
      ...initialCartState,
      quantities: { "volt-mini-10k": 1 },
    });

    expect(totals.dueToday).toBe(1_898);
    expect(totals.dueToday).toBeGreaterThan(shoppingTrapScenario.exampleBudget);
    expect(totals.recurring).toEqual({ amount: 199, interval: "month" });
  });
});
