"use client";

import { useEffect, useState } from "react";

const PLAN_GENERATING_MESSAGES = [
  "Planning your meals",
  "Balancing your budget",
  "Picking the perfect mix",
] as const;

const LIST_BUILDING_MESSAGES = [
  "Building your shopping list",
  "Checking quantities",
  "Organizing by aisle",
  "Almost ready",
] as const;

export type PlanLoadingVariant = "plan_generating" | "list_building";

type PlanLoadingScreenProps = {
  variant: PlanLoadingVariant;
};

export function PlanLoadingScreen({ variant }: PlanLoadingScreenProps) {
  const [i, setI] = useState(0);

  useEffect(() => {
    queueMicrotask(() => setI(0));
    const messages =
      variant === "plan_generating"
        ? PLAN_GENERATING_MESSAGES
        : LIST_BUILDING_MESSAGES;
    const t = window.setInterval(() => {
      setI((n) => (n + 1) % messages.length);
    }, 3000);
    return () => window.clearInterval(t);
  }, [variant]);

  const messages =
    variant === "plan_generating"
      ? PLAN_GENERATING_MESSAGES
      : LIST_BUILDING_MESSAGES;
  const line = messages[i] ?? messages[0];

  return (
    <div className="fixed inset-0 z-20 flex flex-col items-center justify-center bg-white px-8 text-center text-black">
      <p className="text-2xl font-medium leading-snug tracking-tight sm:text-3xl">
        {line}
        <span className="inline-flex pl-0.5" aria-hidden>
          <span className="reasi-dot">.</span>
          <span className="reasi-dot">.</span>
          <span className="reasi-dot">.</span>
        </span>
      </p>
    </div>
  );
}
