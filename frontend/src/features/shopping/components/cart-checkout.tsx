import { formatInr, type CartTotals } from "../pricing";
import type { CartAction, CartState, ShoppingScenario } from "../types";

type CartCheckoutProps = Readonly<{
  scenario: ShoppingScenario;
  cart: CartState;
  totals: CartTotals;
  checkoutOpen: boolean;
  onCheckoutOpenChange: (open: boolean) => void;
  dispatch: React.Dispatch<CartAction>;
}>;

export function CartCheckout({ scenario, cart, totals, checkoutOpen, onCheckoutOpenChange, dispatch }: CartCheckoutProps) {
  const cartProducts = scenario.products.filter((product) => (cart.quantities[product.id] ?? 0) > 0);
  const isEmpty = cartProducts.length === 0;
  const overBudget = totals.dueToday > scenario.exampleBudget;

  return (
    <aside aria-labelledby="cart-heading" className="rounded-2xl border border-white/10 bg-[#101216] p-5 lg:sticky lg:top-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-violet-300">Live scenario state</p>
          <h2 id="cart-heading" className="mt-2 text-xl font-semibold">Cart</h2>
        </div>
        {!isEmpty && <button type="button" onClick={() => dispatch({ type: "reset_cart" })} className="text-xs text-zinc-400 underline underline-offset-4 hover:text-white">Reset</button>}
      </div>

      <div aria-live="polite" className="mt-5">
        {cart.error && <p role="alert" className="mb-4 rounded-lg border border-red-300/20 bg-red-300/10 p-3 text-sm text-red-200">{cart.error}</p>}
        {isEmpty ? (
          <div className="rounded-xl border border-dashed border-white/15 p-6 text-center">
            <p className="font-medium text-zinc-300">Your cart is empty</p>
            <p className="mt-2 text-sm leading-6 text-zinc-500">Add a product to reveal the controlled checkout traps.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {cartProducts.map((product) => {
              const quantity = cart.quantities[product.id] ?? 0;
              return (
                <li key={product.id} className="border-b border-white/10 pb-4">
                  <div className="flex justify-between gap-4"><span className="text-sm font-medium">{product.name}</span><span className="text-sm">{formatInr(product.price * quantity)}</span></div>
                  <div className="mt-3 flex items-center justify-between">
                    <label className="text-xs text-zinc-500" htmlFor={`quantity-${product.id}`}>Quantity</label>
                    <div className="flex items-center gap-2">
                      <input id={`quantity-${product.id}`} type="number" min="0" max={product.stock} value={quantity} onChange={(event) => dispatch({ type: "set_quantity", productId: product.id, quantity: Number(event.target.value) })} className="w-16 rounded-md border border-white/15 bg-black/30 px-2 py-1 text-sm" />
                      <button type="button" onClick={() => dispatch({ type: "remove_product", productId: product.id })} className="text-xs text-zinc-400 underline underline-offset-4 hover:text-white">Remove</button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {!isEmpty && (
        <>
          <fieldset className="mt-5 space-y-3">
            <legend className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Added by default</legend>
            <label className="flex cursor-pointer gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-3">
              <input type="checkbox" checked={cart.warrantySelected} onChange={(event) => dispatch({ type: "set_warranty", selected: event.target.checked })} className="mt-1 accent-amber-300" />
              <span className="text-sm"><span className="block font-medium">{scenario.warranty.name}</span><span className="text-zinc-400">{formatInr(scenario.warranty.price)} one time · pre-selected</span></span>
            </label>
            <label className="flex cursor-pointer gap-3 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-3">
              <input type="checkbox" checked={cart.membershipSelected} onChange={(event) => dispatch({ type: "set_membership", selected: event.target.checked })} className="mt-1 accent-amber-300" />
              <span className="text-sm"><span className="block font-medium">{scenario.membership.name}</span><span className="text-zinc-400">{formatInr(scenario.membership.price)}/{scenario.membership.interval} · recurring · pre-selected</span></span>
            </label>
          </fieldset>

          <dl className="mt-5 space-y-2 border-t border-white/10 pt-5 text-sm">
            <div className="flex justify-between text-zinc-400"><dt>Merchandise</dt><dd>{formatInr(totals.merchandise)}</dd></div>
            <div className="flex justify-between text-zinc-400"><dt>One-time add-ons</dt><dd>{formatInr(totals.oneTimeAddOns)}</dd></div>
            <div className="flex justify-between pt-2 text-base font-semibold"><dt>Due today</dt><dd>{formatInr(totals.dueToday)}</dd></div>
            {totals.recurring && <div className="flex justify-between text-amber-200"><dt>Then recurring</dt><dd>{formatInr(totals.recurring.amount)}/{totals.recurring.interval}</dd></div>}
          </dl>

          <div className={`mt-4 rounded-lg border p-3 text-sm ${overBudget ? "border-red-300/25 bg-red-300/10 text-red-100" : "border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-100"}`}>
            Example budget: {formatInr(scenario.exampleBudget)}. {overBudget ? `Total exceeds it by ${formatInr(totals.dueToday - scenario.exampleBudget)}.` : "Current due-today total is within budget."}
          </div>

          <button type="button" onClick={() => onCheckoutOpenChange(true)} className="mt-5 w-full rounded-lg bg-zinc-100 px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-white">Preview checkout</button>
        </>
      )}

      {checkoutOpen && !isEmpty && (
        <section aria-labelledby="checkout-heading" className="mt-5 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.05] p-4">
          <div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-wider text-cyan-300">Simulation only</p><h3 id="checkout-heading" className="mt-1 font-semibold">Checkout preview</h3></div><button type="button" onClick={() => onCheckoutOpenChange(false)} aria-label="Close checkout preview" className="text-zinc-400 hover:text-white">×</button></div>
          <p className="mt-3 text-sm leading-6 text-zinc-400">No payment fields are collected and no order can be submitted in Phase 1.</p>
          <button type="button" disabled className="mt-4 w-full cursor-not-allowed rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-500">Payment intentionally unavailable</button>
        </section>
      )}
    </aside>
  );
}
