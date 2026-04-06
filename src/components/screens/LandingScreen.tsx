"use client";

import { Button } from "@/components/ui/button";

type LandingScreenProps = {
  onGetStarted: () => void;
};

export function LandingScreen({ onGetStarted }: LandingScreenProps) {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-[420px] flex-col bg-white px-6 text-black">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <h1 className="text-4xl font-medium tracking-tight">Reasi</h1>
        <p className="mt-3 text-lg leading-relaxed text-neutral-500">
          Plan your week. Shop smarter.
        </p>
        <p className="mt-6 max-w-xs text-base leading-relaxed text-neutral-600">
          Tell us how you eat, then get a tailored meal plan and shopping list in
          one tap.
        </p>
      </div>
      <div className="pb-8">
        <Button
          type="button"
          className="h-12 w-full rounded-lg bg-black text-base font-medium text-white hover:bg-neutral-800"
          onClick={onGetStarted}
        >
          Get started
        </Button>
      </div>
    </div>
  );
}
