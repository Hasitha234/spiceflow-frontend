/**
 * CENTRALIZED UTILITY:
 * This exact pluralization bug recurred independently on 4 different list pages
 * (Settings overview, Drivers, Suppliers, Products) with duplicate inline logic.
 * It has been consolidated here as the single source of truth for the codebase.
 * 
 * Correctly pluralizes a word based on the count.
 * 
 * @param count The number of items
 * @param singular The singular form of the word (e.g., "driver")
 * @param plural Optional plural form. If omitted, simply appends "s" to the singular form.
 * @returns The appropriate singular or plural string
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) {
    return singular;
  }
  return plural || `${singular}s`;
}
