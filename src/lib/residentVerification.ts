import { formatNameForDisplay } from "@/lib/nameUtils";
import { getCanonicalPurok } from "@/lib/purokConfig";

export const RESIDENT_VERIFICATION_VERSION = 1;

export function isResidentVerificationReady(data: { complete?: unknown; version?: unknown } | undefined) {
  return data?.complete === true && data.version === RESIDENT_VERIFICATION_VERSION;
}

const NAME_TOKEN_PATTERN = /[\p{L}\p{N}]+/gu;

export type ResidentNameConfidence = "HIGH_CONFIDENCE" | "MEDIUM_CONFIDENCE" | "LOW_CONFIDENCE";
export type ResidentVerificationStatus =
  | "HIGH_CONFIDENCE"
  | "MEDIUM_CONFIDENCE"
  | "LOW_CONFIDENCE"
  | "PUROK_MISMATCH"
  | "NEEDS_PUROK"
  | "NOT_FOUND";

export type ParsedResidentName = {
  lastName: string;
  firstName: string;
  middleName: string;
};

export type RegisteredResident = {
  fullName?: unknown;
  purok?: unknown;
  active?: unknown;
  archived?: unknown;
};

export type ResidentIdentityResult = {
  status: ResidentVerificationStatus;
  verified: boolean;
  nameConfidence: ResidentNameConfidence;
};

export function parseResidentName(value: string): ParsedResidentName | null {
  const parts = value.split(",").map((part) => part.trim());
  if (parts.length < 2 || parts.length > 3 || parts.some((part) => !part)) return null;
  return {
    lastName: parts[0],
    firstName: parts[1],
    middleName: parts[2] || "",
  };
}

export function isStandardResidentName(value: string) {
  return parseResidentName(value) !== null;
}

export function formatResidentNameForStorage(value: string) {
  const parsed = parseResidentName(value);
  if (!parsed) return "";
  return [parsed.lastName, parsed.firstName, parsed.middleName]
    .filter(Boolean)
    .map((part) => formatNameForDisplay(part))
    .join(", ");
}

export function formatResidentNameForDisplay(value: string) {
  const parsed = parseResidentName(value);
  if (!parsed) return formatNameForDisplay(value);
  return formatNameForDisplay([parsed.firstName, parsed.middleName, parsed.lastName].filter(Boolean).join(" "));
}

function normalizeNameTokens(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[.'’`-]+/gu, " ")
    .match(NAME_TOKEN_PATTERN) || [];
}

export function normalizeResidentName(value: string) {
  return normalizeNameTokens(value).join(" ");
}

function exactSubsequence(shorter: string[], longer: string[]) {
  if (shorter.length === 0) return true;
  let index = 0;
  for (const token of longer) {
    if (token === shorter[index]) index += 1;
    if (index === shorter.length) return true;
  }
  return false;
}

export function matchesResidentNameParts(enteredName: string, registeredName: string) {
  const entered = normalizeNameTokens(enteredName);
  const registered = parsedNameTokens(registeredName);
  if (entered.length < 2 || !registered.first.length || !registered.last.length) return false;

  const enteredFirst = entered[0];
  const enteredSurname = entered[entered.length - 1];
  const registeredFirst = registered.first[0];
  const registeredSurname = registered.last[registered.last.length - 1];
  if (enteredFirst !== registeredFirst || enteredSurname !== registeredSurname) return false;

  return exactSubsequence(entered.slice(1, -1), [
    ...registered.first.slice(1),
    ...registered.middle,
  ]);
}

export function normalizeResidentNameForDuplicateCheck(value: string) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .trim()
    .replace(/\s*,\s*/gu, ", ")
    .replace(/\s+/gu, " ");
}

export function isDuplicateResidentName(enteredName: string, registeredName: string) {
  return normalizeResidentNameForDuplicateCheck(enteredName) ===
    normalizeResidentNameForDuplicateCheck(registeredName);
}

function parsedNameTokens(value: string) {
  const parsed = parseResidentName(value);
  if (parsed) {
    return {
      standard: true,
      last: normalizeNameTokens(parsed.lastName),
      first: normalizeNameTokens(parsed.firstName),
      middle: normalizeNameTokens(parsed.middleName),
    };
  }

  const tokens = normalizeNameTokens(value);
  return {
    standard: false,
    last: tokens.length > 0 ? [tokens[tokens.length - 1] || ""] : [],
    first: tokens.length > 0 ? [tokens[0] || ""] : [],
    middle: tokens.slice(1, -1),
  };
}

export function getResidentNameSearchParts(value: string) {
  const parsed = parsedNameTokens(value);
  return {
    firstName: parsed.first[0] || "",
    surname: parsed.last[parsed.last.length - 1] || "",
    tokens: normalizeNameTokens(value),
  };
}

export function getResidentVerificationFields(fullName: string, purokNormalized: string) {
  const { firstName, surname, tokens } = getResidentNameSearchParts(fullName);
  return {
    verificationFirstName: firstName,
    verificationSurname: surname,
    verificationNameTokens: tokens,
    verificationNameVersion: RESIDENT_VERIFICATION_VERSION,
    purokNormalized,
  };
}

function compareLegacyAndStandardName(entered: ReturnType<typeof parsedNameTokens>, registered: ReturnType<typeof parsedNameTokens>) {
  const standard = entered.standard ? entered : registered;
  const legacy = entered.standard ? registered : entered;
  const first = tokenMatch(standard.first[0] || "", legacy.first[0] || "");
  const last = sequenceMatch(standard.last, legacy.last);
  const standardMiddle = standard.middle;
  const standardFirstRemainder = standard.first.slice(1);
  const legacyMiddle = legacy.middle;
  const middle = entered.standard
    ? isSubsequence([...standardFirstRemainder, ...standardMiddle], legacyMiddle)
    : isSubsequence(legacyMiddle, [...standardFirstRemainder, ...standardMiddle]);

  if (!first.matches || !last.matches || !middle.matches || middle.typoCount > 1) {
    return { confidence: "LOW_CONFIDENCE" as const };
  }
  const typoCount = Number(!first.exact) + last.typoCount + middle.typoCount;
  return { confidence: typoCount <= 1 ? "HIGH_CONFIDENCE" as const : "MEDIUM_CONFIDENCE" as const };
}

function levenshteinDistance(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 0; leftIndex < left.length; leftIndex += 1) {
    const current = [leftIndex + 1];
    for (let rightIndex = 0; rightIndex < right.length; rightIndex += 1) {
      current.push(
        Math.min(
          current[rightIndex] + 1,
          previous[rightIndex + 1] + 1,
          previous[rightIndex] + (left[leftIndex] === right[rightIndex] ? 0 : 1),
        ),
      );
    }
    for (let index = 0; index < current.length; index += 1) previous[index] = current[index];
  }
  return previous[right.length];
}

function tokenMatch(left: string, right: string) {
  if (left === right) return { matches: true, exact: true };
  return {
    matches: Math.min(left.length, right.length) >= 3 && levenshteinDistance(left, right) === 1,
    exact: false,
  };
}

function sequenceMatch(left: string[], right: string[]) {
  if (left.length !== right.length || left.length === 0) return { matches: false, typoCount: 0 };
  let typoCount = 0;
  for (let index = 0; index < left.length; index += 1) {
    const result = tokenMatch(left[index], right[index]);
    if (!result.matches) return { matches: false, typoCount };
    if (!result.exact) typoCount += 1;
  }
  return { matches: true, typoCount };
}

function isSubsequence(shorter: string[], longer: string[]) {
  let shorterIndex = 0;
  let typoCount = 0;
  for (const token of longer) {
    if (shorterIndex >= shorter.length) break;
    const result = tokenMatch(shorter[shorterIndex], token);
    if (!result.matches) continue;
    if (!result.exact) typoCount += 1;
    shorterIndex += 1;
  }
  return { matches: shorterIndex === shorter.length, typoCount };
}

function compareNameParts(enteredName: string, registeredName: string) {
  const entered = parsedNameTokens(enteredName);
  const registered = parsedNameTokens(registeredName);
  if (!entered.first.length || !entered.last.length || !registered.first.length || !registered.last.length) {
    return { confidence: "LOW_CONFIDENCE" as const };
  }
  if (entered.standard !== registered.standard) return compareLegacyAndStandardName(entered, registered);

  const first = sequenceMatch(entered.first, registered.first);
  const last = sequenceMatch(entered.last, registered.last);
  if (!first.matches || !last.matches) return { confidence: "LOW_CONFIDENCE" as const };

  const middleDifference = registered.middle.length - entered.middle.length;
  let middleMatches = false;
  let middleTypos = 0;
  if (middleDifference >= 0) {
    const result = isSubsequence(entered.middle, registered.middle);
    middleMatches = result.matches;
    middleTypos = result.typoCount;
  } else if (middleDifference === -1) {
    const result = isSubsequence(registered.middle, entered.middle);
    middleMatches = result.matches;
    middleTypos = result.typoCount;
  }

  if (!middleMatches || middleTypos > 1) return { confidence: "MEDIUM_CONFIDENCE" as const };
  const typoCount = first.typoCount + last.typoCount + middleTypos;
  return { confidence: typoCount <= 1 ? "HIGH_CONFIDENCE" as const : "MEDIUM_CONFIDENCE" as const };
}

export function compareResidentNames(enteredName: string, registeredName: string) {
  return compareNameParts(enteredName, registeredName);
}

export function verifyResidentIdentity(
  enteredName: string,
  enteredPurok: string,
  registeredResident: RegisteredResident,
): ResidentIdentityResult {
  const nameConfidence = compareNameParts(enteredName, typeof registeredResident.fullName === "string" ? registeredResident.fullName : "").confidence;
  const registeredPurok = typeof registeredResident.purok === "string" ? registeredResident.purok : "";
  const canonicalEnteredPurok = getCanonicalPurok(enteredPurok);
  const canonicalRegisteredPurok = getCanonicalPurok(registeredPurok);
  if (!canonicalEnteredPurok) return { status: "PUROK_MISMATCH", verified: false, nameConfidence };
  if (!registeredPurok) return { status: "NEEDS_PUROK", verified: false, nameConfidence };
  if (!canonicalRegisteredPurok || canonicalRegisteredPurok !== canonicalEnteredPurok) return { status: "PUROK_MISMATCH", verified: false, nameConfidence };
  if (nameConfidence === "HIGH_CONFIDENCE") return { status: nameConfidence, verified: true, nameConfidence };
  return { status: nameConfidence, verified: false, nameConfidence };
}
