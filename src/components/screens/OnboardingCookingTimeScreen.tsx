"use client";

import { Button } from "@/components/ui/button";
import { COOKING_TIME_OPTIONS } from "@/lib/onboardingOptions";
import { cn } from "@/lib/utils";

import { OnboardingLayout } from "./OnboardingLayout";

type OnboardingCookingTimeScreenProps = {
  value: string | null;
  onSelect: (v: string) => void;
  onBack: () => void;
  onDone: () => void;
};

export function OnboardingCookingTimeScreen({
  value,
  onSelect,
  onBack,
  onDone,
}: OnboardingCookingTimeScreenProps) {
  return (
    <OnboardingLayout
      progressFilled={5}
      title="How much time do you usually have to cook?"
      subtitle="On a typical weeknight."
      onBack={onBack}
      footer={
        <Button
          type="button"
          disabled={value === null}
          className="h-12 w-full rounded-lg bg-black text-base font-medium text-white hover:bg-neutral-800 disabled:opacity-40"
          onClick={onDone}
        >
          Done
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        {COOKING_TIME_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={cn(
              "w-full rounded-lg border px-4 py-4 text-left text-base font-medium transition-colors",
              value === opt.value
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
