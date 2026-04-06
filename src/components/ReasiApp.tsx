"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  addMeal,
  buildShoppingList,
  generateMealPlan,
  swapMeal,
} from "@/lib/ai/actions";
import type { MealSlot } from "@/lib/ai/schemas";
import { BUDGET_OPTIONS } from "@/lib/onboardingOptions";
import { nextUnusedWeekday } from "@/lib/mealWeekday";
import { summarizeProfile } from "@/lib/profileSummary";
import type { ShoppingList } from "@/lib/pipeline/formatShoppingList";
import { loadProfile, saveProfile } from "@/lib/storage";
import type { UserProfile } from "@/lib/types";

import { LandingScreen } from "./screens/LandingScreen";
import { MealReviewScreen } from "./screens/MealReviewScreen";
import { OnboardingBudgetScreen } from "./screens/OnboardingBudgetScreen";
import { OnboardingCookingTimeScreen } from "./screens/OnboardingCookingTimeScreen";
import { OnboardingCuisinesScreen } from "./screens/OnboardingCuisinesScreen";
import { OnboardingDietaryScreen } from "./screens/OnboardingDietaryScreen";
import { OnboardingHouseholdScreen } from "./screens/OnboardingHouseholdScreen";
import { PlanInputScreen } from "./screens/PlanInputScreen";
import { PlanLoadingScreen } from "./screens/PlanLoadingScreen";
import { PlanResultScreen } from "./screens/PlanResultScreen";

/**
 * Main flow steps. `profile_edit` is reserved: edits replay `onboarding_1`…`onboarding_5`
 * with `isEditingProfile: true` in `history.state` (see `HistoryPayload`).
 */
export type AppStep =
  | "landing"
  | "onboarding_1"
  | "onboarding_2"
  | "onboarding_3"
  | "onboarding_4"
  | "onboarding_5"
  | "plan_input"
  | "plan_generating"
  | "meal_review"
  | "list_building"
  | "plan_result"
  | "profile_edit";

type HistoryPayload = {
  step: AppStep;
  isEditingProfile: boolean;
};

const DEFAULT_WEEKLY = "";

function nearestBudgetAud(target: number): number {
  let best: number = BUDGET_OPTIONS[0]!.aud;
  let bestDiff = Math.abs(best - target);
  for (const o of BUDGET_OPTIONS) {
    const d = Math.abs(o.aud - target);
    if (d < bestDiff) {
      bestDiff = d;
      best = o.aud;
    }
  }
  return best;
}

export function ReasiApp() {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<AppStep>("landing");
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [savedProfile, setSavedProfile] = useState<UserProfile | null>(null);

  const [household, setHousehold] = useState<number | null>(null);
  const [budgetAud, setBudgetAud] = useState<number | null>(null);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [dietary, setDietary] = useState<string[]>([]);
  const [restrictionsText, setRestrictionsText] = useState("");
  const [cooking, setCooking] = useState<string | null>(null);

  const [weeklyText, setWeeklyText] = useState(DEFAULT_WEEKLY);
  const [planError, setPlanError] = useState<string | null>(null);
  const [reviewMeals, setReviewMeals] = useState<MealSlot[]>([]);
  const [listBuildError, setListBuildError] = useState<string | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(() => new Set());

  const [swappingIndex, setSwappingIndex] = useState<number | null>(null);
  const [addingMeal, setAddingMeal] = useState(false);

  const stepRef = useRef<AppStep>("landing");
  const isEditRef = useRef(false);
  const planGenRef = useRef(0);
  const listBuildGenRef = useRef(0);
  const swapOpGenRef = useRef(0);
  const addMealEpochRef = useRef(0);
  const didInitHistory = useRef(false);

  useEffect(() => {
    isEditRef.current = isEditingProfile;
  }, [isEditingProfile]);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  const hydrateDraft = useCallback((p: UserProfile) => {
    setHousehold(p.householdSize);
    setBudgetAud(nearestBudgetAud(p.weeklyBudgetAud));
    setCuisines([...p.cuisinePreferences]);
    setDietary(
      p.dietaryStyle.length > 0 ? [...p.dietaryStyle] : ["no_restrictions"],
    );
    setRestrictionsText(p.restrictions.join(", "));
    setCooking(p.cookingTimePreference);
  }, []);

  const resetDraft = useCallback(() => {
    setHousehold(null);
    setBudgetAud(null);
    setCuisines([]);
    setDietary([]);
    setRestrictionsText("");
    setCooking(null);
  }, []);

  const buildProfile = useCallback((): UserProfile => {
    let dietaryStyle = [...dietary];
    if (dietaryStyle.includes("no_restrictions")) {
      dietaryStyle = ["no_restrictions"];
    }
    if (dietaryStyle.length === 0) {
      dietaryStyle = ["no_restrictions"];
    }

    return {
      householdSize: household!,
      weeklyBudgetAud: budgetAud!,
      dietaryStyle,
      restrictions: restrictionsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      cuisinePreferences: [...cuisines],
      cookingTimePreference: cooking!,
    };
  }, [household, budgetAud, dietary, restrictionsText, cuisines, cooking]);

  const pushStep = useCallback((next: AppStep) => {
    const payload: HistoryPayload = {
      step: next,
      isEditingProfile: isEditRef.current,
    };
    window.history.pushState(payload, "", window.location.pathname);
    stepRef.current = next;
    setStep(next);
  }, []);

  const replaceStep = useCallback((next: AppStep) => {
    const payload: HistoryPayload = {
      step: next,
      isEditingProfile: isEditRef.current,
    };
    window.history.replaceState(payload, "", window.location.pathname);
    stepRef.current = next;
    setStep(next);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    if (didInitHistory.current) return;
    didInitHistory.current = true;

    const existing = loadProfile();
    const stepInit: AppStep = existing ? "plan_input" : "landing";
    const payload: HistoryPayload = {
      step: stepInit,
      isEditingProfile: false,
    };
    window.history.replaceState(payload, "", window.location.pathname);
    stepRef.current = stepInit;
    queueMicrotask(() => {
      setStep(stepInit);
      setIsEditingProfile(false);
      isEditRef.current = false;
      if (existing) {
        setSavedProfile(existing);
      }
    });
  }, [mounted]);

  useEffect(() => {
    if (step !== "plan_input" || savedProfile) return;
    const p = loadProfile();
    if (p) {
      queueMicrotask(() => setSavedProfile(p));
    }
  }, [step, savedProfile]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onPop = (e: PopStateEvent) => {
      const st = e.state as HistoryPayload | null;
      const prev = stepRef.current;

      if (prev === "plan_generating") {
        planGenRef.current += 1;
      }
      if (prev === "list_building") {
        listBuildGenRef.current += 1;
      }

      if (st?.step) {
        stepRef.current = st.step;
        setStep(st.step);
        setIsEditingProfile(Boolean(st.isEditingProfile));
        isEditRef.current = Boolean(st.isEditingProfile);
      }
    };

    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const goBack = useCallback(() => {
    window.history.back();
  }, []);

  const startOnboarding = useCallback(() => {
    resetDraft();
    setIsEditingProfile(false);
    isEditRef.current = false;
    pushStep("onboarding_1");
  }, [pushStep, resetDraft]);

  const openProfileEditor = useCallback(() => {
    const p = savedProfile ?? loadProfile();
    if (p) hydrateDraft(p);
    else resetDraft();
    setIsEditingProfile(true);
    isEditRef.current = true;
    pushStep("onboarding_1");
  }, [hydrateDraft, pushStep, resetDraft, savedProfile]);

  const toggleDietary = useCallback((slug: string) => {
    if (slug === "no_restrictions") {
      setDietary(["no_restrictions"]);
      return;
    }
    setDietary((prev) => {
      const withoutNo = prev.filter((x) => x !== "no_restrictions");
      if (withoutNo.includes(slug)) {
        return withoutNo.filter((x) => x !== slug);
      }
      return [...withoutNo, slug];
    });
  }, []);

  const toggleCuisine = useCallback((slug: string) => {
    setCuisines((prev) =>
      prev.includes(slug) ? prev.filter((x) => x !== slug) : [...prev, slug],
    );
  }, []);

  const finishOnboarding = useCallback(() => {
    const profile = buildProfile();
    saveProfile(profile);
    setSavedProfile(profile);
    setIsEditingProfile(false);
    isEditRef.current = false;
    pushStep("plan_input");
  }, [buildProfile, pushStep]);

  const runGenerateFromInput = useCallback(async () => {
    const profile = savedProfile ?? loadProfile();
    if (!profile) return;
    if (!savedProfile) setSavedProfile(profile);
    setPlanError(null);
    swapOpGenRef.current += 1;
    addMealEpochRef.current += 1;
    setSwappingIndex(null);
    const id = ++planGenRef.current;
    pushStep("plan_generating");
    try {
      const plan = await generateMealPlan(profile, weeklyText);
      if (planGenRef.current !== id) return;
      setReviewMeals(plan.meals);
      replaceStep("meal_review");
    } catch {
      if (planGenRef.current !== id) return;
      setPlanError("Something went wrong. Please try again.");
      window.history.back();
    }
  }, [pushStep, replaceStep, savedProfile, weeklyText]);

  const runStartOver = useCallback(async () => {
    const profile = savedProfile ?? loadProfile();
    if (!profile) return;
    swapOpGenRef.current += 1;
    addMealEpochRef.current += 1;
    setSwappingIndex(null);
    const id = ++planGenRef.current;
    pushStep("plan_generating");
    try {
      const plan = await generateMealPlan(profile, weeklyText);
      if (planGenRef.current !== id) return;
      setReviewMeals(plan.meals);
      replaceStep("meal_review");
    } catch {
      if (planGenRef.current !== id) return;
      window.history.back();
    }
  }, [pushStep, replaceStep, savedProfile, weeklyText]);

  useEffect(() => {
    setListBuildError(null);
  }, [reviewMeals]);

  const handleSwapMeal = useCallback(
    async (index: number) => {
      const profile = savedProfile ?? loadProfile();
      if (!profile) return;
      const current = reviewMeals[index];
      if (!current) return;
      const opId = ++swapOpGenRef.current;
      setSwappingIndex(index);
      try {
        const others = reviewMeals.filter((_, i) => i !== index);
        const newMeal = await swapMeal(
          profile,
          weeklyText,
          current,
          others,
        );
        if (swapOpGenRef.current !== opId) return;
        setReviewMeals((prev) =>
          prev.map((m, i) => (i === index ? newMeal : m)),
        );
      } finally {
        if (swapOpGenRef.current === opId) {
          setSwappingIndex(null);
        }
      }
    },
    [reviewMeals, savedProfile, weeklyText],
  );

  const handleAddMeal = useCallback(async () => {
    const profile = savedProfile ?? loadProfile();
    if (!profile) return;
    const my = ++addMealEpochRef.current;
    setAddingMeal(true);
    try {
      const day = nextUnusedWeekday(reviewMeals);
      const meal = await addMeal(profile, weeklyText, reviewMeals, day);
      if (addMealEpochRef.current !== my) return;
      setReviewMeals((prev) => [...prev, meal]);
    } finally {
      if (addMealEpochRef.current === my) {
        setAddingMeal(false);
      }
    }
  }, [reviewMeals, savedProfile, weeklyText]);

  const runListBuild = useCallback(async () => {
    const profile = savedProfile ?? loadProfile();
    if (!profile || reviewMeals.length === 0) return;
    setListBuildError(null);
    const id = ++listBuildGenRef.current;
    pushStep("list_building");
    try {
      const list = await buildShoppingList(profile, reviewMeals);
      if (listBuildGenRef.current !== id) return;
      setShoppingList(list);
      setCheckedItems(new Set());
      replaceStep("plan_result");
    } catch {
      if (listBuildGenRef.current !== id) return;
      setListBuildError("Something went wrong. Please try again.");
      window.history.back();
    }
  }, [pushStep, replaceStep, reviewMeals, savedProfile]);

  const toggleItemChecked = useCallback((key: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  if (!mounted) {
    return (
      <div className="mx-auto min-h-svh w-full max-w-[420px] bg-white text-black" />
    );
  }

  if (step === "landing") {
    return <LandingScreen onGetStarted={startOnboarding} />;
  }

  if (step === "onboarding_1") {
    return (
      <OnboardingHouseholdScreen
        value={household}
        onChange={setHousehold}
        onBack={goBack}
        onContinue={() => pushStep("onboarding_2")}
      />
    );
  }

  if (step === "onboarding_2") {
    return (
      <OnboardingBudgetScreen
        valueAud={budgetAud}
        onSelect={setBudgetAud}
        onBack={goBack}
        onContinue={() => pushStep("onboarding_3")}
      />
    );
  }

  if (step === "onboarding_3") {
    return (
      <OnboardingCuisinesScreen
        selected={cuisines}
        onToggle={toggleCuisine}
        onBack={goBack}
        onContinue={() => pushStep("onboarding_4")}
      />
    );
  }

  if (step === "onboarding_4") {
    return (
      <OnboardingDietaryScreen
        dietaryStyle={dietary}
        restrictionsText={restrictionsText}
        onToggleDietary={toggleDietary}
        onRestrictionsChange={setRestrictionsText}
        onBack={goBack}
        onContinue={() => pushStep("onboarding_5")}
      />
    );
  }

  if (step === "onboarding_5") {
    return (
      <OnboardingCookingTimeScreen
        value={cooking}
        onSelect={setCooking}
        onBack={goBack}
        onDone={finishOnboarding}
      />
    );
  }

  if (step === "plan_input") {
    const profile = savedProfile ?? loadProfile();
    if (!profile) {
      return <LandingScreen onGetStarted={startOnboarding} />;
    }
    return (
      <PlanInputScreen
        summaryLine={summarizeProfile(profile)}
        weeklyText={weeklyText}
        onWeeklyTextChange={(v) => {
          setWeeklyText(v);
          if (planError) setPlanError(null);
        }}
        planError={planError}
        onChangeProfile={openProfileEditor}
        onOpenSettings={openProfileEditor}
        onSubmit={() => void runGenerateFromInput()}
      />
    );
  }

  if (step === "plan_generating") {
    return <PlanLoadingScreen variant="plan_generating" />;
  }

  if (step === "meal_review") {
    if (reviewMeals.length === 0) {
      const profile = savedProfile ?? loadProfile();
      if (profile) {
        return (
          <PlanInputScreen
            summaryLine={summarizeProfile(profile)}
            weeklyText={weeklyText}
            onWeeklyTextChange={(v) => {
              setWeeklyText(v);
              if (planError) setPlanError(null);
            }}
            planError={planError}
            onChangeProfile={openProfileEditor}
            onOpenSettings={openProfileEditor}
            onSubmit={() => void runGenerateFromInput()}
          />
        );
      }
      return <LandingScreen onGetStarted={startOnboarding} />;
    }
    return (
      <MealReviewScreen
        meals={reviewMeals}
        swappingIndex={swappingIndex}
        addingMeal={addingMeal}
        listBuildError={listBuildError}
        onBack={goBack}
        onSwap={(i) => void handleSwapMeal(i)}
        onRemove={(i) =>
          setReviewMeals((prev) => prev.filter((_, j) => j !== i))
        }
        onAddMeal={() => void handleAddMeal()}
        onStartOver={() => void runStartOver()}
        onConfirmBuild={() => void runListBuild()}
      />
    );
  }

  if (step === "list_building") {
    return <PlanLoadingScreen variant="list_building" />;
  }

  if (step === "plan_result") {
    if (shoppingList) {
      return (
        <PlanResultScreen
          list={shoppingList}
          checked={checkedItems}
          onToggleItem={toggleItemChecked}
          onBack={goBack}
        />
      );
    }
    if (reviewMeals.length > 0) {
      return (
        <MealReviewScreen
          meals={reviewMeals}
          swappingIndex={swappingIndex}
          addingMeal={addingMeal}
          listBuildError={listBuildError}
          onBack={goBack}
          onSwap={(i) => void handleSwapMeal(i)}
          onRemove={(i) =>
            setReviewMeals((prev) => prev.filter((_, j) => j !== i))
          }
          onAddMeal={() => void handleAddMeal()}
          onStartOver={() => void runStartOver()}
          onConfirmBuild={() => void runListBuild()}
        />
      );
    }
    const profile = savedProfile ?? loadProfile();
    if (profile) {
      return (
        <PlanInputScreen
          summaryLine={summarizeProfile(profile)}
          weeklyText={weeklyText}
          onWeeklyTextChange={(v) => {
            setWeeklyText(v);
            if (planError) setPlanError(null);
          }}
          planError={planError}
          onChangeProfile={openProfileEditor}
          onOpenSettings={openProfileEditor}
          onSubmit={() => void runGenerateFromInput()}
        />
      );
    }
  }

  return (
    <LandingScreen onGetStarted={startOnboarding} />
  );
}
