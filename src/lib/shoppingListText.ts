import type { ShoppingList } from "@/lib/pipeline/formatShoppingList";

export function abbrevDay(raw: string): string {
  const s = raw.trim().toLowerCase();
  if (s.startsWith("mon")) return "Mon";
  if (s.startsWith("tue")) return "Tue";
  if (s.startsWith("wed")) return "Wed";
  if (s.startsWith("thu")) return "Thu";
  if (s.startsWith("fri")) return "Fri";
  if (s.startsWith("sat")) return "Sat";
  if (s.startsWith("sun")) return "Sun";
  return raw.trim().slice(0, 3);
}

export function truncateDish(name: string, max = 22): string {
  const t = name.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function formatMealSummaryLine(meals: ShoppingList["meals"]): string {
  return meals
    .map((m) => `${abbrevDay(m.day)} ${truncateDish(m.dish)}`)
    .join(" · ");
}

export function formatShoppingListPlainText(list: ShoppingList): string {
  const lines: string[] = [];
  lines.push(
    `Reasi — this week (~$${list.totalEstimatedCostAud.toFixed(2)} AUD)`,
  );
  lines.push("");
  for (const sec of list.sections) {
    lines.push(sec.label);
    for (const it of sec.items) {
      lines.push(`• ${it.name} — ${it.quantity}`);
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}
