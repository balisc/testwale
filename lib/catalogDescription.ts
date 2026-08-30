const GENERIC_MODULE_DESCRIPTION = /^(?:.+\s+)?(?:mcq\s+)?course\s+module\.?$/i;

/** Removes known import boilerplate while preserving authored bilingual copy. */
export function meaningfulCatalogDescription(value: string | null | undefined): string | null {
  const normalized = String(value ?? '').trim().replace(/\s+/g, ' ');
  if (!normalized || GENERIC_MODULE_DESCRIPTION.test(normalized)) return null;
  return normalized;
}
