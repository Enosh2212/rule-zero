"use client";

import { useReducer, useState } from "react";
import Link from "next/link";

import { TaskContractPanel } from "@/features/contracts/components/task-contract-panel";

import { applyCartAction, initialCartState } from "../cart";
import { calculateCartTotals, formatInr } from "../pricing";
import { shoppingTrapScenario } from "../scenario";
import { CartCheckout } from "./cart-checkout";
import { EvidenceDrawer } from "./evidence-drawer";
import { ProductCatalogue } from "./product-catalogue";

export function ShoppingStorefront() {
  const [cart, dispatch] = useReducer(applyCartAction, initialCartState);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const totals = calculateCartTotals(shoppingTrapScenario, cart);

  return (
    <main className="min-h-screen bg-[#08090b] text-zinc-100">
      <header className="border-b border-white/10 bg-black/20">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4 sm:px-10">
          <Link href="/" className="font-semibold tracking-[0.2em]">RULE ZERO</Link>
          <div className="flex items-center gap-3 text-xs"><span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-cyan-200">Phase 2 · contract preview</span><span className="text-zinc-500">No real checkout</span></div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-10">
        <section className="mb-10 grid gap-7 border-b border-white/10 pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div><p className="font-mono text-xs uppercase tracking-[0.22em] text-zinc-500">{shoppingTrapScenario.merchantName}</p><h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">A safe-looking store with unsafe defaults.</h1><p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400">Manually inspect a deterministic shopping flow containing four reproducible attack conditions. Rule Zero interception is intentionally reserved for a later phase.</p></div>
          <div className="rounded-xl border border-white/10 bg-white/[0.035] px-5 py-4"><span className="block text-xs text-zinc-500">Example user budget</span><span className="mt-1 block text-2xl font-semibold">{formatInr(shoppingTrapScenario.exampleBudget)}</span></div>
        </section>

        <TaskContractPanel />

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-8"><ProductCatalogue products={shoppingTrapScenario.products} quantities={cart.quantities} dispatch={dispatch} /><EvidenceDrawer scenario={shoppingTrapScenario} /></div>
          <CartCheckout scenario={shoppingTrapScenario} cart={cart} totals={totals} checkoutOpen={checkoutOpen} onCheckoutOpenChange={setCheckoutOpen} dispatch={dispatch} />
        </div>
      </div>
    </main>
  );
}
