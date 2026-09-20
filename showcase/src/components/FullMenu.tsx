import { Search, SearchX, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Catalog, Extra, Product } from '../api/products';
import { buildGroups } from '../lib/catalogView';
import { formatTND, normalize, startingPrice } from '../lib/format';

const ALL = '__all__';

function ProductRow({ product, extras }: { product: Product; extras: Extra[] }) {
  const productExtras = product.extraIds.map((id) => extras.find((e) => e.id === id)).filter((e): e is Extra => Boolean(e));
  const hasVariants = product.variants.length > 0;
  const deltas = product.variants.map((v) => v.priceDelta ?? 0);
  const varies = hasVariants && Math.max(...deltas) > Math.min(...deltas);

  return (
    <li className="flex gap-4 border-b border-line py-4 last:border-b-0">
      {product.imageUrl && (
        <img src={product.imageUrl} alt="" loading="lazy" decoding="async" className="h-16 w-16 shrink-0 rounded-xl object-cover sm:h-20 sm:w-20" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-4">
          <h4 className="text-[15px] font-semibold text-ink">{product.name}</h4>
          <span className="shrink-0 text-sm tabular-nums text-ink">
            {varies && <span className="mr-1.5 text-[11px] uppercase tracking-wide text-subtle">dès</span>}
            {formatTND(startingPrice(product))}
          </span>
        </div>
        {product.subCategory && <p className="mt-0.5 text-xs text-subtle">{product.subCategory}</p>}
        {product.description && <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{product.description}</p>}
        {hasVariants && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {product.variants.map((v) => (
              <span key={v.id} className="rounded-full border border-line px-2.5 py-1 text-[11px] text-muted">
                {v.label}
                {(v.priceDelta ?? 0) !== 0 && (
                  <span className="ml-1 tabular-nums text-subtle">
                    {(v.priceDelta ?? 0) > 0 ? '+' : '−'}
                    {Math.abs(v.priceDelta ?? 0).toFixed(3)}
                  </span>
                )}
              </span>
            ))}
          </div>
        )}
        {productExtras.length > 0 && (
          <p className="mt-2.5 text-xs leading-relaxed text-subtle">
            <span className="font-semibold text-muted">Suppléments · </span>
            {productExtras.map((e) => `${e.name} (+${formatTND(e.price)})`).join(' · ')}
          </p>
        )}
      </div>
    </li>
  );
}

interface FullMenuProps {
  catalog: Catalog;
  initialCategory: string | null;
  onClose: () => void;
}

/** The whole menu — every available product from the system — shown in a modal over the one-page site. */
export function FullMenu({ catalog, initialCategory, onClose }: FullMenuProps) {
  const [active, setActive] = useState(initialCategory ?? ALL);
  const [query, setQuery] = useState('');

  const groups = useMemo(() => buildGroups(catalog), [catalog]);
  // If the chosen category vanished while the menu was open (refresh), fall back to everything.
  const current = active === ALL || groups.some((g) => g.name === active) ? active : ALL;

  const visible = useMemo(() => {
    const q = normalize(query);
    const matches = (p: Product) => !q || normalize(`${p.name} ${p.description ?? ''} ${p.subCategory ?? ''} ${p.category}`).includes(q);
    return groups
      .filter((g) => current === ALL || g.name === current)
      .map((g) => ({ name: g.name, products: g.products.filter(matches) }))
      .filter((g) => g.products.length > 0);
  }, [groups, current, query]);

  const chip = (isActive: boolean) =>
    `shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
      isActive ? 'bg-brand text-on-brand' : 'border border-line text-muted hover:border-brand hover:text-ink'
    }`;

  return (
    <div className="flex max-h-[92dvh] flex-col">
      <div className="border-b border-line px-5 pb-4 pt-5 sm:px-8 sm:pt-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-subtle">Notre menu</p>
            <h3 className="mt-2 font-serif text-3xl leading-none text-ink sm:text-4xl">Le menu complet</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le menu complet"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-brand"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative md:w-64">
            <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-subtle" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un produit…"
              aria-label="Rechercher un produit"
              className="w-full rounded-full border border-line bg-card py-2.5 pl-10 pr-4 text-[13px] text-ink outline-none placeholder:text-subtle focus:border-brand"
            />
          </div>
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 sm:-mx-8 sm:px-8 md:mx-0 md:px-0" role="tablist" aria-label="Catégories">
            <button type="button" role="tab" aria-selected={current === ALL} onClick={() => setActive(ALL)} className={chip(current === ALL)}>
              Tout
            </button>
            {groups.map((g) => (
              <button key={g.name} type="button" role="tab" aria-selected={current === g.name} onClick={() => setActive(g.name)} className={chip(current === g.name)}>
                {g.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-y-auto overscroll-contain px-5 pb-8 sm:px-8">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <SearchX size={38} strokeWidth={1.3} className="text-subtle" />
            <p className="mt-3 font-serif text-2xl text-ink">Aucun produit trouvé</p>
            <p className="mt-1 text-sm text-muted">Essayez un autre mot-clé ou une autre catégorie.</p>
          </div>
        ) : (
          visible.map((g) => (
            <section key={g.name} className="pt-6">
              <div className="flex items-center gap-3">
                <h4 className="font-serif text-2xl text-ink">{g.name}</h4>
                <span aria-hidden className="h-px flex-1 bg-brand/40" />
                <span className="text-xs text-subtle">{g.products.length}</span>
              </div>
              <ul className="mt-1 md:columns-2 md:gap-10 [&>li]:break-inside-avoid">
                {g.products.map((p) => (
                  <ProductRow key={p.id} product={p} extras={catalog.extras} />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
