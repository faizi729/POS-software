export type UploadValidationResult =
  | { ok: true; files: File[] }
  | { ok: false; error: string };

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf"
]);

export function validateUploads(params: {
  files: File[];
  maxFiles: number;
  maxBytesPerFile: number; // 5MB
  allowedMime?: Set<string>;
}) : UploadValidationResult {
  const allowed = params.allowedMime ?? ALLOWED_MIME;

  if (!params.files.length) return { ok: false, error: "No file uploaded." };
  if (params.files.length > params.maxFiles) return { ok: false, error: `Too many files (max ${params.maxFiles}).` };

  for (const f of params.files) {
    const size = typeof f.size === "number" ? f.size : 0;
    if (size <= 0) return { ok: false, error: "Empty file." };
    if (size > params.maxBytesPerFile) return { ok: false, error: "File too large (max 5MB)." };
    const type = String(f.type || "").toLowerCase();
    if (!allowed.has(type)) return { ok: false, error: "Invalid file type. Upload image or PDF only." };
  }

  return { ok: true, files: params.files };
}

