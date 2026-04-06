"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DIETARY_OPTIONS } from "@/lib/onboardingOptions";
import { cn } from "@/lib/utils";

import { OnboardingLayout } from "./OnboardingLayout";

type OnboardingDietaryScreenProps = {
  dietaryStyle: string[];
  restrictionsText: string;
  onToggleDietary: (slug: string) => void;
  onRestrictionsChange: (v: string) => void;
  onBack: () => void;
  onContinue: () => void;
};

export function OnboardingDietaryScreen({
  dietaryStyle,
  restrictionsText,
  onToggleDietary,
  onRestrictionsChange,
  onBack,
  onContinue,
}: OnboardingDietaryScreenProps) {
  return (
    <OnboardingLayout
      progressFilled={4}
      title="Dietary style & restrictions"
      subtitle="Pick what applies. You can choose more than one."
      onBack={onBack}
      footer={
        <Button
          type="button"
          className="h-12 w-full rounded-lg bg-black text-base font-medium text-white hover:bg-neutral-800"
          onClick={onContinue}
        >
          Continue
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        {DIETARY_OPTIONS.map((d) => {
          const isOn = dietaryStyle.includes(d.slug);
          return (
            <button
              key={d.slug}
              type="button"
              onClick={() => onToggleDietary(d.slug)}
              className={cn(
                "min-h-[52px] rounded-lg border px-2 py-3 text-center text-sm font-medium leading-tight transition-colors",
                isOn
                  ? "border-black bg-black text-white"
                  : "border-neutral-200 bg-white text-black active:bg-neutral-50",
              )}
            >
              {d.label}
            </button>
          );
        })}
      </div>
      <div className="mt-8 space-y-2">
        <Label
          htmlFor="restrictions"
          className="text-sm font-medium text-neutral-700"
        >
          Anything to avoid?
        </Label>
        <Input
          id="restrictions"
          value={restrictionsText}
          onChange={(e) => onRestrictionsChange(e.target.value)}
          placeholder="e.g. shellfish, mushrooms, coriander"
          className="h-11 rounded-lg border-neutral-200 bg-white text-base"
        />
      </div>
    </OnboardingLayout>
  );
}
