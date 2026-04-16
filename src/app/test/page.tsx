"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateMealPlan, planWeek } from "@/lib/ai/actions";
import type { MealPlan } from "@/lib/ai/schemas";
import type { ShoppingList } from "@/lib/pipeline/formatShoppingList";
import type { UserProfile } from "@/lib/types";

const LUKE_PROFILE: UserProfile = {
  householdSize: 2,
  weeklyBudgetAud: 130,
  dietaryStyle: ["high_protein"],
  restrictions: [],
  cuisinePreferences: ["chinese", "thai", "vietnamese", "japanese"],
  cookingTimePreference: "20-40min",
};

const DEFAULT_WEEKLY =
  "Planning meals for next week, something fresh and not too heavy";

type Busy = "plan" | "full" | null;

export default function TestMealPlanPage() {
  const [weeklyInput, setWeeklyInput] = useState(DEFAULT_WEEKLY);
  const [busy, setBusy] = useState<Busy>(null);
  const [planResult, setPlanResult] = useState<MealPlan | null>(null);
  const [listResult, setListResult] = useState<ShoppingList | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGeneratePlan() {
    setBusy("plan");
    setError(null);
    setPlanResult(null);
    try {
      const result = await generateMealPlan(LUKE_PROFILE, weeklyInput);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPlanResult(result.plan);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function handleGenerateFullList() {
    setBusy("full");
    setError(null);
    setListResult(null);
    try {
      const list = await planWeek(LUKE_PROFILE, weeklyInput);
      setListResult(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  const loading = busy !== null;

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-4 pb-12">
      <h1 className="text-lg font-semibold">Meal plan (debug)</h1>
      <p className="text-sm text-muted-foreground">
        Hardcoded profile: Luke (2 people, $130/wk, high protein, East / SE Asian
        cuisines, 20–40 min).
      </p>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="weekly">
          Weekly request
        </label>
        <Textarea
          id="weekly"
          value={weeklyInput}
          onChange={(e) => setWeeklyInput(e.target.value)}
          rows={4}
          className="font-mono text-sm"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={handleGeneratePlan}
          disabled={loading}
          variant="outline"
        >
          {busy === "plan" ? "Generating…" : "Generate plan"}
        </Button>
        <Button
          type="button"
          onClick={handleGenerateFullList}
          disabled={loading}
        >
          {busy === "full" ? "Generating…" : "Generate full shopping list"}
        </Button>
      </div>
      {error ? (
        <pre className="overflow-x-auto rounded border border-destructive/50 bg-destructive/5 p-3 text-sm whitespace-pre-wrap text-destructive">
          {error}
        </pre>
      ) : null}
      {planResult ? (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            Meal plan only (JSON)
          </p>
          <pre className="overflow-x-auto rounded border bg-muted/30 p-3 text-xs whitespace-pre-wrap sm:text-sm">
            {JSON.stringify(planResult, null, 2)}
          </pre>
        </div>
      ) : null}
      {listResult ? (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            Full shopping list (JSON)
          </p>
          <pre className="overflow-x-auto rounded border bg-muted/30 p-3 text-xs whitespace-pre-wrap sm:text-sm">
            {JSON.stringify(listResult, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
