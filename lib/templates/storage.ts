export function getTemplateStorageKey(templateSlug: string, restaurantId?: string | null) {
  const slug = String(templateSlug || "").trim();
  const rid = String(restaurantId || "").trim();
  if (!slug) return "__pos_tpl_unknown";
  // Scoped per restaurant to avoid cross-tenant leakage on same origin (localhost/dev).
  if (rid) return `__pos_tpl_${slug}__rid_${rid}`;
  // Back-compat (old global key)
  return `__pos_tpl_${slug}`;
}

