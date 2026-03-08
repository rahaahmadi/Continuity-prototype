/** Document classification labels (from backend). Shown in Camel Case in the UI. */
export const DOCUMENT_LABELS = [
  "CORPORATE STRUCTURE & GOVERNANCE",
  "FINANCIAL INFORMATION",
  "CUSTOMERS & SALES",
  "PRODUCTS & SERVICES",
  "OPERATIONS & FACILITIES",
  "HUMAN RESOURCES & EMPLOYEES",
  "LEGAL & COMPLIANCE",
  "SUPPLIERS & VENDORS",
  "COMPETITIVE & MARKET POSITION",
  "GROWTH & STRATEGY",
] as const;

export type DocumentLabel = (typeof DOCUMENT_LABELS)[number];

/** Convert backend label to Camel Case for display (e.g. "FINANCIAL INFORMATION" → "Financial Information"). */
export function labelToCamelCase(label: string): string {
  return label
    .toLowerCase()
    .split(/\s+/)
    .map((word) => (word === "&" ? "&" : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(" ");
}
