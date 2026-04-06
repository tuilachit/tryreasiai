import type { UserProfile } from "@/lib/types";

function dietaryToDisplay(slug: string): string {
  return slug.replace(/_/g, "-");
}

export function summarizeProfile(profile: UserProfile): string {
  const parts: string[] = [];

  const peopleLabel =
    profile.householdSize >= 6 ? "5+" : String(profile.householdSize);
  parts.push(`${peopleLabel} people`);
  parts.push(`$${profile.weeklyBudgetAud}/wk`);

  const styles = profile.dietaryStyle.filter((s) => s !== "no_restrictions");
  for (const s of styles) {
    parts.push(dietaryToDisplay(s));
  }

  const cuisines = profile.cuisinePreferences;
  if (cuisines.length === 1) {
    parts.push(cuisines[0]!);
  } else if (cuisines.length === 2) {
    parts.push(`${cuisines[0]!}, ${cuisines[1]!}`);
  } else if (cuisines.length > 2) {
    parts.push(`${cuisines[0]!}, ${cuisines[1]!} +more`);
  }

  return parts.join(" · ").toLowerCase();
}
