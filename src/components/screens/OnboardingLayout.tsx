"use client";

import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type OnboardingLayoutProps = {
  progressFilled: number;
  title: string;
  subtitle?: string;
  onBack: () => void;
  children: ReactNode;
  footer: ReactNode;
};

export function OnboardingLayout({
  progressFilled,
  title,
  subtitle,
  onBack,
  children,
  footer,
}: OnboardingLayoutProps) {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-[420px] flex-col bg-white text-black">
      <header className="flex shrink-0 items-center px-4 pt-4 pb-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex size-10 shrink-0 items-center justify-center rounded-lg active:bg-neutral-100"
        >
          <ArrowLeft className="size-6" strokeWidth={1.75} />
        </button>
        <div className="flex flex-1 justify-center gap-1.5 px-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className={cn(
                "size-1.5 rounded-full transition-colors",
                i < progressFilled ? "bg-black" : "bg-neutral-300",
              )}
            />
          ))}
        </div>
        <div className="w-10 shrink-0" aria-hidden />
      </header>
      <div className="px-5 pb-28 pt-2">
        <h1 className="text-3xl font-medium leading-tight tracking-tight">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 text-base leading-relaxed text-neutral-500">
            {subtitle}
          </p>
        ) : null}
        <div className="mt-8">{children}</div>
      </div>
      <div className="fixed bottom-0 left-1/2 z-10 w-full max-w-[420px] -translate-x-1/2 border-t border-neutral-200 bg-white px-4 py-4">
        {footer}
      </div>
    </div>
  );
}
