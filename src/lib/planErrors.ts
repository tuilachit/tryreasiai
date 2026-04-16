/**
 * Maps raw planner / OpenAI failures to short copy for the main app UI.
 * (The /test debug page shows the raw error instead.)
 */
export function userFacingMealPlanError(cause: string): string {
  const c = cause.toLowerCase();

  if (
    c.includes("openai_api_key") ||
    c.includes("api key") ||
    c.includes("incorrect api key") ||
    c.includes("invalid api key") ||
    c.includes("authentication") ||
    (c.includes("401") && c.includes("unauthorized"))
  ) {
    return "Planning isn’t available yet (OpenAI API key). If you run this site, add OPENAI_API_KEY in Vercel and redeploy.";
  }

  if (
    c.includes("429") ||
    c.includes("rate limit") ||
    c.includes("too many requests")
  ) {
    return "The planner is busy. Please wait a minute and try again.";
  }

  if (c.includes("insufficient_quota") || c.includes("billing")) {
    return "OpenAI billing or quota blocked the request. Check your OpenAI account.";
  }

  if (c.includes("model") && (c.includes("not found") || c.includes("does not exist"))) {
    return "The configured AI model isn’t available for this API key.";
  }

  return "Something went wrong. Please try again.";
}
