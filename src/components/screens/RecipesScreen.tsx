"use client";

import { useCallback, useMemo, useState } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";

import { RecipeSheet } from "@/components/RecipeSheet";
import type { MealSlot } from "@/lib/ai/schemas";
import { formatMealMacrosEstimateLine } from "@/lib/mealMacros";
import type { ShoppingList } from "@/lib/pipeline/formatShoppingList";
import { cn } from "@/lib/utils";

type DayGroup = {
  day: string;
  /** Indices into `shoppingList.meals` / `shoppingList.recipes`. */
  mealIndices: number[];
};

function groupMealsByConsecutiveDay(
  meals: ShoppingList["meals"],
): DayGroup[] {
  const groups: DayGroup[] = [];
  for (let i = 0; i < meals.length; i++) {
    const day = meals[i]!.day;
    const prev = groups[groups.length - 1];
    if (prev && prev.day === day) {
      prev.mealIndices.push(i);
    } else {
      groups.push({ day, mealIndices: [i] });
    }
  }
  return groups;
}

function dayHeaderLabel(day: string): string {
  return day.trim().toUpperCase();
}

function mealSlotAt(list: ShoppingList, i: number): MealSlot {
  const m = list.meals[i]!;
  return {
    day: m.day,
    dishName: m.dish,
    briefDescription: m.description,
    cuisine: m.cuisine,
    estimatedCostAud: m.costAud,
    estimatedCookTimeMin: m.cookTimeMin,
    estimatedProteinG: m.estimatedProteinG ?? Number.NaN,
    estimatedCalories: m.estimatedCalories ?? Number.NaN,
    estimatedCarbsG: m.estimatedCarbsG ?? Number.NaN,
  };
}

export type RecipesScreenProps = {
  shoppingList: ShoppingList;
  onBack: () => void;
  stepsCache: Map<number, string[]>;
  onStepsLoaded: (mealIndex: number, steps: string[]) => void;
};

export function RecipesScreen({
  shoppingList,
  onBack,
  stepsCache,
  onStepsLoaded,
}: RecipesScreenProps) {
  const [selectedMealIndex, setSelectedMealIndex] = useState<number | null>(
    null,
  );

  const groups = useMemo(
    () => groupMealsByConsecutiveDay(shoppingList.meals),
    [shoppingList.meals],
  );

  const totalCookTime = useMemo(
    () =>
      shoppingList.meals.reduce((sum, m) => sum + m.cookTimeMin, 0),
    [shoppingList.meals],
  );

  const mealCount = shoppingList.meals.length;

  const closeSheet = useCallback(() => setSelectedMealIndex(null), []);

  if (mealCount === 0) {
    return (
      <div className="mx-auto flex min-h-svh w-full max-w-[480px] flex-col bg-white px-5 pb-32 text-black">
        <header className="flex shrink-0 items-center px-2 pt-3 pb-2">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="flex size-10 items-center justify-center rounded-lg active:bg-neutral-100"
          >
            <ArrowLeft className="size-6" strokeWidth={1.75} />
          </button>
          <h1 className="flex-1 text-center text-base font-medium tracking-tight">
            Recipes
          </h1>
          <div className="w-10 shrink-0" aria-hidden />
        </header>
        <p className="flex flex-1 items-center justify-center text-center text-sm text-neutral-500">
          No meals to display
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-[480px] flex-col bg-white pb-32 text-black">
      <header className="flex shrink-0 items-center px-2 pt-3 pb-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex size-10 items-center justify-center rounded-lg active:bg-neutral-100"
        >
          <ArrowLeft className="size-6" strokeWidth={1.75} />
        </button>
        <h1 className="flex-1 text-center text-base font-medium tracking-tight">
          Recipes
        </h1>
        <div className="w-10 shrink-0" aria-hidden />
      </header>

      <p className="px-5 text-xs text-neutral-500">
        {mealCount} {mealCount === 1 ? "meal" : "meals"} · {totalCookTime} min
        total cook time
      </p>

      <div className="mt-4 px-5">
        {groups.map((group, gi) => (
          <section key={`${group.day}-${group.mealIndices[0]}`}>
            <h2
              className={cn(
                "mb-3 text-xs font-medium uppercase tracking-wide text-neutral-500",
                gi === 0 ? "mt-0" : "mt-6",
              )}
            >
              {dayHeaderLabel(group.day)}
            </h2>
            <div className="space-y-3">
              {group.mealIndices.map((mealIndex) => {
                const meal = shoppingList.meals[mealIndex]!;
                const macroLine = formatMealMacrosEstimateLine(meal);
                return (
                  <button
                    key={mealIndex}
                    type="button"
                    onClick={() => setSelectedMealIndex(mealIndex)}
                    className="flex w-full gap-3 rounded-xl border border-neutral-200 p-4 text-left transition-colors active:bg-neutral-50"
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-medium leading-tight tracking-tight sm:text-xl">
                        {meal.dish}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-neutral-500">
                        {meal.description}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600">
                          ${meal.costAud}
                        </span>
                        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600">
                          {meal.cookTimeMin} min
                        </span>
                        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600">
                          {meal.cuisine}
                        </span>
                      </div>
                      {macroLine ? (
                        <p className="mt-2 text-xs text-neutral-500">{macroLine}</p>
                      ) : null}
                    </div>
                    <ChevronRight
                      className="mt-1 size-5 shrink-0 text-neutral-400"
                      strokeWidth={2}
                      aria-hidden
                    />
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <RecipeSheet
        open={selectedMealIndex !== null}
        onClose={closeSheet}
        meal={
          selectedMealIndex !== null
            ? mealSlotAt(shoppingList, selectedMealIndex)
            : mealSlotAt(shoppingList, 0)
        }
        mealIndex={selectedMealIndex ?? 0}
        recipe={
          selectedMealIndex !== null
            ? shoppingList.recipes[selectedMealIndex]
            : undefined
        }
        cachedSteps={
          selectedMealIndex !== null
            ? stepsCache.get(selectedMealIndex)
            : undefined
        }
        onStepsLoaded={onStepsLoaded}
      />
    </div>
  );
}
