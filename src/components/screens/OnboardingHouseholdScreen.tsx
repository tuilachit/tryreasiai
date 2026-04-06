"use client";

import { Button } from "@/components/ui/button";
import { HOUSEHOLD_FIVE_PLUS, HOUSEHOLD_OPTIONS } from "@/lib/onboardingOptions";
import { cn } from "@/lib/utils";

import { OnboardingLayout } from "./OnboardingLayout";

type OnboardingHouseholdScreenProps = {
  value: number | null;
  onChange: (n: number) => void;
  onBack: () => void;
  onContinue: () => void;
};

export function OnboardingHouseholdScreen({
  value,
  onChange,
  onBack,
  onContinue,
}: OnboardingHouseholdScreenProps) {
  return (
    <OnboardingLayout
      progressFilled={1}
      title="How many people are you cooking for?"
      onBack={onBack}
      footer={
        <Button
          type="button"
          disabled={value === null}
          className="h-12 w-full rounded-lg bg-black text-base font-medium text-white hover:bg-neutral-800 disabled:opacity-40"
          onClick={onContinue}
        >
          Continue
        </Button>
      }
    >
      <div className="flex flex-row flex-wrap justify-center gap-3">
        {HOUSEHOLD_OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={cn(
              "flex size-[72px] items-center justify-center rounded-lg border text-xl font-medium transition-colors",
              value === n
                ? "border-black bg-black text-white"
                : "border-neutral-200 bg-white text-black active:bg-neutral-50",
            )}
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange(HOUSEHOLD_FIVE_PLUS)}
          className={cn(
            "flex size-[72px] items-center justify-center rounded-lg border text-lg font-medium transition-colors",
            value === HOUSEHOLD_FIVE_PLUS
              ? "border-black bg-black text-white"
              : "border-neutral-200 bg-white text-black active:bg-neutral-50",
          )}
        >
          5+
        </button>
      </div>
    </OnboardingLayout>
  );
}
