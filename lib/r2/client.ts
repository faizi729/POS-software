import { S3Client } from "@aws-sdk/client-s3";

function required(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name} env var`);
  return v;
}

export function getR2PublicBaseUrl() {
  return (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/+$/, "");
}

export function getR2Bucket() {
  return required("R2_BUCKET");
}

export function getR2Client() {
  const accountId = required("R2_ACCOUNT_ID");
  const accessKeyId = required("R2_ACCESS_KEY_ID");
  const secretAccessKey = required("R2_SECRET_ACCESS_KEY");

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey }
  });
}

