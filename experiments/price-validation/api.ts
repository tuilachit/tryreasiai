/**
 * RapidAPI Woolworths / Coles product search.
 *
 * Data Holdings Woolworths / Coles “Product Search” on RapidAPI (verified shape):
 *   GET https://{WOOLIES_API_HOST}/woolworths/product-search?page=1&page_size=5&query=...
 *   GET https://{COLES_API_HOST}/coles/product-search?page=1&page_size=5&query=...
 * Use COLES_API_HOST=coles-product-price-api.p.rapidapi.com (not coles-product-api).
 *
 * Response: tries common container keys (Products, products, data, results, items) and
 * common field names for name/price/brand/size/url — see mapItemToResult.
 *
 * Load env from experiments/price-validation/.env in index.ts before importing this module.
 */

export type ProductResult = {
  retailer: "Woolworths" | "Coles";
  name: string;
  brand?: string;
  priceAud: number;
  size?: string;
  productUrl?: string;
};

const WOOLIES_SEARCH_PATH = "/woolworths/product-search";
const COLES_SEARCH_PATH = "/coles/product-search";

function buildProductSearchParams(query: string): URLSearchParams {
  const p = new URLSearchParams();
  p.set("page", "1");
  p.set("page_size", "5");
  p.set("query", query);
  return p;
}

let loggedWooliesRaw = false;
let loggedColesRaw = false;
let loggedMissingKey = false;

function getKey(): string | undefined {
  const k = process.env.RAPIDAPI_KEY;
  if (!k?.trim() && !loggedMissingKey) {
    loggedMissingKey = true;
    console.error(
      "[RapidAPI] RAPIDAPI_KEY is empty or unset — set it in experiments/price-validation/.env. All searches will return null until then.",
    );
  }
  return k;
}

function getWooliesHost(): string | undefined {
  return process.env.WOOLIES_API_HOST;
}

function getColesHost(): string | undefined {
  return process.env.COLES_API_HOST;
}

function parsePrice(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.]/g, "");
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function pickString(
  o: Record<string, unknown>,
  keys: string[],
): string | undefined {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function pickPriceFromObject(o: Record<string, unknown>): number | null {
  const keys = [
    "current_price",
    "Price",
    "price",
    "CurrentPrice",
    "SalePrice",
    "DisplayPrice",
    "NowPrice",
    "ListPrice",
    "UnitPrice",
    "CupPrice",
  ];
  for (const k of keys) {
    const p = parsePrice(o[k]);
    if (p !== null) return p;
  }
  return null;
}

function extractProductArray(data: unknown): unknown[] {
  if (!data || typeof data !== "object") return [];
  if (Array.isArray(data)) return data;
  const o = data as Record<string, unknown>;
  const containerKeys = [
    "Products",
    "products",
    "data",
    "Data",
    "results",
    "Results",
    "items",
    "Items",
    "searchResults",
    "SearchResults",
  ];
  for (const k of containerKeys) {
    const v = o[k];
    if (Array.isArray(v)) return v;
  }
  for (const v of Object.values(o)) {
    if (Array.isArray(v) && v.length > 0 && v[0] && typeof v[0] === "object") {
      return v;
    }
  }
  return [];
}

function logRawSample(
  retailer: string,
  data: unknown,
  firstProduct: unknown,
): void {
  const topKeys =
    data && typeof data === "object" && !Array.isArray(data)
      ? Object.keys(data as object).join(", ")
      : "(not an object)";
  console.log(`[${retailer}] First successful response — top-level keys: ${topKeys}`);
  const sample = JSON.stringify(firstProduct, null, 2);
  console.log(
    `[${retailer}] First product object (truncated):\n${sample.length > 6000 ? `${sample.slice(0, 6000)}\n… (truncated)` : sample}`,
  );
}

function mapItemToResult(
  item: unknown,
  retailer: ProductResult["retailer"],
): ProductResult | null {
  if (!item || typeof item !== "object") return null;
  const o = item as Record<string, unknown>;

  const name = pickString(o, [
    "product_name",
    "DisplayName",
    "Name",
    "name",
    "title",
    "productName",
    "ProductName",
    "Description",
    "description",
  ]);

  let price = pickPriceFromObject(o);
  if (price === null) {
    const nested = o["Product"] ?? o["product"] ?? o["Details"];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      price = pickPriceFromObject(nested as Record<string, unknown>);
    }
  }

  if (!name || price === null) return null;

  const brand = pickString(o, [
    "product_brand",
    "Brand",
    "brand",
    "BrandName",
    "brandName",
  ]);
  const size = pickString(o, [
    "product_size",
    "PackageSize",
    "size",
    "packageSize",
    "PackSize",
    "CupMeasure",
    "Package",
  ]);
  const productUrl = pickString(o, [
    "url",
    "Url",
    "ProductUrl",
    "link",
    "ProductPageUrl",
    "ProductUrlPath",
  ]);

  return {
    retailer,
    name,
    brand,
    priceAud: price,
    size,
    productUrl,
  };
}

async function searchRetailer(
  host: string | undefined,
  query: string,
  retailer: ProductResult["retailer"],
  path: string,
  logFirstRaw: () => boolean,
  markLogged: () => void,
): Promise<ProductResult[] | null> {
  const key = getKey();
  if (!key?.trim()) {
    return null;
  }
  if (!host?.trim()) {
    console.error(`[${retailer}] Missing API host in environment.`);
    return null;
  }

  const h = host.trim();
  const params = buildProductSearchParams(query);
  const url = `https://${h}${path}?${params.toString()}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": key.trim(),
        "X-RapidAPI-Host": h,
      },
    });

    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      console.error(
        `[${retailer}] Non-JSON response (HTTP ${res.status}):`,
        text.slice(0, 300),
      );
      return null;
    }

    if (!res.ok) {
      console.error(
        `[${retailer}] HTTP ${res.status}:`,
        typeof data === "object" ? JSON.stringify(data).slice(0, 500) : text.slice(0, 500),
      );
      return null;
    }

    const products = extractProductArray(data);
    if (products.length === 0) {
      const keys =
        data && typeof data === "object" && !Array.isArray(data)
          ? Object.keys(data as object).join(", ")
          : "n/a";
      console.warn(
        `[${retailer}] Empty or unrecognised product list for "${query}" (top-level keys: ${keys})`,
      );
      return null;
    }

    if (logFirstRaw()) {
      markLogged();
      logRawSample(retailer, data, products[0]);
    }

    const mapped: ProductResult[] = [];
    for (const p of products) {
      const r = mapItemToResult(p, retailer);
      if (r) mapped.push(r);
    }

    if (mapped.length === 0) {
      console.warn(
        `[${retailer}] Parsed ${products.length} raw rows but none mapped to name+price for "${query}"`,
      );
      return null;
    }

    return mapped;
  } catch (e) {
    console.error(
      `[${retailer}] Request failed:`,
      e instanceof Error ? e.message : e,
    );
    return null;
  }
}

export async function searchWoolworths(
  query: string,
): Promise<ProductResult[] | null> {
  return searchRetailer(
    getWooliesHost(),
    query,
    "Woolworths",
    WOOLIES_SEARCH_PATH,
    () => !loggedWooliesRaw,
    () => {
      loggedWooliesRaw = true;
    },
  );
}

export async function searchColes(query: string): Promise<ProductResult[] | null> {
  return searchRetailer(
    getColesHost(),
    query,
    "Coles",
    COLES_SEARCH_PATH,
    () => !loggedColesRaw,
    () => {
      loggedColesRaw = true;
    },
  );
}
