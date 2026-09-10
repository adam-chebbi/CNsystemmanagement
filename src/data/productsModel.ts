// Shared domain model for "Produits, recettes & marges" — built directly around the existing
// sellable-product entity (CatalogArticle, already used by Ventes) and the existing stockable
// ingredient/unit catalog (StockProduct/StockUnit, already used by Stock), rather than a second,
// parallel representation of products, ingredients, units or extras.

import { normalizeKey } from './textUtils';
import { StockProduct, convertQuantity, areUnitsCompatible } from './stockModel';
import { CatalogArticle, CatalogExtra, RecipeLine, VariantOption, ArticleCategory } from './manualSalesCatalog';
import { SaleTransaction } from './salesTransactions';

export { areUnitsCompatible, convertQuantity };

let idCounter = 0;
export const generateProductId = (prefix: string): string => {
  idCounter += 1;
  return `${prefix}-${idCounter}-${Date.now().toString(36)}`;
};

// --- Categories & sub-categories (Catalogue page) ------------------------------------------

export interface ProductCategory {
  id: string;
  name: string;
  createdAt: string;
}

export interface ProductSubCategory {
  id: string;
  categoryId: string;
  name: string;
  createdAt: string;
}

export const resolveProductCategoryByName = (raw: string, categories: ProductCategory[]): ProductCategory | undefined => {
  const key = normalizeKey(raw);
  if (!key) return undefined;
  return categories.find((c) => normalizeKey(c.name) === key);
};

export const resolveProductSubCategoryByName = (
  raw: string,
  subCategories: ProductSubCategory[],
  categoryId?: string
): ProductSubCategory | undefined => {
  const key = normalizeKey(raw);
  if (!key) return undefined;
  return subCategories.find((s) => normalizeKey(s.name) === key && (!categoryId || s.categoryId === categoryId));
};

export const getCategoryUsageCount = (category: ProductCategory, articles: CatalogArticle[]): number =>
  articles.filter((a) => normalizeKey(a.category) === normalizeKey(category.name)).length;

export const getSubCategoryUsageCount = (subCategory: ProductSubCategory, articles: CatalogArticle[]): number =>
  articles.filter((a) => a.subCategory && normalizeKey(a.subCategory) === normalizeKey(subCategory.name)).length;

// --- Margins ------------------------------------------------------------------------------

// No target-margin setting existed anywhere in the app; this is the single new default, used
// unless a product sets its own targetMarginRate override.
export const DEFAULT_TARGET_MARGIN_RATE = 0.65;

export interface MarginResult {
  grossMargin: number;
  marginRate: number;
}

// Marge brute = Prix de vente - Coût matière ; Taux de marge = Marge brute / Prix de vente.
export const computeMargin = (price: number, cost: number): MarginResult => {
  const grossMargin = price - cost;
  const marginRate = price > 0 ? grossMargin / price : 0;
  return { grossMargin, marginRate };
};

export type MarginComparison = 'atteint' | 'inferieur' | 'depasse';

export const compareToTargetMargin = (marginRate: number, targetRate: number): MarginComparison => {
  if (Math.abs(marginRate - targetRate) < 0.005) return 'atteint';
  return marginRate < targetRate ? 'inferieur' : 'depasse';
};

// --- Sub-recipes: reusable recipe components shared across products (e.g. "Pâte à Crêpe" used
// by every crêpe on the menu) — CRUD-managed on their own page, referenced by id from any
// product's fiche technique or from another sub-recipe (nesting is allowed; see
// detectCircularReference below for the cycle guard this requires). ------------------------

export interface SubRecipe {
  id: string;
  name: string;
  description?: string;
  yieldQuantity: number; // how much one batch produces, e.g. 1000
  yieldUnit: string; // a StockUnit name, e.g. "g" — the batch is costed/consumed in this unit
  ingredients: RecipeLine[]; // ingredient and/or nested sub-recipe lines
  createdAt: string;
}

export const resolveSubRecipeByName = (raw: string, subRecipes: SubRecipe[]): SubRecipe | undefined => {
  const key = normalizeKey(raw);
  if (!key) return undefined;
  return subRecipes.find((sr) => normalizeKey(sr.name) === key);
};

export const getSubRecipeUsageCount = (subRecipe: SubRecipe, articles: CatalogArticle[], allSubRecipes: SubRecipe[]): number => {
  const inProducts = articles.filter((a) => (a.recipe ?? []).some((l) => l.kind === 'subrecipe' && l.subRecipeId === subRecipe.id)).length;
  const inOtherSubRecipes = allSubRecipes.filter(
    (sr) => sr.id !== subRecipe.id && sr.ingredients.some((l) => l.kind === 'subrecipe' && l.subRecipeId === subRecipe.id)
  ).length;
  return inProducts + inOtherSubRecipes;
};

// --- Recipe (fiche technique) cost calculation, with circular sub-recipe protection ---------

export interface RecipeCostResult {
  cost: number;
  errors: string[];
}

const computeRecipeLineCost = (
  line: RecipeLine,
  ingredients: StockProduct[],
  subRecipes: SubRecipe[],
  visiting: Set<string>
): { cost: number; error?: string } => {
  if (line.kind === 'ingredient') {
    if (!line.ingredientId) return { cost: 0, error: 'Ingrédient manquant' };
    const ingredient = ingredients.find((i) => i.id === line.ingredientId);
    if (!ingredient) return { cost: 0, error: 'Ingrédient introuvable' };
    const converted = convertQuantity(line.quantity, line.unit, ingredient.unit);
    if (converted === null) return { cost: 0, error: `Unité "${line.unit}" incompatible avec "${ingredient.unit}"` };
    return { cost: converted * ingredient.averageCost };
  }

  if (!line.subRecipeId) return { cost: 0, error: 'Sous-recette manquante' };
  if (visiting.has(line.subRecipeId)) return { cost: 0, error: 'Référence circulaire détectée' };
  const subRecipe = subRecipes.find((sr) => sr.id === line.subRecipeId);
  if (!subRecipe) return { cost: 0, error: 'Sous-recette introuvable' };

  const batchResult = computeRecipeCost(subRecipe.ingredients, ingredients, subRecipes, new Set(visiting).add(line.subRecipeId));
  const costPerYieldUnit = subRecipe.yieldQuantity > 0 ? batchResult.cost / subRecipe.yieldQuantity : 0;
  const convertedQty = convertQuantity(line.quantity, line.unit, subRecipe.yieldUnit);
  if (convertedQty === null) {
    return { cost: 0, error: `Unité "${line.unit}" incompatible avec l'unité de la sous-recette ("${subRecipe.yieldUnit}")` };
  }
  return {
    cost: convertedQty * costPerYieldUnit,
    error: batchResult.errors.length > 0 ? 'Erreur dans la sous-recette' : undefined,
  };
};

export const computeRecipeCost = (
  recipe: RecipeLine[],
  ingredients: StockProduct[],
  subRecipes: SubRecipe[],
  visiting: Set<string> = new Set()
): RecipeCostResult => {
  let cost = 0;
  const errors: string[] = [];
  recipe.forEach((line) => {
    const result = computeRecipeLineCost(line, ingredients, subRecipes, visiting);
    cost += result.cost;
    if (result.error) errors.push(result.error);
  });
  return { cost, errors };
};

// Checks whether candidateSubRecipeId would end up referencing itself, directly or through a
// chain of nested sub-recipes, if `ingredientLines` were saved as its ingredient list.
export const detectCircularReference = (
  candidateSubRecipeId: string,
  ingredientLines: RecipeLine[],
  subRecipes: SubRecipe[],
  visited: Set<string> = new Set()
): boolean => {
  for (const line of ingredientLines) {
    if (line.kind !== 'subrecipe' || !line.subRecipeId) continue;
    if (line.subRecipeId === candidateSubRecipeId) return true;
    if (visited.has(line.subRecipeId)) continue;
    const subRecipe = subRecipes.find((sr) => sr.id === line.subRecipeId);
    if (!subRecipe) continue;
    const nextVisited = new Set(visited);
    nextVisited.add(line.subRecipeId);
    if (detectCircularReference(candidateSubRecipeId, subRecipe.ingredients, subRecipes, nextVisited)) return true;
  }
  return false;
};

// --- Theoretical consumption (calculation only — never modifies stock) ---------------------

// Recursively expands sub-recipe lines into their underlying ingredients (a sold "Crêpe" that
// uses 150g of "Pâte à Crêpe" counts towards flour/milk/etc. consumption too), scaled by how many
// units of the parent recipe were actually sold.
const accumulateRecipeConsumption = (
  recipe: RecipeLine[],
  multiplier: number,
  ingredients: StockProduct[],
  subRecipes: SubRecipe[],
  consumption: Map<string, number>,
  visiting: Set<string>
): void => {
  recipe.forEach((line) => {
    if (line.kind === 'ingredient') {
      if (!line.ingredientId) return;
      const ingredient = ingredients.find((i) => i.id === line.ingredientId);
      if (!ingredient) return;
      const converted = convertQuantity(line.quantity, line.unit, ingredient.unit);
      if (converted === null) return;
      consumption.set(line.ingredientId, (consumption.get(line.ingredientId) ?? 0) + converted * multiplier);
      return;
    }
    if (!line.subRecipeId || visiting.has(line.subRecipeId)) return;
    const subRecipe = subRecipes.find((sr) => sr.id === line.subRecipeId);
    if (!subRecipe || subRecipe.yieldQuantity <= 0) return;
    const convertedQty = convertQuantity(line.quantity, line.unit, subRecipe.yieldUnit);
    if (convertedQty === null) return;
    const batchFraction = (convertedQty * multiplier) / subRecipe.yieldQuantity;
    accumulateRecipeConsumption(
      subRecipe.ingredients,
      batchFraction,
      ingredients,
      subRecipes,
      consumption,
      new Set(visiting).add(line.subRecipeId)
    );
  });
};

// Ventes × quantité de recette = consommation théorique. Pure read-only estimate; any real stock
// change still has to go through a manual Stock → Mouvements entry.
export const computeTheoreticalConsumption = (
  transactions: SaleTransaction[],
  articles: CatalogArticle[],
  ingredients: StockProduct[],
  subRecipes: SubRecipe[]
): Map<string, number> => {
  const consumption = new Map<string, number>();
  transactions.forEach((tx) => {
    tx.items.forEach((item) => {
      const article =
        articles.find((a) => normalizeKey(a.name) === normalizeKey(item.name)) ??
        articles.find((a) => normalizeKey(item.name).startsWith(normalizeKey(a.name)));
      if (!article?.recipe) return;
      accumulateRecipeConsumption(article.recipe, item.qty, ingredients, subRecipes, consumption, new Set());
    });
  });
  return consumption;
};

// --- Draft product (Ajout produits workflow) ------------------------------------------------

export type DraftRecipeLine = RecipeLine;

export interface DraftProduct {
  id: string; // pre-generated up front so self-reference / circular checks work before saving
  name: string;
  description: string;
  imageUrl: string;
  price: string;
  categoryId: string;
  subCategoryId: string;
  isAvailable: boolean;
  recipe: DraftRecipeLine[];
  variants: VariantOption[];
  extraIds: string[];
  targetMarginRate: string;
}

export const createEmptyDraftProduct = (): DraftProduct => ({
  id: generateProductId('prod'),
  name: '',
  description: '',
  imageUrl: '',
  price: '',
  categoryId: '',
  subCategoryId: '',
  isAvailable: true,
  recipe: [],
  variants: [],
  extraIds: [],
  targetMarginRate: '',
});

// Edit mode: seed the draft from an existing product so "Modifier" reuses the exact same
// Saisie → Validation → Prévisualisation → Confirmation workflow as creation.
export const createDraftFromArticle = (
  article: CatalogArticle,
  categories: ProductCategory[],
  subCategories: ProductSubCategory[]
): DraftProduct => {
  const category = categories.find((c) => c.name === article.category);
  const subCategory = subCategories.find((s) => article.subCategory && s.name === article.subCategory);
  return {
    id: article.id,
    name: article.name,
    description: article.description ?? '',
    imageUrl: article.imageUrl ?? '',
    price: String(article.price),
    categoryId: category?.id ?? '',
    subCategoryId: subCategory?.id ?? '',
    isAvailable: article.isAvailable !== false,
    recipe: (article.recipe ?? []).map((line) => ({ ...line })),
    variants: (article.variants ?? []).map((v) => ({ ...v })),
    extraIds: [...(article.extraIds ?? [])],
    targetMarginRate: article.targetMarginRate !== undefined ? String(article.targetMarginRate) : '',
  };
};

export const createEmptyRecipeLine = (): DraftRecipeLine => ({
  id: generateProductId('rline'),
  kind: 'ingredient',
  ingredientId: '',
  quantity: 0,
  unit: '',
});

export interface ProductValidationIssue {
  field: string;
  message: string;
}

export const validateDraftProduct = (
  draft: DraftProduct,
  categories: ProductCategory[],
  subCategories: ProductSubCategory[],
  ingredients: StockProduct[],
  subRecipes: SubRecipe[],
  extras: CatalogExtra[]
): ProductValidationIssue[] => {
  const issues: ProductValidationIssue[] = [];

  if (!draft.name.trim()) issues.push({ field: 'name', message: 'Le nom du produit est obligatoire.' });

  const priceNum = Number(draft.price);
  if (!draft.price.trim()) issues.push({ field: 'price', message: 'Le prix de vente est obligatoire.' });
  else if (Number.isNaN(priceNum) || priceNum <= 0) issues.push({ field: 'price', message: 'Le prix de vente doit être un nombre supérieur à 0.' });

  const category = categories.find((c) => c.id === draft.categoryId);
  if (!draft.categoryId) issues.push({ field: 'category', message: 'La catégorie est obligatoire.' });
  else if (!category) issues.push({ field: 'category', message: 'Catégorie invalide.' });

  if (draft.subCategoryId) {
    const subCat = subCategories.find((s) => s.id === draft.subCategoryId);
    if (!subCat) issues.push({ field: 'subCategory', message: 'Sous-catégorie invalide.' });
    else if (subCat.categoryId !== draft.categoryId) {
      issues.push({ field: 'subCategory', message: "La sous-catégorie sélectionnée n'appartient pas à la catégorie choisie." });
    }
  }

  draft.recipe.forEach((line, idx) => {
    const label = `Fiche technique — Ligne ${idx + 1}`;
    if (!(line.quantity > 0)) {
      issues.push({ field: `recipe-${line.id}`, message: `${label} : la quantité doit être supérieure à 0.` });
    }
    if (line.kind === 'ingredient') {
      if (!line.ingredientId) {
        issues.push({ field: `recipe-${line.id}`, message: `${label} : sélectionnez un ingrédient.` });
      } else {
        const ing = ingredients.find((i) => i.id === line.ingredientId);
        if (!ing) issues.push({ field: `recipe-${line.id}`, message: `${label} : ingrédient introuvable.` });
        else if (!line.unit) issues.push({ field: `recipe-${line.id}`, message: `${label} : sélectionnez une unité.` });
        else if (!areUnitsCompatible(line.unit, ing.unit)) {
          issues.push({
            field: `recipe-${line.id}`,
            message: `${label} : l'unité "${line.unit}" est incompatible avec l'unité de stock de cet ingrédient ("${ing.unit}").`,
          });
        }
      }
    } else {
      if (!line.subRecipeId) {
        issues.push({ field: `recipe-${line.id}`, message: `${label} : sélectionnez une sous-recette.` });
      } else {
        const subRecipe = subRecipes.find((sr) => sr.id === line.subRecipeId);
        if (!subRecipe) issues.push({ field: `recipe-${line.id}`, message: `${label} : sous-recette introuvable.` });
        else if (!line.unit) issues.push({ field: `recipe-${line.id}`, message: `${label} : sélectionnez une unité.` });
        else if (!areUnitsCompatible(line.unit, subRecipe.yieldUnit)) {
          issues.push({
            field: `recipe-${line.id}`,
            message: `${label} : l'unité "${line.unit}" est incompatible avec l'unité de la sous-recette ("${subRecipe.yieldUnit}").`,
          });
        }
      }
    }
  });

  draft.variants.forEach((v, idx) => {
    if (!v.label.trim()) issues.push({ field: `variant-${v.id}`, message: `Variante ${idx + 1} : le nom est obligatoire.` });
  });

  draft.extraIds.forEach((exId) => {
    if (!extras.some((e) => e.id === exId)) {
      issues.push({ field: 'extras', message: 'Un extra sélectionné est invalide.' });
    }
  });

  if (draft.targetMarginRate.trim() !== '') {
    const rate = Number(draft.targetMarginRate);
    if (Number.isNaN(rate) || rate < 0 || rate > 1) {
      issues.push({ field: 'targetMarginRate', message: 'La marge cible doit être un nombre entre 0 et 1 (ex: 0.65 pour 65%).' });
    }
  }

  return issues;
};

export const buildCatalogArticleFromDraft = (
  draft: DraftProduct,
  categories: ProductCategory[],
  subCategories: ProductSubCategory[]
): CatalogArticle => {
  const category = categories.find((c) => c.id === draft.categoryId);
  const subCategory = subCategories.find((s) => s.id === draft.subCategoryId);
  return {
    id: draft.id,
    name: draft.name.trim(),
    category: (category?.name ?? '') as ArticleCategory,
    subCategory: subCategory?.name,
    price: Number(draft.price),
    description: draft.description.trim() || undefined,
    imageUrl: draft.imageUrl || undefined,
    isAvailable: draft.isAvailable,
    extraIds: draft.extraIds.length > 0 ? draft.extraIds : undefined,
    variants: draft.variants.length > 0 ? draft.variants : undefined,
    recipe: draft.recipe.length > 0 ? draft.recipe : undefined,
    targetMarginRate: draft.targetMarginRate.trim() !== '' ? Number(draft.targetMarginRate) : undefined,
    createdAt: new Date().toISOString().slice(0, 10),
  };
};

export const getExtrasForArticle = (article: CatalogArticle, extras: CatalogExtra[]): CatalogExtra[] =>
  (article.extraIds ?? []).map((id) => extras.find((e) => e.id === id)).filter((e): e is CatalogExtra => Boolean(e));

// --- Draft sub-recipe (Sous-recettes CRUD workflow) -----------------------------------------

export interface DraftSubRecipe {
  id: string; // pre-generated up front so self-reference / circular checks work before saving
  name: string;
  description: string;
  yieldQuantity: string;
  yieldUnit: string;
  ingredients: DraftRecipeLine[];
}

export const createEmptyDraftSubRecipe = (): DraftSubRecipe => ({
  id: generateProductId('subrec'),
  name: '',
  description: '',
  yieldQuantity: '',
  yieldUnit: '',
  ingredients: [],
});

// Edit mode: seed the draft from an existing sub-recipe so "Modifier" reuses the exact same
// Saisie → Validation → Prévisualisation → Confirmation workflow as creation.
export const createDraftFromSubRecipe = (subRecipe: SubRecipe): DraftSubRecipe => ({
  id: subRecipe.id,
  name: subRecipe.name,
  description: subRecipe.description ?? '',
  yieldQuantity: String(subRecipe.yieldQuantity),
  yieldUnit: subRecipe.yieldUnit,
  ingredients: subRecipe.ingredients.map((line) => ({ ...line })),
});

export interface SubRecipeValidationIssue {
  field: string;
  message: string;
}

export const validateDraftSubRecipe = (
  draft: DraftSubRecipe,
  ingredients: StockProduct[],
  subRecipes: SubRecipe[]
): SubRecipeValidationIssue[] => {
  const issues: SubRecipeValidationIssue[] = [];

  if (!draft.name.trim()) {
    issues.push({ field: 'name', message: 'Le nom de la sous-recette est obligatoire.' });
  } else {
    const existing = resolveSubRecipeByName(draft.name, subRecipes);
    if (existing && existing.id !== draft.id) {
      issues.push({ field: 'name', message: `Cette sous-recette existe déjà : « ${existing.name} ». Utilisez la sous-recette existante.` });
    }
  }

  const yieldQtyNum = Number(draft.yieldQuantity);
  if (!draft.yieldQuantity.trim()) issues.push({ field: 'yieldQuantity', message: 'La quantité produite est obligatoire.' });
  else if (Number.isNaN(yieldQtyNum) || yieldQtyNum <= 0) issues.push({ field: 'yieldQuantity', message: 'La quantité produite doit être un nombre supérieur à 0.' });

  if (!draft.yieldUnit) issues.push({ field: 'yieldUnit', message: "L'unité produite est obligatoire." });

  if (draft.ingredients.length === 0) {
    issues.push({ field: 'ingredients', message: 'Ajoutez au moins un ingrédient ou une sous-recette.' });
  }

  draft.ingredients.forEach((line, idx) => {
    const label = `Ligne ${idx + 1}`;
    if (!(line.quantity > 0)) {
      issues.push({ field: `line-${line.id}`, message: `${label} : la quantité doit être supérieure à 0.` });
    }
    if (line.kind === 'ingredient') {
      if (!line.ingredientId) {
        issues.push({ field: `line-${line.id}`, message: `${label} : sélectionnez un ingrédient.` });
      } else {
        const ing = ingredients.find((i) => i.id === line.ingredientId);
        if (!ing) issues.push({ field: `line-${line.id}`, message: `${label} : ingrédient introuvable.` });
        else if (!line.unit) issues.push({ field: `line-${line.id}`, message: `${label} : sélectionnez une unité.` });
        else if (!areUnitsCompatible(line.unit, ing.unit)) {
          issues.push({ field: `line-${line.id}`, message: `${label} : unité "${line.unit}" incompatible avec "${ing.unit}".` });
        }
      }
    } else {
      if (!line.subRecipeId) {
        issues.push({ field: `line-${line.id}`, message: `${label} : sélectionnez une sous-recette.` });
      } else {
        const sr = subRecipes.find((s) => s.id === line.subRecipeId);
        if (!sr) issues.push({ field: `line-${line.id}`, message: `${label} : sous-recette introuvable.` });
        else if (!line.unit) issues.push({ field: `line-${line.id}`, message: `${label} : sélectionnez une unité.` });
        else if (!areUnitsCompatible(line.unit, sr.yieldUnit)) {
          issues.push({ field: `line-${line.id}`, message: `${label} : unité "${line.unit}" incompatible avec "${sr.yieldUnit}".` });
        }
      }
    }
  });

  if (detectCircularReference(draft.id, draft.ingredients, subRecipes)) {
    issues.push({
      field: 'ingredients',
      message: 'Référence circulaire détectée : une sous-recette imbriquée référence celle-ci, directement ou indirectement.',
    });
  }

  return issues;
};

export const buildSubRecipeFromDraft = (draft: DraftSubRecipe): SubRecipe => ({
  id: draft.id,
  name: draft.name.trim(),
  description: draft.description.trim() || undefined,
  yieldQuantity: Number(draft.yieldQuantity),
  yieldUnit: draft.yieldUnit,
  ingredients: draft.ingredients,
  createdAt: new Date().toISOString().slice(0, 10),
});
