import {
  formatResidentNameForStorage,
  normalizeResidentNameForDuplicateCheck,
} from "@/lib/residentVerification";
import {
  getCanonicalPurok,
  normalizePurokForSearch,
} from "@/lib/purokConfig";

export const RESIDENT_IMPORT_HEADERS = [
  "fullName",
  "purok",
  "active",
  "archived",
] as const;

export const MAX_RESIDENT_IMPORT_RECORDS = 500;
export const MAX_RESIDENT_IMPORT_BYTES = 1024 * 1024;

export type ResidentImportRecord = {
  rowNumber: number;
  fullName: string;
  purok: string;
  active: boolean;
  archived: boolean;
};

export type ResidentImportIssue = {
  rowNumber: number;
  message: string;
};

export type ResidentImportValidation = {
  validRecords: ResidentImportRecord[];
  invalidRows: ResidentImportIssue[];
  duplicateRows: ResidentImportIssue[];
};

function parseCsvRecords(csv: string) {
  const records: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    const nextCharacter = csv[index + 1];

    if (quoted) {
      if (character === '"' && nextCharacter === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"' && field.length === 0) {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && nextCharacter === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.trim())) records.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error("The CSV contains an unterminated quoted field.");

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((value) => value.trim())) records.push(row);
  }

  return records;
}

function parseBoolean(value: unknown, defaultValue: boolean) {
  if (value === undefined || value === "") return defaultValue;
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return null;
}

function getDuplicateKey(fullName: string, purok: string) {
  return `${normalizeResidentNameForDuplicateCheck(fullName)}|${normalizePurokForSearch(purok)}`;
}

export function validateResidentImportRecords(records: unknown[]): ResidentImportValidation {
  const validRecords: ResidentImportRecord[] = [];
  const invalidRows: ResidentImportIssue[] = [];
  const duplicateRows: ResidentImportIssue[] = [];
  const seenKeys = new Set<string>();

  records.forEach((value, index) => {
    const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
    const rowNumber = typeof input.rowNumber === "number" && Number.isInteger(input.rowNumber)
      ? input.rowNumber
      : index + 2;
    const fullNameInput = typeof input.fullName === "string" ? input.fullName.trim() : "";
    const purokInput = typeof input.purok === "string" ? input.purok.trim() : "";
    const fullName = formatResidentNameForStorage(fullNameInput);
    const purok = getCanonicalPurok(purokInput);
    const active = parseBoolean(input.active, true);
    const archived = parseBoolean(input.archived, false);
    const problems: string[] = [];

    if (!fullName) problems.push("Full name must use Last Name, First Name, Middle Name format.");
    if (!purok) problems.push("Purok must be one of the four official Puroks.");
    if (active === null) problems.push("Active must be true or false.");
    if (archived === null) problems.push("Archived must be true or false.");

    if (problems.length > 0) {
      invalidRows.push({ rowNumber, message: problems.join(" ") });
      return;
    }

    const record = {
      rowNumber,
      fullName,
      purok: purok as string,
      active: active as boolean,
      archived: archived as boolean,
    };
    const key = getDuplicateKey(record.fullName, record.purok);
    if (seenKeys.has(key)) {
      duplicateRows.push({ rowNumber, message: "Duplicate resident name and Purok in this file." });
      return;
    }
    seenKeys.add(key);
    validRecords.push(record);
  });

  return { validRecords, invalidRows, duplicateRows };
}

export function parseResidentCsv(csv: string): ResidentImportValidation {
  if (new TextEncoder().encode(csv).byteLength > MAX_RESIDENT_IMPORT_BYTES) {
    return {
      validRecords: [],
      invalidRows: [{ rowNumber: 1, message: "CSV file must be 1 MB or smaller." }],
      duplicateRows: [],
    };
  }

  let records: string[][];
  try {
    records = parseCsvRecords(csv);
  } catch (error) {
    return {
      validRecords: [],
      invalidRows: [{ rowNumber: 1, message: error instanceof Error ? error.message : "Invalid CSV format." }],
      duplicateRows: [],
    };
  }

  if (records.length === 0) {
    return { validRecords: [], invalidRows: [{ rowNumber: 1, message: "The CSV file is empty." }], duplicateRows: [] };
  }

  const headers = records[0].map((header) => header.trim().replace(/^\uFEFF/, ""));
  if (headers.length !== RESIDENT_IMPORT_HEADERS.length || headers.some((header, index) => header !== RESIDENT_IMPORT_HEADERS[index])) {
    return {
      validRecords: [],
      invalidRows: [{ rowNumber: 1, message: `Headers must be exactly: ${RESIDENT_IMPORT_HEADERS.join(", ")}.` }],
      duplicateRows: [],
    };
  }

  if (records.length - 1 > MAX_RESIDENT_IMPORT_RECORDS) {
    return {
      validRecords: [],
      invalidRows: [{ rowNumber: 1, message: `Import cannot contain more than ${MAX_RESIDENT_IMPORT_RECORDS} residents.` }],
      duplicateRows: [],
    };
  }

  return validateResidentImportRecords(records.slice(1).map((values, index) => ({
    rowNumber: index + 2,
    fullName: values[0] || "",
    purok: values[1] || "",
    active: values[2] || "",
    archived: values[3] || "",
  })));
}

export function getResidentImportDuplicateKey(fullName: string, purok: string) {
  return getDuplicateKey(fullName, purok);
}
