export const DOCUMENT_TYPES = [
  "Barangay Clearance",
  "Certificate of Residency",
  "Barangay Business Clearance",
  "Community Tax Certificate (Cedula)",
] as const;

export type CurrentDocumentType = (typeof DOCUMENT_TYPES)[number];

export function isCurrentDocumentType(
  value: string
): value is CurrentDocumentType {
  return DOCUMENT_TYPES.includes(value as CurrentDocumentType);
}
