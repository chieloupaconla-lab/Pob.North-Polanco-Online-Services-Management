export const OFFICIAL_PUROKS = [
  "Purok Bonifacio",
  "Purok Rizal",
  "Purok Lapu-Lapu",
  "Purok Quezon",
] as const;

export type OfficialPurok = (typeof OFFICIAL_PUROKS)[number];

export function isOfficialPurok(value: string): value is OfficialPurok {
  return (OFFICIAL_PUROKS as readonly string[]).includes(value);
}

export function getCanonicalPurok(value: string) {
  const normalized = value
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .trim()
    .replace(/\s+/gu, " ")
    .replace(/\s*-\s*/gu, "-");

  return OFFICIAL_PUROKS.find(
    (purok) => purok.toLocaleLowerCase("en") === normalized
  ) || null;
}

export function normalizePurokForSearch(value: string) {
  const canonical = getCanonicalPurok(value);
  return canonical?.toLocaleLowerCase("en") || "";
}

export function getStoredPurok(data: { purok?: unknown; purokStreet?: unknown }) {
  return typeof data.purok === "string"
    ? data.purok
    : typeof data.purokStreet === "string"
      ? data.purokStreet
      : "";
}
