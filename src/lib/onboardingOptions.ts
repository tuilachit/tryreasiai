export const HOUSEHOLD_OPTIONS = [1, 2, 3, 4, 5] as const;
/** Displayed as 5+; stored as 6 for servings. */
export const HOUSEHOLD_FIVE_PLUS = 6;

export const BUDGET_OPTIONS = [
  { label: "Under $80", aud: 50 },
  { label: "$80 – $130", aud: 105 },
  { label: "$130 – $180", aud: 155 },
  { label: "$180 – $250", aud: 215 },
  { label: "$250+", aud: 300 },
] as const;

export const CUISINE_OPTIONS = [
  { label: "Chinese", slug: "chinese" },
  { label: "Thai", slug: "thai" },
  { label: "Vietnamese", slug: "vietnamese" },
  { label: "Japanese", slug: "japanese" },
  { label: "Korean", slug: "korean" },
  { label: "Indian", slug: "indian" },
  { label: "Italian", slug: "italian" },
  { label: "Mediterranean", slug: "mediterranean" },
  { label: "Mexican", slug: "mexican" },
  { label: "Australian", slug: "australian" },
] as const;

export const DIETARY_OPTIONS = [
  { label: "High protein", slug: "high_protein" },
  { label: "Vegetarian", slug: "vegetarian" },
  { label: "Vegan", slug: "vegan" },
  { label: "Pescatarian", slug: "pescatarian" },
  { label: "Gluten free", slug: "gluten_free" },
  { label: "Dairy free", slug: "dairy_free" },
  { label: "Low carb", slug: "low_carb" },
  { label: "Keto", slug: "keto" },
  { label: "Halal", slug: "halal" },
  { label: "Kosher", slug: "kosher" },
  { label: "No restrictions", slug: "no_restrictions" },
] as const;

export const COOKING_TIME_OPTIONS = [
  { label: "Under 20 min", value: "under 20min" },
  { label: "20 – 40 min", value: "20-40min" },
  { label: "40 – 60 min", value: "40-60min" },
  { label: "60+ min", value: "60+min" },
] as const;
