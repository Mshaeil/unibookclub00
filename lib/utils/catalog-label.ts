/** Map catalog row (name_ar/name_en) to display label for forms. */
export function catalogLabel(
  row: { name_ar?: string | null; name_en?: string | null; name?: string | null },
  language: "ar" | "en" = "ar",
): string {
  if (language === "ar") return row.name_ar ?? row.name ?? row.name_en ?? "-"
  return row.name_en ?? row.name ?? row.name_ar ?? "-"
}

export function mapCatalogForForm<
  T extends { name_ar?: string | null; name_en?: string | null; name?: string | null },
>(rows: T[] | null | undefined, language: "ar" | "en" = "ar"): (T & { name: string })[] {
  return (rows || []).map((r) => ({ ...r, name: catalogLabel(r, language) }))
}
