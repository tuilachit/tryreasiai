"use client";

import { Button } from "@/components/ui/button";
import { BUDGET_OPTIONS } from "@/lib/onboardingOptions";
import { cn } from "@/lib/utils";

import { OnboardingLayout } from "./OnboardingLayout";

type OnboardingBudgetScreenProps = {
  valueAud: number | null;
  onSelect: (aud: number) => void;
  onBack: () => void;
  onContinue: () => void;
};

export function OnboardingBudgetScreen({
  valueAud,
  onSelect,
  onBack,
  onContinue,
}: OnboardingBudgetScreenProps) {
  return (
    <OnboardingLayout
      progressFilled={2}
      title="What's your weekly grocery budget?"
      subtitle="Roughly — you can change this anytime."
      onBack={onBack}
      footer={
        <Button
          type="button"
          disabled={valueAud === null}
          className="h-12 w-full rounded-lg bg-black text-base font-medium text-white hover:bg-neutral-800 disabled:opacity-40"
          onClick={onContinue}
        >
          Continue
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        {BUDGET_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => onSelect(opt.aud)}
            className={cn(
              "w-full rounded-lg border px-4 py-4 text-left text-base font-medium transition-colors",
              valueAud === opt.aud
                ? "border-black bg-black text-white"
                : "border-neutral-200 bg-white text-black active:bg-neutral-50",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </OnboardingLayout>
  );
}
