"use client";

import { useEffect, useState } from "react";

const PLAN_GENERATING_MESSAGES = [
  "Planning your meals",
  "Balancing your budget",
  "Picking the perfect mix",
] as const;

const LIST_BUILD_EXPAND_MESSAGES = [
  "Reading recipes",
  "Checking ingredients",
  "Almost ready",
] as const;

const LIST_BUILD_FORMAT_MESSAGES = [
  "Building your shopping list",
  "Organizing by aisle",
  "Done in a moment",
] as const;

export type PlanLoadingVariant = "plan_generating" | "list_building";

export type ListBuildLoadingPhase = "expanding" | "formatting";

type PlanLoadingScreenProps = {
  variant: PlanLoadingVariant;
  /** When `variant` is `list_building`, selects the rotating copy (expand vs format). */
  listBuildPhase?: ListBuildLoadingPhase;
};

export function PlanLoadingScreen({
  variant,
  listBuildPhase = "expanding",
}: PlanLoadingScreenProps) {
  const [i, setI] = useState(0);

  const messages =
    variant === "plan_generating"
      ? PLAN_GENERATING_MESSAGES
      : listBuildPhase === "formatting"
        ? LIST_BUILD_FORMAT_MESSAGES
        : LIST_BUILD_EXPAND_MESSAGES;

  useEffect(() => {
    const len = messages.length;
    queueMicrotask(() => setI(0));
    const t = window.setInterval(() => {
      setI((n) => (n + 1) % len);
    }, 3000);
    return () => window.clearInterval(t);
  }, [messages]);
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
