import { ok } from "@/lib/api/response";
import { getSession } from "@/lib/auth/get-session";
import { updateMenuItemAvailability } from "@/server/repositories/mongo-repository";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await getSession();
  const item = await updateMenuItemAvailability(id, session.restaurantId);

  return ok({
    id: item.id,
    isAvailable: item.isAvailable
  });
}
