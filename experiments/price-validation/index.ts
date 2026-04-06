import { config } from "dotenv";
import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { searchColes, searchWoolworths, type ProductResult } from "./api.js";
import { TEST_INGREDIENTS } from "./testIngredients.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, ".env") });

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fmtMoney(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "—";
  return `$${n.toFixed(2)}`;
}

/** Words from query for mismatch heuristic (length >= 4, case-insensitive). */
function significantWords(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((w) => w.length >= 4);
}

function possibleWrongMatch(productName: string | null, query: string): boolean {
  if (!productName) return false;
  const words = significantWords(query);
  if (words.length === 0) return false;
  const pl = productName.toLowerCase();
  return !words.some((w) => pl.includes(w));
}

function cheaperPrice(a: number | null, b: number | null): number | null {
  if (a === null && b === null) return null;
  if (a === null) return b;
  if (b === null) return a;
  return Math.min(a, b);
}

function pctVsCheaper(reasi: number, cheaper: number): number {
  return ((reasi - cheaper) / cheaper) * 100;
}

type ResultRow = {
  ingredient: string;
  reasiEstimateAud: number;
  woolies: ProductResult | null;
  coles: ProductResult | null;
  pctError: number | null;
};

async function main(): Promise<void> {
  const notes: string[] = [];
  const rows: ResultRow[] = [];
  const n = TEST_INGREDIENTS.length;

  for (let i = 0; i < n; i++) {
    const ing = TEST_INGREDIENTS[i]!;
    const label = `[${i + 1}/${n}] ${ing.name}`;

    const wooliesList = await searchWoolworths(ing.name);
    const colesList = await searchColes(ing.name);

    const topW = wooliesList?.[0] ?? null;
    const topC = colesList?.[0] ?? null;

    const wPrice = topW?.priceAud ?? null;
    const cPrice = topC?.priceAud ?? null;
    const cheap = cheaperPrice(wPrice, cPrice);
    const pctError =
      cheap !== null && cheap > 0
        ? pctVsCheaper(ing.reasiEstimateAud, cheap)
        : null;

    console.log(
      `${label}... Woolies: ${fmtMoney(wPrice)}, Coles: ${fmtMoney(cPrice)}`,
    );

    if (topW && possibleWrongMatch(topW.name, ing.name)) {
      notes.push(
        `Possible bad Woolworths match for "${ing.name}": "${topW.name}" (no significant query word found in product name).`,
      );
    }
    if (topC && possibleWrongMatch(topC.name, ing.name)) {
      notes.push(
        `Possible bad Coles match for "${ing.name}": "${topC.name}" (no significant query word found in product name).`,
      );
    }
    if ((wPrice !== null) !== (cPrice !== null)) {
      notes.push(
        wPrice === null
          ? `Only Coles returned a price for "${ing.name}".`
          : `Only Woolworths returned a price for "${ing.name}".`,
      );
    }
    if (
      wPrice !== null &&
      cPrice !== null &&
      Math.min(wPrice, cPrice) > 0
    ) {
      const lo = Math.min(wPrice, cPrice);
      const hi = Math.max(wPrice, cPrice);
      if ((hi - lo) / lo >= 0.5) {
        notes.push(
          `Large Woolworths vs Coles spread for "${ing.name}": ${fmtMoney(wPrice)} vs ${fmtMoney(cPrice)}.`,
        );
      }
    }

    rows.push({
      ingredient: ing.name,
      reasiEstimateAud: ing.reasiEstimateAud,
      woolies: topW,
      coles: topC,
      pctError,
    });

    if (i < n - 1) await sleep(500);
  }

  const wooliesHits = rows.filter((r) => r.woolies !== null).length;
  const colesHits = rows.filter((r) => r.coles !== null).length;
  const withError = rows.filter((r) => r.pctError !== null);
  const absErrors = withError.map((r) => Math.abs(r.pctError!));
  const avgAbs =
    absErrors.length > 0
      ? absErrors.reduce((a, b) => a + b, 0) / absErrors.length
      : 0;

  const over30 = rows.filter(
    (r) => r.pctError !== null && r.pctError > 30,
  ).length;
  const under30 = rows.filter(
    (r) => r.pctError !== null && r.pctError < -30,
  ).length;
  const neither = rows.filter(
    (r) => r.woolies === null && r.coles === null,
  ).length;

  let verdictBody: string;
  if (withError.length === 0) {
    verdictBody =
      "No retailer prices were parsed — check API paths, query params, and response mapping in `api.ts`, then re-run.";
  } else if (avgAbs < 20) {
    verdictBody =
      "Reasi's estimates are accurate enough for v1. Real pricing is a nice-to-have, not urgent.";
  } else if (avgAbs <= 40) {
    verdictBody =
      "Reasi's estimates are in the right ballpark but noticeably off. Real pricing would meaningfully improve trust.";
  } else {
    verdictBody =
      "Reasi's estimates are significantly wrong. Users will notice. Real pricing is important.";
  }

  const sorted = [...rows].sort((a, b) => {
    if (a.pctError === null && b.pctError === null) return 0;
    if (a.pctError === null) return 1;
    if (b.pctError === null) return -1;
    return Math.abs(b.pctError) - Math.abs(a.pctError);
  });

  const tableLines = [
    "| Ingredient | Reasi Estimate | Woolies Price | Woolies Product | Coles Price | Coles Product | % Error |",
    "| --- | --- | --- | --- | --- | --- | --- |",
  ];
  for (const r of sorted) {
    const pct =
      r.pctError === null ? "—" : `${r.pctError >= 0 ? "+" : ""}${r.pctError.toFixed(1)}%`;
    const wName = r.woolies?.name ?? "—";
    const cName = r.coles?.name ?? "—";
    const esc = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");
    tableLines.push(
      `| ${esc(r.ingredient)} | ${fmtMoney(r.reasiEstimateAud)} | ${fmtMoney(r.woolies?.priceAud ?? null)} | ${esc(wName)} | ${fmtMoney(r.coles?.priceAud ?? null)} | ${esc(cName)} | ${pct} |`,
    );
  }

  const iso = new Date().toISOString();
  const qual =
    notes.length > 0
      ? notes.map((s) => `- ${s}`).join("\n")
      : "- (No automatic qualitative flags; mapping and search results looked unremarkable.)";

  const md = `# Reasi Price Validation Experiment

Run at: ${iso}

## Summary

- Ingredients tested: ${n}
- Successful matches: Woolies ${wooliesHits}, Coles ${colesHits}
- Average absolute % error of Reasi estimates vs cheaper real price: ${withError.length ? `${avgAbs.toFixed(1)}%` : "n/a (no prices)"}
- Ingredients where Reasi overestimated by >30%: ${over30}
- Ingredients where Reasi underestimated by >30%: ${under30}
- Ingredients where no match was found on either retailer: ${neither}

## Verdict

Based on average error:
- If avg error < 20%: "Reasi's estimates are accurate enough for v1. Real pricing is a nice-to-have, not urgent."
- If avg error 20-40%: "Reasi's estimates are in the right ballpark but noticeably off. Real pricing would meaningfully improve trust."
- If avg error > 40%: "Reasi's estimates are significantly wrong. Users will notice. Real pricing is important."

**Computed average absolute error:** ${withError.length ? `${avgAbs.toFixed(1)}%` : "n/a"}

**Verdict:** ${verdictBody}

## Detailed results

${tableLines.join("\n")}

## Qualitative notes

${qual}
`;

  const outPath = join(__dirname, "report.md");
  await writeFile(outPath, md, "utf8");
  console.log(`\nWrote ${outPath}`);
}

main().catch((e) => {
  console.error("Experiment failed:", e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
