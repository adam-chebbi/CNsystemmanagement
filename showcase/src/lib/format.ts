import type { Product } from '../api/products';

export function formatPrice(value: number): string {
  return `${value.toFixed(2)} DT`;
}

/** Price to advertise on a card: the base price, or "à partir de" the cheapest variant. */
export function priceLabel(product: Product): { prefix: string; text: string } {
  const deltas = product.variants.map((v) => v.priceDelta ?? 0);
  const min = deltas.length ? Math.min(...deltas) : 0;
  const max = deltas.length ? Math.max(...deltas) : 0;
  return {
    prefix: max > min ? 'À partir de' : '',
    text: formatPrice(product.price + min),
  };
}

/** Lowercase, accent-free text for forgiving search matching. */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
