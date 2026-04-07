import type { MealPlan, Recipe } from "@/lib/ai/schemas";

import type { ConsolidatedIngredient } from "./consolidate";

export type ShoppingList = {
  meals: {
    day: string;
    dish: string;
    description: string;
    cuisine: string;
    cookTimeMin: number;
    costAud: number;
  }[];
  /** Same order as `meals` — `meals[i]` ↔ `recipes[i]`. */
  recipes: Recipe[];
  sections: { label: string; items: { name: string; quantity: string }[] }[];
  totalEstimatedCostAud: number;
  planningNotes: string;
};

const SECTION_DEFS: {
  category: ConsolidatedIngredient["category"];
  label: string;
}[] = [
  { category: "produce", label: "Produce" },
  { category: "meat_seafood", label: "Meat & Seafood" },
  { category: "dairy_eggs", label: "Dairy & Eggs" },
  { category: "bakery", label: "Bakery" },
  { category: "pantry", label: "Pantry" },
  { category: "frozen", label: "Frozen" },
  { category: "other", label: "Other" },
];

function formatItemQuantity(quantity: number, unit: string): string {
  const q =
    Number.isInteger(quantity) ? String(quantity) : String(quantity);
  return unit === "" ? q : `${q} ${unit}`;
}

export function formatShoppingList(
  consolidated: ConsolidatedIngredient[],
  plan: MealPlan,
  recipes: Recipe[],
): ShoppingList {
  const byCategory = new Map<
    ConsolidatedIngredient["category"],
    ConsolidatedIngredient[]
  >();

  for (const cat of SECTION_DEFS.map((s) => s.category)) {
    byCategory.set(cat, []);
  }

  for (const item of consolidated) {
    byCategory.get(item.category)?.push(item);
  }

  const sections: ShoppingList["sections"] = [];

  for (const { category, label } of SECTION_DEFS) {
    const items = byCategory.get(category) ?? [];
    if (items.length === 0) continue;
    sections.push({
      label,
      items: items.map((i) => ({
        name: i.name,
        quantity: formatItemQuantity(i.quantity, i.unit),
      })),
    });
  }

  const totalRaw = plan.meals.reduce(
    (sum, m) => sum + m.estimatedCostAud,
    0,
  );
  const totalEstimatedCostAud =
    Math.round(totalRaw * 100) / 100;

  return {
    meals: plan.meals.map((m) => ({
      day: m.day,
      dish: m.dishName,
      description: m.briefDescription,
      cuisine: m.cuisine,
      cookTimeMin: m.estimatedCookTimeMin,
      costAud: m.estimatedCostAud,
    })),
    recipes,
    sections,
    totalEstimatedCostAud,
    planningNotes: plan.planningNotes,
  };
}
