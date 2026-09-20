import { RefreshCw, Search, SearchX, WifiOff } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Catalog, Product } from '../api/products';
import { ProductCard } from '../components/ProductCard';
import { normalize } from '../lib/format';
import { useCatalog } from '../lib/useCatalog';

const ALL = '__all__';

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-gray-800 dark:bg-[#151D2A]">
      <div className="skeleton aspect-[4/3]" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-4 w-2/3 rounded" />
        <div className="skeleton h-3 w-full rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}

function Menu({ catalog }: { catalog: Catalog }) {
  const [activeCategory, setActiveCategory] = useState(ALL);
  const [query, setQuery] = useState('');

  // Categories in the system's order, then any category that only appears on products.
  const categoryNames = useMemo(() => {
    const names = catalog.categories.map((c) => c.name);
    for (const p of catalog.products) if (!names.includes(p.category)) names.push(p.category);
    return names.filter((n) => catalog.products.some((p) => p.category === n));
  }, [catalog]);

  const groups = useMemo(() => {
    const q = normalize(query);
    const matches = (p: Product) =>
      !q || normalize(`${p.name} ${p.description ?? ''} ${p.subCategory ?? ''} ${p.category}`).includes(q);
    return categoryNames
      .filter((name) => activeCategory === ALL || activeCategory === name)
      .map((name) => ({ name, products: catalog.products.filter((p) => p.category === name && matches(p)) }))
      .filter((g) => g.products.length > 0);
  }, [catalog, categoryNames, activeCategory, query]);

  const chip = (active: boolean) =>
    `shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
      active
        ? 'bg-primary text-white shadow-sm'
        : 'border border-gray-100 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-[#151D2A] dark:text-gray-300 dark:hover:bg-gray-800'
    }`;

  return (
    <>
      <div className="sticky top-16 z-30 -mx-4 border-b border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-md dark:border-gray-800 dark:bg-[#111827]/90 sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative md:w-72">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un produit…"
              aria-label="Rechercher un produit"
              className="w-full rounded-xl border border-gray-100 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-primary dark:border-gray-800 dark:bg-[#151D2A] dark:text-white"
            />
          </div>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0" role="tablist" aria-label="Catégories">
            <button type="button" role="tab" aria-selected={activeCategory === ALL} onClick={() => setActiveCategory(ALL)} className={chip(activeCategory === ALL)}>
              Tout
            </button>
            {categoryNames.map((name) => (
              <button
                key={name}
                type="button"
                role="tab"
                aria-selected={activeCategory === name}
                onClick={() => setActiveCategory(name)}
                className={chip(activeCategory === name)}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <SearchX size={40} className="text-gray-300 dark:text-gray-600" />
          <p className="mt-3 text-base font-bold text-gray-700 dark:text-gray-200">Aucun produit trouvé</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Essayez un autre mot-clé ou une autre catégorie.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-12">
          {groups.map((g) => (
            <section key={g.name} aria-labelledby={`cat-${g.name}`}>
              <div className="mb-4 flex items-baseline gap-3">
                <h2 id={`cat-${g.name}`} className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                  {g.name}
                </h2>
                <span className="text-sm font-semibold text-gray-400 dark:text-gray-500">{g.products.length}</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {g.products.map((p) => (
                  <ProductCard key={p.id} product={p} extras={catalog.extras} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

export function MenuPage() {
  const { state, retry } = useCatalog();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6">
      <div className="mb-6 animate-fade-up">
        <p className="text-sm font-bold uppercase tracking-wider text-primary">Notre carte</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Le menu Café Noir</h1>
        <p className="mt-2 max-w-xl text-gray-500 dark:text-gray-400">
          Tous nos produits, à jour en temps réel. Les prix sont en dinars tunisiens (DT).
        </p>
      </div>

      {state.status === 'loading' && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Chargement du menu">
          {Array.from({ length: 6 }, (_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {state.status === 'error' && (
        <div className="mt-16 flex flex-col items-center text-center">
          <WifiOff size={40} className="text-gray-300 dark:text-gray-600" />
          <p className="mt-3 text-base font-bold text-gray-700 dark:text-gray-200">Impossible de charger le menu</p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Vérifiez votre connexion puis réessayez.</p>
          <button
            type="button"
            onClick={retry}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-600"
          >
            <RefreshCw size={16} /> Réessayer
          </button>
        </div>
      )}

      {state.status === 'ready' &&
        (state.catalog.products.length === 0 ? (
          <p className="mt-16 text-center text-gray-500 dark:text-gray-400">Le menu sera bientôt disponible.</p>
        ) : (
          <Menu catalog={state.catalog} />
        ))}
    </div>
  );
}
