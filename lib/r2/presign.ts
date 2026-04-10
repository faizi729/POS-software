import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { getR2Bucket, getR2Client, getR2PublicBaseUrl } from "@/lib/r2/client";

export async function presignR2PutObject(opts: {
  key: string;
  contentType: string;
  cacheControl?: string;
  expiresInSeconds?: number;
}) {
  const bucket = getR2Bucket();
  const client = getR2Client();
  const expiresIn = Math.min(60 * 10, Math.max(30, opts.expiresInSeconds ?? 60 * 5)); // 30s..10m

  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: opts.key,
    ContentType: opts.contentType,
    CacheControl: opts.cacheControl ?? "public, max-age=31536000, immutable"
  });

  const uploadUrl = await getSignedUrl(client, cmd, { expiresIn });
  const base = getR2PublicBaseUrl();
  const publicUrl = base ? `${base}/${opts.key}` : "";

  return { uploadUrl, publicUrl, key: opts.key, bucket };
}

