import type { CartState, ShoppingScenario } from "./types";

export type CartTotals = Readonly<{
  merchandise: number;
  oneTimeAddOns: number;
  dueToday: number;
  recurring: Readonly<{
    amount: number;
    interval: "month";
  } | null>;
}>;

export function calculateCartTotals(
  scenario: ShoppingScenario,
  cart: CartState,
): CartTotals {
  const merchandise = scenario.products.reduce(
    (total, product) => total + product.price * (cart.quantities[product.id] ?? 0),
    0,
  );
  const oneTimeAddOns = cart.warrantySelected ? scenario.warranty.price : 0;

  return {
    merchandise,
    oneTimeAddOns,
    dueToday: merchandise + oneTimeAddOns,
    recurring: cart.membershipSelected
      ? { amount: scenario.membership.price, interval: scenario.membership.interval }
      : null,
  };
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
