import { z } from "zod";

export const mealSlotSchema = z.object({
  day: z.string(),
  dishName: z.string(),
  briefDescription: z.string(),
  cuisine: z.string(),
  estimatedCostAud: z.number(),
  estimatedCookTimeMin: z.number(),
  estimatedProteinG: z.number(),
  estimatedCalories: z.number(),
  estimatedCarbsG: z.number(),
});

/** Same shape as a plan row; used for single-meal LLM outputs. */
export const singleMealSchema = mealSlotSchema;

export const mealPlanSchema = z.object({
  meals: z.array(mealSlotSchema),
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
  quantity: z.number(),
  unit: ingredientUnitSchema,
  category: ingredientCategorySchema,
});

export const recipeSchema = z.object({
  dishName: z.string(),
  servings: z.number(),
  ingredients: z.array(ingredientSchema),
  instructionsBrief: z.string(),
});

export type Ingredient = z.infer<typeof ingredientSchema>;
export type Recipe = z.infer<typeof recipeSchema>;

export const recipeStepsSchema = z.object({
  steps: z.array(z.string()).min(3).max(12),
});

export type RecipeSteps = z.infer<typeof recipeStepsSchema>;
