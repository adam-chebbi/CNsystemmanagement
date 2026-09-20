import { API_BASE_URL } from '../config/site';

// Mirrors the contract in PUBLIC_PRODUCTS_API.md (GET /api/products).
export interface Category {
  id: string;
  name: string;
}
export interface SubCategory {
  id: string;
  categoryId: string;
  name: string;
}
export interface Extra {
  id: string;
  name: string;
  price: number;
}
export interface VariantOption {
  id: string;
  label: string;
  priceDelta?: number;
}
export interface Product {
  id: string;
  name: string;
  category: string;
  subCategory: string | null;
  price: number;
  description: string | null;
  imageUrl: string | null;
  extraIds: string[];
  variants: VariantOption[];
}
export interface Catalog {
  categories: Category[];
  subCategories: SubCategory[];
  extras: Extra[];
  products: Product[];
}

const CACHE_TTL_MS = 60_000;
let cache: { at: number; data: Catalog } | null = null;
let inflight: Promise<Catalog> | null = null;

/** Fetches the live catalog. Results are shared for a minute so page changes don't refetch. */
export function fetchCatalog(force = false): Promise<Catalog> {
  if (!force && cache && Date.now() - cache.at < CACHE_TTL_MS) return Promise.resolve(cache.data);
  if (inflight) return inflight;

  inflight = (async () => {
    const res = await fetch(`${API_BASE_URL}/api/products`, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = (await res.json()) as Partial<Catalog>;
    const data: Catalog = {
      categories: raw.categories ?? [],
      subCategories: raw.subCategories ?? [],
      extras: raw.extras ?? [],
      products: (raw.products ?? []).map((p) => ({
        ...p,
        extraIds: p.extraIds ?? [],
        variants: p.variants ?? [],
      })),
    };
    cache = { at: Date.now(), data };
    return data;
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}
