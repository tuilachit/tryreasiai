"use client";

import { ArrowLeft, Check, Share2 } from "lucide-react";
import { Fragment, useCallback, useMemo, useState } from "react";

import { RecipeSheet } from "@/components/RecipeSheet";
import type { ShoppingList } from "@/lib/pipeline/formatShoppingList";
import type { MealSlot } from "@/lib/ai/schemas";
import {
  abbrevDay,
  formatShoppingListPlainText,
  truncateDish,
} from "@/lib/shoppingListText";
import { cn } from "@/lib/utils";

function itemKey(sectionLabel: string, name: string, quantity: string): string {
  return `${sectionLabel}\0${name}\0${quantity}`;
}

type PlanResultScreenProps = {
  list: ShoppingList;
  checked: Set<string>;
  onToggleItem: (key: string) => void;
  onBack: () => void;
};

export function PlanResultScreen({
  list,
  checked,
  onToggleItem,
  onBack,
}: PlanResultScreenProps) {
  const [copied, setCopied] = useState(false);
  const [sheetMealIndex, setSheetMealIndex] = useState<number | null>(null);
  const [stepsCache, setStepsCache] = useState<Map<number, string[]>>(
    () => new Map(),
  );

  const onStepsLoaded = useCallback((mealIndex: number, steps: string[]) => {
    setStepsCache((prev) => {
      const next = new Map(prev);
      next.set(mealIndex, steps);
      return next;
    });
  }, []);

  const mealSlotAt = useCallback(
    (i: number): MealSlot => {
      const m = list.meals[i]!;
      return {
        day: m.day,
        dishName: m.dish,
        briefDescription: m.description,
        cuisine: m.cuisine,
        estimatedCostAud: m.costAud,
        estimatedCookTimeMin: m.cookTimeMin,
      };
    },
    [list.meals],
  );

  const totalItems = useMemo(
    () => list.sections.reduce((n, s) => n + s.items.length, 0),
    [list.sections],
  );

  const checkedCount = checked.size;

  const runShare = useCallback(async () => {
    const text = formatShoppingListPlainText(list);
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Reasi shopping list", text });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [list]);

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-[420px] flex-col bg-white pb-24 text-black">
      <header className="flex shrink-0 items-center justify-between px-2 pt-3 pb-2">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex size-10 items-center justify-center rounded-lg active:bg-neutral-100"
        >
          <ArrowLeft className="size-6" strokeWidth={1.75} />
        </button>
        <h1 className="text-base font-medium tracking-tight">This week</h1>
        <button
          type="button"
          onClick={() => void runShare()}
          aria-label="Share list"
          className="flex size-10 items-center justify-center rounded-lg active:bg-neutral-100"
        >
          <Share2 className="size-5" strokeWidth={1.75} />
        </button>
      </header>

      <div className="px-4 pt-1">
        <p className="flex flex-wrap items-baseline gap-x-1 gap-y-1 text-xs leading-relaxed">
          {list.meals.map((m, i) => (
            <Fragment key={i}>
              {i > 0 ? (
                <span className="text-neutral-400" aria-hidden>
                  ·
                </span>
              ) : null}
              <span className="text-neutral-500">{abbrevDay(m.day)} </span>
              <button
                type="button"
                onClick={() => setSheetMealIndex(i)}
                className="text-neutral-600 underline decoration-neutral-300 decoration-1 underline-offset-2 transition-colors hover:text-black"
              >
                {truncateDish(m.dish)}
              </button>
            </Fragment>
          ))}
        </p>
        <div className="mt-4 flex items-baseline justify-between gap-2 border-b border-neutral-200 pb-3">
          <span className="text-sm text-neutral-500">Estimated total</span>
          <span className="text-lg font-medium tabular-nums">
            ${list.totalEstimatedCostAud.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-1 flex-col gap-8 px-4">
        {list.sections.map((sec) => (
          <section key={sec.label}>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500">
              {sec.label}
            </h2>
            <ul className="space-y-0 divide-y divide-neutral-100">
              {sec.items.map((it) => {
                const key = itemKey(sec.label, it.name, it.quantity);
                const isChecked = checked.has(key);
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => onToggleItem(key)}
                      aria-pressed={isChecked}
                      className={cn(
                        "flex w-full items-center gap-3 py-3 text-left transition-opacity duration-200",
                        isChecked && "opacity-50",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-black transition-colors duration-200",
                          isChecked && "border-black bg-black text-white",
                        )}
                        aria-hidden
                      >
                        {isChecked ? (
                          <Check className="size-3.5" strokeWidth={2.5} />
                        ) : null}
                      </span>
                      <span
                        className={cn(
                          "min-w-0 flex-1 text-base leading-snug transition-all duration-200",
                          isChecked && "line-through",
                        )}
                      >
                        {it.name}
                      </span>
                      <span className="w-[88px] shrink-0 text-right text-sm tabular-nums text-neutral-500">
                        {it.quantity}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <div className="fixed bottom-0 left-1/2 z-10 flex w-full max-w-[420px] -translate-x-1/2 items-center justify-between border-t border-neutral-200 bg-white px-4 py-3 text-sm">
        <span className="text-neutral-600">
          {checkedCount} of {totalItems} checked
        </span>
        <button
          type="button"
          onClick={() => void runShare()}
          className="font-medium text-black underline-offset-2 hover:underline"
        >
          Share list
        </button>
      </div>

      {copied ? (
        <div className="fixed bottom-20 left-1/2 z-30 -translate-x-1/2 rounded-lg bg-black px-4 py-2 text-sm text-white shadow-md">
          Copied
        </div>
      ) : null}

      <RecipeSheet
        open={sheetMealIndex !== null}
        onClose={() => setSheetMealIndex(null)}
        meal={
          sheetMealIndex !== null
            ? mealSlotAt(sheetMealIndex)
            : mealSlotAt(0)
        }
        mealIndex={sheetMealIndex ?? 0}
        recipe={
          sheetMealIndex !== null
            ? list.recipes[sheetMealIndex]
            : undefined
        }
        cachedSteps={
          sheetMealIndex !== null
            ? stepsCache.get(sheetMealIndex)
            : undefined
        }
        onStepsLoaded={onStepsLoaded}
      />
    </div>
  );
}
