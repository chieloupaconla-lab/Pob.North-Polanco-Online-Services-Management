export type FirebaseFailureKind =
  | "quota"
  | "unavailable"
  | "missing-index"
  | "permission"
  | "configuration"
  | "database"
  | "unknown";

function getErrorCode(error: unknown) {
  const code = (error as { code?: unknown })?.code;
  return typeof code === "number" || typeof code === "string" ? String(code) : "unknown";
}

export function getFirebaseFailureDetails(error: unknown) {
  const code = getErrorCode(error).toLowerCase();
  const message = error instanceof Error ? error.message : "";
  let kind: FirebaseFailureKind = "unknown";
  if (code === "8" || code === "resource-exhausted") kind = "quota";
  else if (code === "14" || code === "unavailable") kind = "unavailable";
  else if (code === "9" || code === "failed-precondition") kind = "missing-index";
  else if (code === "7" || code === "permission-denied") kind = "permission";
  else if (code === "configuration" || code === "firebase_admin_config_error") kind = "configuration";
  else if (/firebase admin|private key|service account|not configured/i.test(message)) kind = "configuration";
  else if (code !== "unknown") kind = "database";
  return { code, kind };
}

function getSafeFirebaseErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown Firebase error";
  return message
    .replace(/-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/gi, "[redacted-private-key]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-email]")
    .replace(/\bBearer\s+\S+/gi, "Bearer [redacted-token]")
    .replace(/\b(apiKey|privateKey|clientEmail|accessToken|token)\s*[:=]\s*\S+/gi, "$1=[redacted]")
    .slice(0, 500);
}

export function getFirebaseDiagnosticDetails(error: unknown) {
  const value = error as { name?: unknown };
  const { code, kind } = getFirebaseFailureDetails(error);
  return {
    code,
    kind,
    errorName: typeof value?.name === "string" ? value.name : "UnknownError",
    message: getSafeFirebaseErrorMessage(error),
  };
}

export function isFirebaseServiceUnavailable(error: unknown) {
  const { kind } = getFirebaseFailureDetails(error);
  return kind === "quota" || kind === "unavailable" || kind === "missing-index";
}
