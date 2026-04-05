import { ok, handleRouteError } from "@/lib/api/response";
import { getSession } from "@/lib/auth/get-session";
import { generateSuggestions } from "@/server/services/ai-engine";

/**
 * GET /api/ai/suggestions
 * Returns AI-generated actionable suggestions based on orders, inventory, and customer data
 */
export async function GET() {
  try {
    const session = await getSession();
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
