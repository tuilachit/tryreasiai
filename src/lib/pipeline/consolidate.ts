import type { Ingredient, Recipe } from "@/lib/ai/schemas";

export type ConsolidatedIngredient = {
  name: string;
  quantity: number;
  unit: string;
  category: Ingredient["category"];
};

const SUFFIX_STRIP = new Set([
  "florets",
  "fillet",
  "fillets",
  "clove",
  "cloves",
]);

/**
 * Normalizes ingredient name (lowercase, trim, light suffix stripping),
 * unit (canonical g/ml/piece/empty), and quantity for consolidation grouping.
 */
export function normalizeIngredientKey(
  name: string,
  unit: string,
  quantity: number,
): { name: string; unit: string; quantity: number } {
  let u = unit;
  let q = quantity;

  switch (u) {
    case "tbsp":
      u = "ml";
      q = quantity * 15;
      break;
    case "tsp":
      u = "ml";
      q = quantity * 5;
      break;
    case "kg":
      u = "g";
      q = quantity * 1000;
      break;
    case "l":
      u = "ml";
      q = quantity * 1000;
      break;
    default:
      break;
  }

  const words = name
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length >= 2) {
    const last = words[words.length - 1];
    if (last !== undefined && SUFFIX_STRIP.has(last)) {
      words.pop();
    }
  }

  const normalizedName = words.join(" ").trim();

  return { name: normalizedName, unit: u, quantity: q };
}

function groupKey(normalizedName: string, unit: string): string {
  return `${normalizedName}__${unit}`;
}

/** Stable id for a consolidated row — matches dedupe grouping in `consolidateIngredients`. */
export function consolidatedIngredientExclusionKey(
  ing: ConsolidatedIngredient,
): string {
  return `${ing.name}__${ing.unit}`;
}

export function consolidateIngredients(
  recipes: Recipe[],
): ConsolidatedIngredient[] {
  const map = new Map<
    string,
    { name: string; quantity: number; unit: string; category: Ingredient["category"] }
  >();

  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      const norm = normalizeIngredientKey(
        ing.name,
        ing.unit,
        ing.quantity,
      );
      const key = groupKey(norm.name, norm.unit);
      const existing = map.get(key);
      if (existing) {
        existing.quantity += norm.quantity;
      } else {
        map.set(key, {
          name: norm.name,
          quantity: norm.quantity,
          unit: norm.unit,
          category: ing.category,
        });
      }
    }
  }

  return Array.from(map.values());
}
