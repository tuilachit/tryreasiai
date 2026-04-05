"use server";

import "server-only";

import { generateObject } from "ai";

import { openai } from "@/lib/ai/client";
import { consolidateIngredients } from "@/lib/pipeline/consolidate";
import { formatShoppingList, type ShoppingList } from "@/lib/pipeline/formatShoppingList";
import {
  mealPlanSchema,
  recipeSchema,
  type MealPlan,
  type MealSlot,
  type Recipe,
} from "@/lib/ai/schemas";
import type { UserProfile } from "@/lib/types";

const SYSTEM_PROMPT = `You are an expert meal planner. Build a meal plan that:

1. Matches dietary preferences, budget, cuisines, and cooking time from the profile.
2. Has VARIETY — don't repeat proteins or very similar dishes across the week.
3. REUSES ingredients across meals to reduce waste and hit the budget.
4. Stays within the stated weekly budget (be realistic with AUD prices at Woolworths/Coles in Sydney, Australia).
5. Defaults to 5 dinners unless the user specifies otherwise.

Output meal slots only (day, dish name, brief description, cuisine, cost estimate in AUD, cook time in minutes).
Do NOT output full recipes — that's a later step.`;

const RECIPE_SYSTEM_PROMPT = `You are a recipe generator. Output a clean ingredients list with PRECISE quantities scaled to the given servings.

Rules:
- Use METRIC units: g, ml, kg, l. For small amounts use tsp/tbsp.
- For countable items use "piece" (e.g. 3 piece garlic clove).
- Use GENERIC ingredient names (e.g. "chicken thigh" not "Lilydale free range chicken thigh").
- Categorize each ingredient by store section accurately.
- instructionsBrief: one short paragraph, not a full step-by-step recipe.

Category guidance:
- dairy_eggs is ONLY for actual dairy (milk, cheese, yoghurt, butter, cream) and eggs. Coconut milk, oat milk, almond milk, and other plant milks go in pantry.
- pantry includes: rice, noodles, oils, sauces (soy, fish, oyster, teriyaki), vinegars, spices, dried herbs, canned goods, coconut milk, stock, sugar, honey, flour.
- produce includes: all fresh fruits, fresh vegetables, fresh herbs (basil, coriander, mint), fresh chilies, fresh ginger, fresh garlic, lemongrass.
- meat_seafood includes: all fresh and frozen meat, poultry, fish, seafood, and also tofu and tempeh (grouped here because they're the protein section in most Australian supermarkets).

Portion guidance for staples (per person, per meal):
- Rice (dry): 75-100 g per person
- Noodles (dry): 75-100 g per person
- Meat/fish/tofu: 150-180 g per person

Do NOT include water in the ingredients list — assume the user has tap water.`;

export async function generateMealPlan(
  profile: UserProfile,
  weeklyInput: string,
): Promise<MealPlan> {
  const { object } = await generateObject({
    model: openai("gpt-4o"),
    schema: mealPlanSchema,
    system: SYSTEM_PROMPT,
    prompt: `Profile (JSON):
${JSON.stringify(profile, null, 2)}

Weekly request:
${weeklyInput}

Include your planning reasoning in planningNotes.`,
  });

  return object;
}

export async function expandRecipe(
  meal: MealSlot,
  servings: number,
): Promise<Recipe> {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: recipeSchema,
    system: RECIPE_SYSTEM_PROMPT,
    prompt: `Dish name: ${meal.dishName}
Brief description: ${meal.briefDescription}
Cuisine: ${meal.cuisine}
Servings needed: ${servings}`,
  });

  return object;
}

export async function planWeek(
  profile: UserProfile,
  weeklyInput: string,
): Promise<ShoppingList> {
  const plan = await generateMealPlan(profile, weeklyInput);
  const servings = profile.householdSize;

  const recipes = await Promise.all(
    plan.meals.map((meal) => expandRecipe(meal, servings)),
  );

  const consolidated = consolidateIngredients(recipes);
  return formatShoppingList(consolidated, plan);
}
