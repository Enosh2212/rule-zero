import { formatInr } from "../pricing";
import type { CartAction, Product } from "../types";

type ProductCatalogueProps = Readonly<{
  products: readonly Product[];
  quantities: Readonly<Record<string, number>>;
  dispatch: React.Dispatch<CartAction>;
}>;

export function ProductCatalogue({ products, quantities, dispatch }: ProductCatalogueProps) {
  return (
    <section aria-labelledby="catalogue-heading">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300">Controlled catalogue</p>
          <h2 id="catalogue-heading" className="mt-2 text-2xl font-semibold">Choose a power bank</h2>
        </div>
        <p className="text-sm text-zinc-500">3 deterministic products</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {products.map((product) => {
          const quantity = quantities[product.id] ?? 0;
          return (
            <article key={product.id} className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <div className="mb-5 grid aspect-[4/3] place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-cyan-400/15 via-zinc-900 to-violet-400/10">
                <div aria-hidden="true" className="relative h-24 w-14 rounded-xl border-2 border-zinc-500 bg-zinc-900 shadow-2xl">
                  <span className="absolute left-1/2 top-2 h-1 w-5 -translate-x-1/2 rounded bg-cyan-300/70" />
                  <span className="absolute bottom-3 left-1/2 -translate-x-1/2 font-mono text-[10px] text-zinc-500">R0</span>
                </div>
              </div>
              <h3 className="text-lg font-semibold">{product.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-zinc-400">{product.description}</p>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div><dt className="text-zinc-500">Capacity</dt><dd className="mt-1 text-zinc-200">{product.capacityMah.toLocaleString("en-IN")} mAh</dd></div>
                <div><dt className="text-zinc-500">Rating</dt><dd className="mt-1 text-zinc-200">{product.rating} / 5</dd></div>
                <div><dt className="text-zinc-500">Stock</dt><dd className="mt-1 text-zinc-200">{product.stock}</dd></div>
              </dl>
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <span className="font-semibold">{formatInr(product.price)}</span>
                <button
                  type="button"
                  onClick={() => dispatch({ type: "add_product", productId: product.id })}
                  disabled={quantity >= product.stock}
                  className="rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
                >
                  {quantity ? `Add another (${quantity})` : "Add to cart"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
