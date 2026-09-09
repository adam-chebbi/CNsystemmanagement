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

export const EMPLOYEES: string[] = ['Karim', 'Leila', 'Samira', 'Mehdi', 'Youssef'];

export const SHIFTS: string[] = ['Matin (07h - 14h)', 'Après-midi (14h - 19h)', 'Soir (19h - 23h)'];

// Seed catalog — the single canonical list of sellable products, used by Ventes (manual entry +
// import) and by "Produits, recettes & marges" alike. New products created in that section extend
// this same array (lifted to live state in App.tsx); this constant is only the initial snapshot.
export const initialCatalogArticles: CatalogArticle[] = [
  // Café chaud
  { id: 'esp-double', name: 'Espresso Double Arabica', category: 'Café chaud', price: 7.0 },
  { id: 'esp-simple', name: 'Espresso Simple Arabica', category: 'Café chaud', price: 4.5 },
  { id: 'esp-ristretto', name: 'Espresso Ristretto Intenso', category: 'Café chaud', price: 4.5 },
  { id: 'americano', name: 'Americano Grande Taille', category: 'Café chaud', price: 6.5 },
  { id: 'allonge-colombie', name: 'Café Allongé Colombie', category: 'Café chaud', price: 5.5 },
  { id: 'chemex', name: 'Café Chemex Dégustation 2 pers', category: 'Café chaud', price: 18.0 },

  // Boisson lactée
  { id: 'latte-vanille', name: 'Latte Vanille Noisette', category: 'Boisson lactée', price: 8.5 },
  { id: 'flat-white', name: 'Flat White Double Shot', category: 'Boisson lactée', price: 8.0 },
  { id: 'cappuccino-avoine', name: 'Cappuccino Mousse Avoine', category: 'Boisson lactée', price: 8.0 },
  { id: 'macchiato', name: 'Espresso Macchiato Onctueux', category: 'Boisson lactée', price: 6.0 },
  { id: 'matcha-latte', name: 'Matcha Latte Bio Cérémonial', category: 'Boisson lactée', price: 9.5 },
  { id: 'cortado', name: 'Café Cortado Tradition', category: 'Boisson lactée', price: 6.0 },
  { id: 'chocolat-chaud', name: 'Chocolat Chaud Gourmand Maison', category: 'Boisson lactée', price: 9.0 },

  // Boisson glacée
  { id: 'jus-orange', name: "Jus d'Orange Pressé", category: 'Boisson glacée', price: 7.5 },
  { id: 'eau-min', name: 'Bouteille Eau Minérale 50cl', category: 'Boisson glacée', price: 2.5 },
  { id: 'cold-brew-sig', name: 'Cold Brew Signature Éthiopie', category: 'Boisson glacée', price: 9.0 },
  { id: 'iced-caramel', name: 'Iced Caramel Macchiato', category: 'Boisson glacée', price: 9.0 },
  { id: 'iced-latte-amande', name: "Iced Latte Lait d'Amande", category: 'Boisson glacée', price: 9.0 },

  // Pâtisserie
  { id: 'croissant', name: 'Croissant Pur Beurre', category: 'Pâtisserie', price: 4.5 },
  { id: 'cookie', name: 'Cookie Pépites Chocolat Noir', category: 'Pâtisserie', price: 5.5 },
  { id: 'pain-choc', name: 'Pain au Chocolat Feuilleté', category: 'Pâtisserie', price: 5.0 },
  { id: 'cheesecake', name: 'Cheesecake Spéculoos Maison', category: 'Pâtisserie', price: 11.5 },
  { id: 'tartelette-citron', name: 'Tartelette Citron Meringuée', category: 'Pâtisserie', price: 9.5 },
  { id: 'muffin-myrtille', name: 'Muffin Myrtilles Sauvages', category: 'Pâtisserie', price: 6.0 },

  // Snack
  { id: 'brunch', name: 'Formule Brunch Café Noir', category: 'Snack', price: 26.0 },
  { id: 'toast-avocat', name: 'Toast Avocat & Saumon Fumé', category: 'Snack', price: 16.5 },
  { id: 'club-sandwich', name: 'Club Sandwich Poulet Grillé', category: 'Snack', price: 13.5 },
  { id: 'pancakes', name: "Pancakes Sirop d'Érable", category: 'Snack', price: 14.0 },

  // Épicerie Café
  { id: 'grains-yirgacheffe', name: 'Grains Café Éthiopie Yirgacheffe 250g', category: 'Épicerie Café', price: 26.0 },
  { id: 'grains-colombie', name: 'Grains Colombie Supremo 500g', category: 'Épicerie Café', price: 42.0 },
];

export const CATALOG_EXTRAS: CatalogExtra[] = [
  { id: 'extra-shot', name: 'Shot espresso supplémentaire', price: 2.5 },
  { id: 'extra-lait-avoine', name: "Lait d'avoine", price: 1.5 },
  { id: 'extra-lait-amande', name: "Lait d'amande", price: 1.5 },
  { id: 'extra-sirop-vanille', name: 'Sirop vanille', price: 1.0 },
  { id: 'extra-sirop-caramel', name: 'Sirop caramel', price: 1.0 },
  { id: 'extra-chantilly', name: 'Chantilly', price: 1.5 },
  { id: 'extra-choco-supp', name: 'Chocolat supplémentaire', price: 1.5 },
  { id: 'extra-sans-sucre', name: 'Sans sucre', price: 0 },
];

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

// `articles` defaults to the static seed so every pre-existing call site keeps working unchanged;
// pages that hold the live (stateful) product list pass it explicitly to see newly created products.
export const getArticleById = (id: string, articles: CatalogArticle[] = initialCatalogArticles): CatalogArticle | undefined =>
  articles.find((a) => a.id === id);

export const getExtraById = (id: string): CatalogExtra | undefined =>
  CATALOG_EXTRAS.find((e) => e.id === id);

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
