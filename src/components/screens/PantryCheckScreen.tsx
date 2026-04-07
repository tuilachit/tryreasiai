"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ConsolidatedIngredient } from "@/lib/pipeline/consolidate";
import { consolidatedIngredientExclusionKey } from "@/lib/pipeline/consolidate";
import { cn } from "@/lib/utils";

export type PantryCheckScreenProps = {
  consolidatedIngredients: ConsolidatedIngredient[];
  onContinue: (excludedKeys: string[]) => void;
  onSkip: () => void;
  onBack: () => void;
};

function formatQty(quantity: number, unit: string): string {
  const q = Number.isInteger(quantity) ? String(quantity) : String(quantity);
  return unit === "" ? q : `${q} ${unit}`;
}

export function PantryCheckScreen({
  consolidatedIngredients,
  onContinue,
  onSkip,
  onBack,
}: PantryCheckScreenProps) {
  const staples = useMemo(() => {
    const rows = consolidatedIngredients.filter(
      (ing) => ing.category === "pantry" || ing.category === "dairy_eggs",
    );
    return [...rows].sort((a, b) => a.name.localeCompare(b.name));
  }, [consolidatedIngredients]);

  const [excludedKeys, setExcludedKeys] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    if (staples.length > 0) return;
    const t = window.setTimeout(() => {
      onSkip();
    }, 800);
    return () => window.clearTimeout(t);
  }, [staples.length, onSkip]);

  const toggleKey = (key: string) => {
    setExcludedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const removedCount = excludedKeys.size;

  if (staples.length === 0) {
    return (
      <div className="mx-auto flex min-h-svh w-full max-w-[480px] flex-col items-center justify-center bg-white px-6 pb-32 text-center text-black">
        <p className="text-base leading-relaxed text-neutral-600">
          No common pantry items in this week&apos;s plan. Building your list...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-[480px] flex-col bg-white pb-40 text-black">
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
          Already have these?
        </h1>
        <div className="flex w-10 shrink-0 justify-end">
          <button
            type="button"
            onClick={onSkip}
            className="px-1 text-sm font-medium text-neutral-600 underline-offset-2 hover:underline"
          >
            Skip
          </button>
        </div>
      </header>

      <div className="px-5 pt-2">
        <h2 className="text-3xl font-medium leading-tight tracking-tight">
          Got any of these at home?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-neutral-500">
          Tap to remove from your list. We&apos;ll skip the rest.
        </p>
      </div>

      <ul className="mt-4 flex flex-1 flex-col divide-y divide-neutral-100 px-4">
        {staples.map((ing) => {
          const key = consolidatedIngredientExclusionKey(ing);
          const isChecked = excludedKeys.has(key);
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => toggleKey(key)}
                aria-pressed={isChecked}
                className={cn(
                  "flex w-full items-center gap-3 py-3 text-left transition-opacity duration-200",
                  isChecked && "opacity-60",
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
                  {ing.name}
                </span>
                <span className="w-[88px] shrink-0 text-right text-sm tabular-nums text-neutral-500">
                  {formatQty(ing.quantity, ing.unit)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="fixed bottom-0 left-1/2 z-10 w-full max-w-[480px] -translate-x-1/2 border-t border-neutral-200 bg-white px-4 py-4">
        <Button
          type="button"
          className="flex min-h-12 w-full flex-col gap-0.5 rounded-lg bg-black py-2.5 text-base font-medium text-white hover:bg-neutral-800"
          onClick={() => onContinue([...excludedKeys])}
        >
          <span>Continue</span>
          <span className="text-xs font-normal text-white/80">
            {removedCount > 0
              ? `${removedCount} item${removedCount === 1 ? "" : "s"} removed`
              : "Nothing removed yet — tap above if you have any."}
          </span>
        </Button>
      </div>
    </div>
  );
}
