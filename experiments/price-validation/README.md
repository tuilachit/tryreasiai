# Reasi price validation (one-off experiment)

Compares hardcoded **Reasi-style** ingredient price estimates against live **Woolworths** and **Coles** search results via RapidAPI. Output is a console log plus `report.md` in this folder.

This is **not** part of the Reasi app (`src/` is untouched). Dependencies live only in this directory.

## Setup

```bash
cd experiments/price-validation
npm install
cp .env.example .env
# Edit .env: set RAPIDAPI_KEY (from RapidAPI dashboard after subscribing to both APIs)
```

## Run

```bash
npm run run
```

(`package.json` defines the script name as `run`, so the full npm invocation is `npm run run`.)

## Interpreting results

- **Console:** progress per ingredient (`[n/30] … Woolies: $…, Coles: $…`). On the first successful response per retailer, a **raw JSON sample** is printed so you can align `api.ts` field mapping with the real payload.
- **`report.md`:** summary stats, automatic verdict band (based on average absolute % error vs the **cheaper** of the two retailers), a table sorted by worst mismatch first, and heuristic qualitative notes (possible wrong product name, one retailer only, large price spread).

## If everything is `—` or HTTP errors

1. Confirm `RAPIDAPI_KEY` and hosts in `.env`. **Coles** must use `coles-product-price-api.p.rapidapi.com` (same family as Woolworths Product Search); `coles-product-api` is a different product and will fail.
2. In the RapidAPI playground, use **GET Product Search**, not **GET Price Changes** (Price Changes is for daily price deltas and needs `date` in `yyyy-mm-dd`).
3. If paths change on the hub, edit `WOOLIES_SEARCH_PATH`, `COLES_SEARCH_PATH`, and `buildProductSearchParams()` in `api.ts`.
4. Re-run and use the logged raw sample to adjust `mapItemToResult` field lists if needed.

## Git

This folder’s `.gitignore` ignores `node_modules/`, `.env`, and generated `report.md`.
