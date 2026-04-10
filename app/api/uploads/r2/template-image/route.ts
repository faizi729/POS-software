import { NextRequest } from "next/server";

import { ok } from "@/lib/api/response";
import { withAuth } from "@/lib/auth/with-auth";
import { presignR2PutObject } from "@/lib/r2/presign";

function safeExtFromContentType(contentType: string) {
  const ct = String(contentType || "").toLowerCase();
  if (ct === "image/png") return "png";
  if (ct === "image/webp") return "webp";
  if (ct === "image/jpeg" || ct === "image/jpg") return "jpg";
  return "bin";
}

export async function POST(request: NextRequest) {
  return withAuth<any>(["owner", "manager"], async (req, _ctx, session) => {
    const body = await req.json().catch(() => ({}));
    const templateSlug = String(body?.templateSlug || "").trim();
    const field = String(body?.field || "").trim() || "image";
    const contentType = String(body?.contentType || "").trim();
    if (!templateSlug) throw new Error("Missing templateSlug");
    if (!contentType.startsWith("image/")) throw new Error("Only image uploads are allowed");

    const ext = safeExtFromContentType(contentType);
    const safeField = field.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || "image";
    const key = `tenants/${session.restaurantId}/templates/${templateSlug}/${safeField}/${Date.now()}.${ext}`;

    const signed = await presignR2PutObject({
      key,
      contentType,
      cacheControl: "public, max-age=31536000, immutable",
      expiresInSeconds: 60 * 5
    });

    return ok({
      uploadUrl: signed.uploadUrl,
      publicUrl: signed.publicUrl,
      key: signed.key
    });
  })(request, {} as any);
}

