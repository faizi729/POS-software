import { NextRequest } from "next/server";
import { ok, handleRouteError } from "@/lib/api/response";
import { assertRole, requireSession } from "@/lib/auth/guards";
import { generateSuggestions } from "@/server/services/ai-engine";
import { fail } from "@/lib/api/response";
import { getClientIp, rateLimit } from "@/lib/middleware/rate-limit";

/**
 * GET /api/ai/suggestions
 * Returns AI-generated actionable suggestions based on orders, inventory, and customer data
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limit (AI endpoints are high abuse risk)
    const rl = await rateLimit({
      request,
      keyParts: ["ai-suggestions", getClientIp(request)],
      limit: 30,
      windowMs: 60_000,
      onHit: () => console.warn("[rate-limit] /api/ai/suggestions")
    });
    if (!rl.ok) return fail("Too many requests. Try again soon.", 429);

    const session = await requireSession();
    assertRole(session, ["owner", "manager"]);
    const suggestions = await generateSuggestions(session.restaurantId);

    return ok({
      suggestions,
      total: suggestions.length,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
