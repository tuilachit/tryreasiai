import { z } from "zod";

export const mealSlotSchema = z.object({
  day: z.string(),
  dishName: z.string(),
  briefDescription: z.string(),
  cuisine: z.string(),
  // Models often emit JSON numbers as strings; coerce keeps validation reliable.
  estimatedCostAud: z.coerce.number(),
  estimatedCookTimeMin: z.coerce.number(),
  estimatedProteinG: z.coerce.number(),
  estimatedCalories: z.coerce.number(),
  estimatedCarbsG: z.coerce.number(),
});

/** Same shape as a plan row; used for single-meal LLM outputs. */
export const singleMealSchema = mealSlotSchema;

export const mealPlanSchema = z.object({
  meals: z.array(mealSlotSchema),
  // OpenAI strict structured output requires every property in `required`;
  // .default() / .optional() omit keys from `required` and break the schema.
  planningNotes: z.string(),
});

export type MealSlot = z.infer<typeof mealSlotSchema>;
export type MealPlan = z.infer<typeof mealPlanSchema>;

export const ingredientCategorySchema = z.enum([
  "produce",
  "meat_seafood",
  "dairy_eggs",
  "pantry",
  "frozen",
  "bakery",
  "other",
]);

export const ingredientUnitSchema = z.union([
  z.literal("g"),
  z.literal("ml"),
  z.literal("kg"),
  z.literal("l"),
  z.literal("tsp"),
  z.literal("tbsp"),
  z.literal("piece"),
  z.literal(""),
]);

export const ingredientSchema = z.object({
  name: z.string(),
  quantity: z.coerce.number(),
  unit: ingredientUnitSchema,
  category: ingredientCategorySchema,
});

export const recipeSchema = z.object({
  dishName: z.string(),
  servings: z.coerce.number(),
  ingredients: z.array(ingredientSchema),
  instructionsBrief: z.string(),
});

export type Ingredient = z.infer<typeof ingredientSchema>;
export type Recipe = z.infer<typeof recipeSchema>;

export const recipeStepsSchema = z.object({
  steps: z.array(z.string()).min(3).max(12),
});

export type RecipeSteps = z.infer<typeof recipeStepsSchema>;
