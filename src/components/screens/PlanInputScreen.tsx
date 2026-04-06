"use client";

import { useEffect, useId, useState } from "react";
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
  const [notesExpanded, setNotesExpanded] = useState(false);
  const notesFieldId = useId();

  useEffect(() => {
    if (!notesExpanded) return;
    const raf = requestAnimationFrame(() => {
      document.getElementById(notesFieldId)?.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, [notesExpanded, notesFieldId]);

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
      <div
        className={`flex flex-1 flex-col px-5 pt-4 transition-[padding] duration-200 ease-out ${
          notesExpanded ? "pb-[min(42rem,88svh)]" : "pb-40"
        }`}
      >
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
        <div className="mt-10 flex flex-1 flex-col">
          <h1 className="text-2xl font-medium tracking-tight text-black">
            Plan this week
          </h1>
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
        <p className="mt-2.5 text-center text-xs text-neutral-500">
          Based on your profile · Tap to plan.
        </p>
        <button
          type="button"
          onClick={() => setNotesExpanded((v) => !v)}
          className="mt-2 w-full text-center text-sm text-neutral-500 underline-offset-2 transition-colors hover:text-neutral-700 hover:underline"
        >
          {notesExpanded ? "Hide notes" : "Add specific notes (optional)"}
        </button>
        <div
          className={`grid transition-[grid-template-rows] duration-200 ease-out ${
            notesExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div
              className={`pt-3 transition-opacity duration-200 ease-out ${
                notesExpanded ? "opacity-100" : "opacity-0"
              }`}
            >
              <p className="mb-2 text-xs text-neutral-500">
                e.g. &apos;lots of leftovers from last week&apos; or
                &apos;craving Thai this week&apos;
              </p>
              <Textarea
                id={notesFieldId}
                tabIndex={notesExpanded ? 0 : -1}
                aria-hidden={!notesExpanded}
                value={weeklyText}
                onChange={(e) => onWeeklyTextChange(e.target.value)}
                placeholder="Anything specific this week? Cravings, leftovers to use up, busy nights…"
                className="min-h-[140px] resize-none rounded-lg border-neutral-200 bg-white p-3 text-base leading-relaxed"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
