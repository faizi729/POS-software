import { ok, handleRouteError } from "@/lib/api/response";
import { getSession } from "@/lib/auth/get-session";
import { getMenuBuilderWorkspace } from "@/server/repositories/menu-builder-repository";

export async function GET() {
  try {
    const session = await getSession();
    const workspace = await getMenuBuilderWorkspace(session.restaurantId);
    console.log("[menu/builder][GET] workspace summary", workspace.summary);

    return ok(workspace);
  } catch (error) {
    console.error("[menu/builder][GET] failed", error);
    return handleRouteError(error);
  }
}
