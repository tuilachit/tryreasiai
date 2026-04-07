"use server";

import "server-only";

import { generateObject } from "ai";

import { openai } from "@/lib/ai/client";
import {
  consolidateIngredients,
  consolidatedIngredientExclusionKey,
  type ConsolidatedIngredient,
} from "@/lib/pipeline/consolidate";
import { formatShoppingList, type ShoppingList } from "@/lib/pipeline/formatShoppingList";
import {
  mealPlanSchema,
  recipeSchema,
  recipeStepsSchema,
  singleMealSchema,
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

const RECIPE_STEPS_SYSTEM_PROMPT = `You are a recipe instructor. Convert a brief recipe description and ingredients list into a clear set of numbered cooking steps.

Rules:
- Output between 3 and 12 steps. Most home recipes are 4-8 steps.
- Each step is one clear action a home cook can follow.
- Use METRIC measurements consistent with the ingredients list.
- Mention specific ingredients by name where it matters (e.g. "Add the soy sauce and rice wine").
- Include cook times where relevant (e.g. "Stir-fry for 3-4 minutes until golden").
- Do NOT number the steps yourself — return them as plain strings, the UI will add numbering.
- Do NOT include greetings, summaries, or commentary. Only the steps.`;

const SWAP_MEAL_SYSTEM_PROMPT = `You are a meal planner replacing a single meal in an existing weekly plan. Generate ONE new meal that:

1. Fits the user's profile (dietary style, cuisine preferences, cooking time, budget-proportional cost).
2. Is meaningfully DIFFERENT from the meal being replaced — different dish name, different core protein if possible, different feel.
3. Does NOT duplicate any of the other meals already in the plan.
4. Keeps the same day-of-week slot as the meal being replaced.
5. Uses realistic AUD pricing for Sydney supermarkets.

Output a single meal slot only. Be specific and on-cuisine — avoid generic names like "Asian chicken stir-fry".`;

const ADD_MEAL_SYSTEM_PROMPT = `You are a meal planner adding one meal to an existing weekly plan. Generate ONE new meal that:

1. Fits the user's profile (dietary style, cuisine preferences, cooking time, budget-proportional cost).
2. Does NOT duplicate any existing meals in the plan (by dish name or near-identical concept).
3. Uses the exact day string given in the user message for the "day" field.
4. Uses realistic AUD pricing for Sydney supermarkets.

Output a single meal slot only. Be specific and on-cuisine — avoid generic names like "Asian chicken stir-fry".`;

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

export async function swapMeal(
  profile: UserProfile,
  weeklyInput: string,
  mealToSwap: MealSlot,
  otherMeals: MealSlot[],
): Promise<MealSlot> {
  const { object } = await generateObject({
    model: openai("gpt-4o"),
    schema: singleMealSchema,
    system: SWAP_MEAL_SYSTEM_PROMPT,
    prompt: `Profile (JSON):
${JSON.stringify(profile, null, 2)}

Weekly request:
${weeklyInput}

Meal to replace (keep the same calendar day in your output):
${JSON.stringify(mealToSwap, null, 2)}

Other meals already in the plan — do not duplicate or closely echo these:
${JSON.stringify(otherMeals, null, 2)}`,
  });

  return { ...object, day: mealToSwap.day };
}

export async function addMeal(
  profile: UserProfile,
  weeklyInput: string,
  existingMeals: MealSlot[],
  targetDay: string,
): Promise<MealSlot> {
  const { object } = await generateObject({
    model: openai("gpt-4o"),
    schema: singleMealSchema,
    system: ADD_MEAL_SYSTEM_PROMPT,
    prompt: `Profile (JSON):
${JSON.stringify(profile, null, 2)}

Weekly request:
${weeklyInput}

Target day for this meal (use this exact string for the "day" field):
${targetDay}

Existing meals in the plan — do not duplicate or closely echo these:
${JSON.stringify(existingMeals, null, 2)}`,
  });

  return { ...object, day: targetDay };
}

export async function expandMealsToIngredients(
  profile: UserProfile,
  meals: MealSlot[],
): Promise<{
  recipes: Recipe[];
  consolidatedIngredients: ConsolidatedIngredient[];
}> {
  const servings = profile.householdSize;
  const recipes = await Promise.all(
    meals.map((meal) => expandRecipe(meal, servings)),
  );
  const consolidatedIngredients = consolidateIngredients(recipes);
  return { recipes, consolidatedIngredients };
}

export async function formatFinalShoppingList(
  _profile: UserProfile,
  meals: MealSlot[],
  recipes: Recipe[],
  consolidatedIngredients: ConsolidatedIngredient[],
  excludedIngredientKeys: string[],
): Promise<ShoppingList> {
  const excluded = new Set(excludedIngredientKeys);
  const filtered = consolidatedIngredients.filter(
    (ing) => !excluded.has(consolidatedIngredientExclusionKey(ing)),
  );
  const plan: MealPlan = {
    meals,
    planningNotes: "User-confirmed plan.",
  };
  return formatShoppingList(filtered, plan, recipes);
}

export async function buildShoppingList(
  profile: UserProfile,
  meals: MealSlot[],
): Promise<ShoppingList> {
  const { recipes, consolidatedIngredients } =
    await expandMealsToIngredients(profile, meals);
  return formatFinalShoppingList(
    profile,
    meals,
    recipes,
    consolidatedIngredients,
    [],
  );
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

export async function expandRecipeSteps(
  meal: MealSlot,
  recipe: Recipe,
): Promise<string[]> {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: recipeStepsSchema,
    system: RECIPE_STEPS_SYSTEM_PROMPT,
    prompt: `Dish name: ${meal.dishName}
Brief description: ${meal.briefDescription}
Cuisine: ${meal.cuisine}

Existing brief instructions (paragraph):
${recipe.instructionsBrief}

Ingredients (JSON):
${JSON.stringify(recipe.ingredients, null, 2)}`,
  });

  return object.steps;
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
  return formatShoppingList(consolidated, plan, recipes);
}
