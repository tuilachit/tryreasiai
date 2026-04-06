"use client";

import { Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type PlanInputScreenProps = {
  summaryLine: string;
  weeklyText: string;
  onWeeklyTextChange: (v: string) => void;
  planError: string | null;
  onChangeProfile: () => void;
  onOpenSettings: () => void;
  onSubmit: () => void;
};

export function PlanInputScreen({
  summaryLine,
  weeklyText,
  onWeeklyTextChange,
  planError,
  onChangeProfile,
  onOpenSettings,
  onSubmit,
}: PlanInputScreenProps) {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-[420px] flex-col bg-white text-black">
      <header className="flex shrink-0 items-center justify-between px-4 pt-4 pb-2">
        <span className="text-lg font-medium tracking-tight">Reasi</span>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Settings"
          className="flex size-10 items-center justify-center rounded-lg active:bg-neutral-100"
        >
          <Settings className="size-6" strokeWidth={1.5} />
        </button>
      </header>
      <div className="flex flex-1 flex-col px-5 pb-28 pt-4">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm leading-relaxed text-neutral-600">
          <span className="min-w-0 flex-1">{summaryLine}</span>
          <button
            type="button"
            onClick={onChangeProfile}
            className="shrink-0 font-medium uppercase tracking-wide text-black underline-offset-2 hover:underline"
          >
            CHANGE
          </button>
        </div>
        <div className="mt-8 flex flex-1 flex-col">
          <Textarea
            value={weeklyText}
            onChange={(e) => onWeeklyTextChange(e.target.value)}
            placeholder="Planning meals for next week, something fresh and not too heavy…"
            className="min-h-[200px] flex-1 resize-none rounded-lg border-neutral-200 bg-white p-4 text-base leading-relaxed"
          />
        </div>
      </div>
      <div className="fixed bottom-0 left-1/2 z-10 w-full max-w-[420px] -translate-x-1/2 border-t border-neutral-200 bg-white px-4 py-4">
        {planError ? (
          <p className="mb-3 text-center text-sm text-neutral-600">{planError}</p>
        ) : null}
        <Button
          type="button"
          className="h-12 w-full rounded-lg bg-black text-base font-medium text-white hover:bg-neutral-800"
          onClick={onSubmit}
        >
          Plan my week
        </Button>
      </div>
    </div>
  );
}
