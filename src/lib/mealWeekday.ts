import type { MealSlot } from "@/lib/ai/schemas";

const ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

function dayIndex(day: string): number | null {
  const s = day.trim().toLowerCase();
  if (s.startsWith("mon")) return 0;
  if (s.startsWith("tue")) return 1;
  if (s.startsWith("wed")) return 2;
  if (s.startsWith("thu")) return 3;
  if (s.startsWith("fri")) return 4;
  if (s.startsWith("sat")) return 5;
  if (s.startsWith("sun")) return 6;
  return null;
}

/**
 * Next weekday Mon→Sun not already represented by `meals`.
 * If every weekday appears at least once, cycles Mon→Sun by `meals.length % 7`
 * so additional meals (up to a large cap) spread across the week.
 */
export function nextUnusedWeekday(meals: Pick<MealSlot, "day">[]): string {
  const used = new Set<number>();
  for (const m of meals) {
    const idx = dayIndex(m.day);
    if (idx !== null) used.add(idx);
  }
  for (let i = 0; i < ORDER.length; i++) {
    if (!used.has(i)) return ORDER[i]!;
  }
  return ORDER[meals.length % ORDER.length]!;
}

export function dayShortLabel(day: string): string {
  const idx = dayIndex(day);
  if (idx !== null) {
    return ORDER[idx]!.slice(0, 3).toUpperCase();
  }
  const t = day.trim();
  return (t.length <= 3 ? t : t.slice(0, 3)).toUpperCase();
}
