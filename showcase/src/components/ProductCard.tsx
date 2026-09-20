import { Coffee, Cookie, GlassWater, Sandwich } from 'lucide-react';
import type { Extra, Product } from '../api/products';
import { formatPrice, normalize, priceLabel } from '../lib/format';

function PlaceholderIcon({ category }: { category: string }) {
  const c = normalize(category);
  const props = { size: 34, strokeWidth: 1.6 } as const;
  if (/(snack|sale|sandwich|panini|burger|brunch|petit.?dej)/.test(c)) return <Sandwich {...props} />;
  if (/(dessert|gateau|patisserie|viennoiserie|douceur|sucre|cookie|crepe|gaufre)/.test(c)) return <Cookie {...props} />;
  if (/(froid|glace|jus|smoothie|boisson|soda|eau|frappe|milkshake)/.test(c)) return <GlassWater {...props} />;
  return <Coffee {...props} />;
}

export function ProductImage({ product, className = '' }: { product: Product; className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-primary-soft ${className}`}>
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100 text-primary/70 dark:from-emerald-500/10 dark:to-emerald-500/20">
          <PlaceholderIcon category={product.category} />
        </div>
      )}
    </div>
  );
}

export function ProductCard({ product, extras }: { product: Product; extras: Extra[] }) {
  const { prefix, text } = priceLabel(product);
  const productExtras = product.extraIds.map((id) => extras.find((e) => e.id === id)).filter((e): e is Extra => Boolean(e));

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-[#151D2A]">
      <ProductImage product={product} className="aspect-[4/3]" />

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-bold leading-snug text-gray-900 dark:text-white">{product.name}</h3>
            {product.subCategory && (
              <p className="mt-0.5 text-xs font-medium text-gray-400 dark:text-gray-500">{product.subCategory}</p>
            )}
          </div>
          <div className="shrink-0 text-right">
            {prefix && <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{prefix}</div>}
            <div className="text-base font-extrabold text-primary">{text}</div>
          </div>
        </div>

        {product.description && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{product.description}</p>
        )}

        {product.variants.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {product.variants.map((v) => (
              <span
                key={v.id}
                className="rounded-lg bg-gray-50 px-2 py-1 text-[11px] font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300"
              >
                {v.label}
                {(v.priceDelta ?? 0) !== 0 && (
                  <span className="ml-1 text-gray-400 dark:text-gray-500">
                    {(v.priceDelta ?? 0) > 0 ? '+' : ''}
                    {(v.priceDelta ?? 0).toFixed(2)}
                  </span>
                )}
              </span>
            ))}
          </div>
        )}

        {productExtras.length > 0 && (
          <p className="mt-3 border-t border-gray-100 pt-3 text-xs leading-relaxed text-gray-500 dark:border-gray-800 dark:text-gray-400">
            <span className="font-bold text-gray-700 dark:text-gray-300">Suppléments : </span>
            {productExtras.map((e) => `${e.name} (+${formatPrice(e.price)})`).join(' · ')}
          </p>
        )}
      </div>
    </article>
  );
}
