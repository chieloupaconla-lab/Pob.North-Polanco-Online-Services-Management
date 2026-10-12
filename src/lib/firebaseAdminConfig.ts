const PEM_HEADER = "-----BEGIN PRIVATE KEY-----";
const PEM_FOOTER = "-----END PRIVATE KEY-----";
const MIN_PLAUSIBLE_PRIVATE_KEY_LENGTH = 100;

export class FirebaseAdminPrivateKeyError extends Error {
  code = "firebase-admin-private-key-malformed";

  constructor() {
    super(
      "Firebase Admin private key is malformed: expected a complete PEM private key with the standard header and footer. Check FIREBASE_ADMIN_PRIVATE_KEY."
    );
    this.name = "FirebaseAdminPrivateKeyError";
  }
}

function removeMatchingSurroundingQuotes(value: string): string {
  const trimmed = value.trim();
  const firstCharacter = trimmed[0];
  const lastCharacter = trimmed[trimmed.length - 1];
  const isQuote = firstCharacter === '"' || firstCharacter === "'";

  if (isQuote) {
    if (lastCharacter !== firstCharacter) {
      throw new FirebaseAdminPrivateKeyError();
    }
    return trimmed.slice(1, -1).trim();
  }

  if (lastCharacter === '"' || lastCharacter === "'") {
    throw new FirebaseAdminPrivateKeyError();
  }

  return trimmed;
}

export function normalizePrivateKey(value: string): string {
  let normalized = removeMatchingSurroundingQuotes(value)
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n?/g, "\n")
    .trim();

  const hasExpectedBoundaries =
    normalized.startsWith(PEM_HEADER) && normalized.endsWith(PEM_FOOTER);
  const body = normalized.slice(PEM_HEADER.length, -PEM_FOOTER.length).trim();
  const bodyWithoutWhitespace = body.replace(/\s/g, "");

  if (
    !hasExpectedBoundaries ||
    !normalized.includes("\n") ||
    !bodyWithoutWhitespace ||
    !/^[A-Za-z0-9+/=]+$/.test(bodyWithoutWhitespace) ||
    normalized.length < MIN_PLAUSIBLE_PRIVATE_KEY_LENGTH
  ) {
    throw new FirebaseAdminPrivateKeyError();
  }

  return normalized;
}

export function getPrivateKeyDiagnostics(rawValue: string): {
  present: boolean;
  rawLength: number;
  normalizedLength: number;
  rawStartsWithPemHeader: boolean;
  rawEndsWithPemFooter: boolean;
  containsLiteralEscapedNewline: boolean;
  containsActualNewline: boolean;
  normalizedStartsWithPemHeader: boolean;
  normalizedEndsWithPemFooter: boolean;
} {
  let normalized = "";

  try {
    normalized = normalizePrivateKey(rawValue);
  } catch {
    try {
      normalized = removeMatchingSurroundingQuotes(rawValue)
        .replace(/\\r\\n/g, "\n")
        .replace(/\\n/g, "\n")
        .replace(/\r\n?/g, "\n")
        .trim();
    } catch {
      normalized = "";
    }
  }

  return {
    present: rawValue.length > 0,
    rawLength: rawValue.length,
    normalizedLength: normalized.length,
    rawStartsWithPemHeader: rawValue.trim().startsWith(PEM_HEADER),
    rawEndsWithPemFooter: rawValue.trim().endsWith(PEM_FOOTER),
    containsLiteralEscapedNewline: rawValue.includes("\\n"),
    containsActualNewline: /\r|\n/.test(rawValue),
    normalizedStartsWithPemHeader: normalized.startsWith(PEM_HEADER),
    normalizedEndsWithPemFooter: normalized.endsWith(PEM_FOOTER),
  };
}
