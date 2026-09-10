import { SaleItem } from './salesTransactions';

export type ArticleCategory = SaleItem['category'];

// A recipe line is either a raw ingredient (a stockable StockProduct from the Stock module) or a
// sub-recipe (a reusable SubRecipe — e.g. "Pâte à Crêpe" shared by every crêpe product — defined
// and CRUD-managed in Gestion des produits → Sous-recettes). See productsModel.ts for the
// cost/margin calculations and circular-reference guard built on top of this shape.
export interface RecipeLine {
  id: string;
  kind: 'ingredient' | 'subrecipe';
  ingredientId?: string; // StockProduct.id, when kind === 'ingredient'
  subRecipeId?: string; // SubRecipe.id, when kind === 'subrecipe'
  quantity: number;
  unit: string; // a StockUnit name (see stockModel.ts) — the single unit catalog shared app-wide
}

export interface CatalogArticle {
  id: string;
  name: string;
  category: ArticleCategory;
  subCategory?: string;
  price: number;
  description?: string;
  imageUrl?: string;
  // Undefined is treated as available — most seeded articles never set this explicitly.
  isAvailable?: boolean;
  extraIds?: string[]; // references CatalogExtra.id — reuses the existing extras catalog
  variants?: VariantOption[]; // per-product variants (distinct from the category-level groups below)
  recipe?: RecipeLine[];
  targetMarginRate?: number; // overrides DEFAULT_TARGET_MARGIN_RATE when set
  createdAt?: string;
}

export interface CatalogExtra {
  id: string;
  name: string;
  price: number;
}

export interface VariantOption {
  id: string;
  label: string;
  priceDelta?: number;
}

export interface VariantGroup {
  id: string;
  label: string;
  options: VariantOption[];
}

// Variants are proposed only for the drink categories where a size/milk choice is meaningful;
// Pâtisserie / Snack / Épicerie Café intentionally have no variant group.
export const VARIANT_GROUPS_BY_CATEGORY: Partial<Record<ArticleCategory, VariantGroup>> = {
  'Café chaud': {
    id: 'taille-chaud',
    label: 'Taille',
    options: [
      { id: 'petit', label: 'Petit' },
      { id: 'moyen', label: 'Moyen', priceDelta: 1.0 },
      { id: 'grand', label: 'Grand', priceDelta: 2.0 },
    ],
  },
  'Boisson lactée': {
    id: 'lait-type',
    label: 'Type de lait',
    options: [
      { id: 'entier', label: 'Lait entier' },
      { id: 'ecreme', label: 'Lait écrémé' },
      { id: 'avoine', label: "Lait d'avoine", priceDelta: 1.0 },
      { id: 'amande', label: "Lait d'amande", priceDelta: 1.0 },
    ],
  },
  'Boisson glacée': {
    id: 'taille-glace',
    label: 'Taille',
    options: [
      { id: 'moyen-g', label: 'Moyen' },
      { id: 'grand-g', label: 'Grand', priceDelta: 1.5 },
    ],
  },
};

export const getArticleById = (id: string, articles: CatalogArticle[]): CatalogArticle | undefined =>
  articles.find((a) => a.id === id);

export const getExtraById = (id: string, extras: CatalogExtra[]): CatalogExtra | undefined =>
  extras.find((e) => e.id === id);

export const getVariantGroupForCategory = (category: ArticleCategory): VariantGroup | undefined =>
  VARIANT_GROUPS_BY_CATEGORY[category];

export const getVariantOption = (category: ArticleCategory, optionId: string): VariantOption | undefined =>
  VARIANT_GROUPS_BY_CATEGORY[category]?.options.find((o) => o.id === optionId);

// Articles grouped by category, in a stable order, for building <optgroup> pickers.
export const ARTICLE_CATEGORIES_ORDER: ArticleCategory[] = [
  'Café chaud',
  'Boisson lactée',
  'Boisson glacée',
  'Pâtisserie',
  'Snack',
  'Épicerie Café',
];
