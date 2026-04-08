/** Display helpers for per-meal and weekly macro estimates (optional at runtime for older in-memory plans). */

export type MealMacroFields = {
  estimatedProteinG?: number | null;
  estimatedCalories?: number | null;
  estimatedCarbsG?: number | null;
};

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

/** Single-meal line, or null if any macro is missing. */
export function formatMealMacrosEstimateLine(meal: MealMacroFields): string | null {
  const { estimatedProteinG: p, estimatedCalories: c, estimatedCarbsG: car } =
    meal;
  if (!isFiniteNumber(p) || !isFiniteNumber(c) || !isFiniteNumber(car)) {
    return null;
  }
  return `~${Math.round(p)}g protein · ~${Math.round(c)} kcal · ~${Math.round(car)}g carbs`;
}

export type WeeklyMacrosResult =
  | { ok: true; line: string }
  | { ok: false; message: string };

/**
 * Weekly rollup, or unavailable if any meal is missing macro data.
 * Calories summed then rounded to nearest 100; protein/carbs rounded to whole grams.
 */
export function weeklyMacrosRollup(
  meals: MealMacroFields[],
): WeeklyMacrosResult {
  if (meals.length === 0) {
    return {
      ok: false,
      message:
        "Macros unavailable for this plan — generate a new plan to see them",
    };
  }
  let sumP = 0;
  let sumC = 0;
  let sumCar = 0;
  for (const m of meals) {
    const { estimatedProteinG: p, estimatedCalories: c, estimatedCarbsG: car } =
      m;
    if (!isFiniteNumber(p) || !isFiniteNumber(c) || !isFiniteNumber(car)) {
      return {
        ok: false,
        message:
          "Macros unavailable for this plan — generate a new plan to see them",
      };
    }
    sumP += p;
    sumC += c;
    sumCar += car;
  }
  const calsRounded = Math.round(sumC / 100) * 100;
  const line = `~${Math.round(sumP)}g protein · ~${calsRounded.toLocaleString("en-US")} kcal · ~${Math.round(sumCar)}g carbs across ${meals.length} ${meals.length === 1 ? "meal" : "meals"}`;
  return { ok: true, line };
}
