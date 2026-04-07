"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronRight, X } from "lucide-react";

import { RecipeSheet } from "@/components/RecipeSheet";
import { Button } from "@/components/ui/button";
import type { MealSlot } from "@/lib/ai/schemas";
import { dayShortLabel } from "@/lib/mealWeekday";
import { cn } from "@/lib/utils";

function mealTotalAud(meals: MealSlot[]): number {
  const raw = meals.reduce((s, m) => s + m.estimatedCostAud, 0);
  return Math.round(raw * 100) / 100;
}

function MealCardContent({
  meal,
  isSwapping,
}: {
  meal: MealSlot;
  isSwapping: boolean;
}) {
  const [opacity, setOpacity] = useState(1);
  const prevSig = useRef<string | null>(null);
  const sig = `${meal.dishName}|${meal.briefDescription}|${meal.estimatedCostAud}|${meal.cuisine}|${meal.estimatedCookTimeMin}`;

  useEffect(() => {
    if (prevSig.current === null) {
      prevSig.current = sig;
      return;
    }
    if (prevSig.current === sig) return;
    prevSig.current = sig;
    queueMicrotask(() => {
      setOpacity(0);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setOpacity(1));
      });
    });
  }, [sig]);

  return (
    <div
      className="transition-opacity duration-300"
      style={{ opacity: isSwapping ? 0.6 : opacity }}
    >
      <h3 className="text-xl font-medium leading-tight tracking-tight sm:text-2xl">
        {meal.dishName}
      </h3>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-neutral-500">
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
    </div>
  );
}

type MealReviewScreenProps = {
  meals: MealSlot[];
  swappingIndex: number | null;
  addingMeal: boolean;
  listBuildError: string | null;
  onBack: () => void;
  onSwap: (index: number) => void;
  onRemove: (index: number) => void;
  onAddMeal: () => void;
  onStartOver: () => void;
  onConfirmBuild: () => void;
};

export function MealReviewScreen({
  meals,
  swappingIndex,
  addingMeal,
  listBuildError,
  onBack,
  onSwap,
  onRemove,
  onAddMeal,
  onStartOver,
  onConfirmBuild,
}: MealReviewScreenProps) {
  const [selectedMealIndex, setSelectedMealIndex] = useState<number | null>(
    null,
  );
  const total = mealTotalAud(meals);
  const canRemove = meals.length > 1;
  const showAdd = meals.length < 25;

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-[420px] flex-col bg-white pb-36 text-black">
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
          Your week
        </h1>
        <div className="w-10 shrink-0" aria-hidden />
      </header>

      <div className="px-5 pt-2">
        <h2 className="text-3xl font-medium leading-tight tracking-tight">
          Your meals
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          Tap swap to change a meal, or × to remove it.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-4 px-5">
        {meals.map((meal, index) => {
          const isSwapping = swappingIndex === index;
          return (
            <div
              key={index}
              tabIndex={0}
              role="group"
              aria-label={`${meal.dishName}, tap card for details`}
              onClick={() => setSelectedMealIndex(index)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedMealIndex(index);
                }
              }}
              className="relative cursor-pointer rounded-xl border border-neutral-200 p-4 transition-colors active:bg-neutral-50 sm:p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                  {dayShortLabel(meal.day)}
                </span>
                <div className="flex shrink-0 items-center gap-0.5">
                  <ChevronRight
                    className="size-4 text-neutral-300"
                    strokeWidth={2}
                    aria-hidden
                  />
                  <button
                    type="button"
                    aria-label="Remove meal"
                    disabled={!canRemove}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(index);
                    }}
                    className={cn(
                      "-mr-1 -mt-1 flex size-8 items-center justify-center rounded-lg",
                      canRemove
                        ? "text-neutral-600 active:bg-neutral-100"
                        : "cursor-not-allowed opacity-30",
                    )}
                  >
                    <X className="size-5" strokeWidth={1.75} />
                  </button>
                </div>
              </div>
              <div className="mt-1 pr-6">
                <MealCardContent meal={meal} isSwapping={isSwapping} />
              </div>
              <div
                className="mt-4 flex justify-end border-t border-neutral-100 pt-3"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  disabled={isSwapping}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSwap(index);
                  }}
                  className="text-sm font-medium text-black underline decoration-neutral-400 decoration-1 underline-offset-4 disabled:opacity-50"
                >
                  {isSwapping ? (
                    <span
                      className="inline-flex items-center gap-0.5 px-1"
                      aria-hidden
                    >
                      <span className="reasi-dot text-xs leading-none">.</span>
                      <span className="reasi-dot text-xs leading-none">.</span>
                      <span className="reasi-dot text-xs leading-none">.</span>
                    </span>
                  ) : (
                    "Swap"
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col items-center gap-4 px-5">
        {showAdd ? (
          <button
            type="button"
            disabled={addingMeal}
            onClick={onAddMeal}
            className="text-sm font-medium text-black underline decoration-neutral-400 decoration-1 underline-offset-4 disabled:opacity-50"
          >
            {addingMeal ? (
              <span className="inline-flex items-center gap-0.5">
                <span className="reasi-dot text-xs leading-none">.</span>
                <span className="reasi-dot text-xs leading-none">.</span>
                <span className="reasi-dot text-xs leading-none">.</span>
              </span>
            ) : (
              "+ Add a meal"
            )}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onStartOver}
          className="text-center text-xs text-neutral-500 underline-offset-2 hover:underline"
        >
          Start over with different meals
        </button>
      </div>

      {listBuildError ? (
        <p className="mt-4 px-5 text-center text-sm text-neutral-600">
          {listBuildError}
        </p>
      ) : null}

      <div className="fixed bottom-0 left-1/2 z-10 w-full max-w-[420px] -translate-x-1/2 border-t border-neutral-200 bg-white px-4 py-4">
        <Button
          type="button"
          className="flex min-h-12 w-full flex-col gap-0.5 rounded-lg bg-black py-2.5 text-base font-medium text-white hover:bg-neutral-800"
          onClick={onConfirmBuild}
        >
          <span>Looks good — build my shopping list</span>
          <span className="text-xs font-normal text-white/80">
            Estimated ${total.toFixed(2)} · {meals.length}{" "}
            {meals.length === 1 ? "meal" : "meals"}
          </span>
        </Button>
      </div>

      <RecipeSheet
        open={selectedMealIndex !== null}
        onClose={() => setSelectedMealIndex(null)}
        meal={
          selectedMealIndex !== null
            ? meals[selectedMealIndex]!
            : meals[0]!
        }
        mealIndex={selectedMealIndex ?? 0}
        recipe={undefined}
      />
    </div>
  );
}
