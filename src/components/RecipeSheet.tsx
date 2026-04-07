"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { X } from "lucide-react";

import { expandRecipeSteps } from "@/lib/ai/actions";
import type { Ingredient, MealSlot, Recipe } from "@/lib/ai/schemas";
import { cn } from "@/lib/utils";

function formatIngredientQuantity(quantity: number, unit: string): string {
  const q = Number.isInteger(quantity) ? String(quantity) : String(quantity);
  return unit === "" ? q : `${q} ${unit}`;
}

function dayHeading(day: string): string {
  return day.trim().toUpperCase();
}

export type RecipeSheetProps = {
  open: boolean;
  onClose: () => void;
  meal: MealSlot;
  mealIndex: number;
  recipe?: Recipe;
  /** When set, steps are shown without fetching (parent cache). */
  cachedSteps?: string[];
  onStepsLoaded?: (mealIndex: number, steps: string[]) => void;
};

export function RecipeSheet({
  open,
  onClose,
  meal,
  mealIndex,
  recipe,
  cachedSteps,
  onStepsLoaded,
}: RecipeSheetProps) {
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [stepsError, setStepsError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [sheetEntered, setSheetEntered] = useState(false);

  const loadSteps = useCallback(async () => {
    if (!recipe || !onStepsLoaded) return;
    setLoadingSteps(true);
    setStepsError(null);
    try {
      const steps = await expandRecipeSteps(meal, recipe);
      onStepsLoaded(mealIndex, steps);
    } catch {
      setStepsError("Couldn't load instructions. Tap to retry.");
    } finally {
      setLoadingSteps(false);
    }
  }, [meal, mealIndex, onStepsLoaded, recipe]);

  useLayoutEffect(() => {
    if (!open || !recipe || !onStepsLoaded) return;
    if (cachedSteps !== undefined) return;
    void loadSteps();
  }, [
    open,
    recipe,
    onStepsLoaded,
    cachedSteps,
    mealIndex,
    retryKey,
    loadSteps,
  ]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setStepsError(null);
    }
  }, [open, mealIndex]);

  useEffect(() => {
    if (!open) {
      setSheetEntered(false);
      return;
    }
    setSheetEntered(false);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setSheetEntered(true));
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  const displaySteps = cachedSteps;
  const instructionsReady =
    displaySteps !== undefined && displaySteps.length > 0;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center">
      <button
        type="button"
        aria-label="Close recipe"
        className={cn(
          "absolute inset-0 bg-black transition-opacity duration-[250ms] ease-out",
          sheetEntered ? "opacity-40" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          "relative mt-auto flex h-auto max-h-[85vh] w-full max-w-[480px] flex-col rounded-t-2xl border border-neutral-200 bg-white shadow-lg transition-transform duration-[250ms] ease-out",
          sheetEntered
            ? "translate-y-0"
            : "pointer-events-none translate-y-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="recipe-sheet-title"
      >
        <div className="relative shrink-0 border-b border-neutral-100 px-4 pb-3 pt-3">
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-lg active:bg-neutral-100"
          >
            <X className="size-5" strokeWidth={1.75} />
          </button>
          <div className="flex justify-center pt-1">
            <div className="h-1 w-8 rounded-full bg-neutral-300" aria-hidden />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8 pt-2">
          <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
            {dayHeading(meal.day)}
          </p>
          <h2
            id="recipe-sheet-title"
            className="mt-1 text-2xl font-medium leading-tight tracking-tight"
          >
            {meal.dishName}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-500">
            {meal.briefDescription}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600">
              ${meal.estimatedCostAud}
            </span>
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600">
              {meal.estimatedCookTimeMin} min
            </span>
            <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600">
              {meal.cuisine}
            </span>
          </div>

          <hr className="my-6 border-neutral-200" />

          {recipe ? (
            <>
              <h3 className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                Ingredients
              </h3>
              <ul className="mt-3 space-y-2">
                {recipe.ingredients.map((ing: Ingredient, i: number) => (
                  <li
                    key={`${ing.name}-${i}`}
                    className="flex items-baseline justify-between gap-3 text-base leading-snug"
                  >
                    <span className="min-w-0 flex-1">{ing.name}</span>
                    <span className="w-[88px] shrink-0 text-right text-sm tabular-nums text-neutral-500">
                      {formatIngredientQuantity(ing.quantity, ing.unit)}
                    </span>
                  </li>
                ))}
              </ul>

              <hr className="my-6 border-neutral-200" />

              <h3 className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                Instructions
              </h3>

              {loadingSteps && !instructionsReady ? (
                <div className="mt-4 space-y-2">
                  <p className="text-sm text-neutral-500">
                    Loading instructions
                    <span className="inline-flex gap-0.5 pl-1" aria-hidden>
                      <span className="reasi-dot">.</span>
                      <span className="reasi-dot">.</span>
                      <span className="reasi-dot">.</span>
                    </span>
                  </p>
                  <div className="space-y-2 pt-1">
                    <div className="h-3 w-full animate-pulse rounded bg-neutral-200" />
                    <div className="h-3 w-[92%] animate-pulse rounded bg-neutral-200" />
                    <div className="h-3 w-4/5 animate-pulse rounded bg-neutral-200" />
                  </div>
                </div>
              ) : null}

              {stepsError ? (
                <button
                  type="button"
                  className="mt-4 w-full text-left text-sm text-black underline decoration-neutral-400 underline-offset-2"
                  onClick={() => {
                    setStepsError(null);
                    setRetryKey((k) => k + 1);
                  }}
                >
                  {stepsError}
                </button>
              ) : null}

              {instructionsReady ? (
                <ol className="mt-4 list-inside list-decimal space-y-3 text-base leading-relaxed text-black">
                  {displaySteps!.map((step, idx) => (
                    <li key={idx} className="pl-0.5">
                      {step}
                    </li>
                  ))}
                </ol>
              ) : null}

            </>
          ) : (
            <p className="text-sm leading-relaxed text-neutral-500">
              Full recipe and instructions will appear after you build your
              shopping list.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
