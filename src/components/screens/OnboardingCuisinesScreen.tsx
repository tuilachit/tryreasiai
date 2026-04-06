"use client";

import { Button } from "@/components/ui/button";
import { CUISINE_OPTIONS } from "@/lib/onboardingOptions";
import { cn } from "@/lib/utils";

import { OnboardingLayout } from "./OnboardingLayout";

type OnboardingCuisinesScreenProps = {
  selected: string[];
  onToggle: (slug: string) => void;
  onBack: () => void;
  onContinue: () => void;
};

export function OnboardingCuisinesScreen({
  selected,
  onToggle,
  onBack,
  onContinue,
}: OnboardingCuisinesScreenProps) {
  const canContinue = selected.length > 0;

  return (
    <OnboardingLayout
      progressFilled={3}
      title="What cuisines do you enjoy?"
      subtitle="Pick as many as you like."
      onBack={onBack}
      footer={
        <Button
          type="button"
          disabled={!canContinue}
          className="h-12 w-full rounded-lg bg-black text-base font-medium text-white hover:bg-neutral-800 disabled:opacity-40"
          onClick={onContinue}
        >
          Continue
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        {CUISINE_OPTIONS.map((c) => {
          const isOn = selected.includes(c.slug);
          return (
            <button
              key={c.slug}
              type="button"
              onClick={() => onToggle(c.slug)}
              className={cn(
                "min-h-[52px] rounded-lg border px-3 py-3 text-center text-sm font-medium leading-tight transition-colors",
                isOn
                  ? "border-black bg-black text-white"
                  : "border-neutral-200 bg-white text-black active:bg-neutral-50",
              )}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </OnboardingLayout>
  );
}
