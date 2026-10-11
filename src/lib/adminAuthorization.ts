
import type { DecodedIdToken } from "firebase-admin/auth";
import {
  cert,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import {
  getFirestore,
  type Firestore,
} from "firebase-admin/firestore";

const PEM_HEADER = "-----BEGIN PRIVATE KEY-----";
const PEM_FOOTER = "-----END PRIVATE KEY-----";
const FIREBASE_EMULATOR_PROJECT_ID = "e-barangay-system-427d0";

const useFirebaseEmulators =
  process.env.NODE_ENV === "development" &&
  process.env.FIREBASE_USE_EMULATORS === "true";

export type AdminTokenVerification = {
  admin: DecodedIdToken | null;
  tokenPresent: boolean;
  tokenVerified: boolean;
  hasAdminClaim: boolean;
  adminRecordFound: boolean;
  adminRecordActive: boolean;
  adminRoleValid: boolean;
  firebaseAdminConfigPresent: boolean;
  error?: {
    name: string;
    code?: string;
    message?: string;
  };
};

type AdminProfile = {
  role?: unknown;
  active?: unknown;
};

function configureFirebaseEmulators(): void {
  if (!useFirebaseEmulators) return;

  process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
  process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "127.0.0.1:9099";
}

function normalizePrivateKey(value: string): string {
  let normalized = value
    .replace(/\\n/g, "\n")
    .trim();

  if (normalized.startsWith('"') && normalized.endsWith('"')) {
    normalized = normalized.slice(1, -1).trim();
  }

  if (
    !normalized.startsWith(PEM_HEADER) ||
    !normalized.endsWith(PEM_FOOTER)
  ) {
    throw new Error(
      "Firebase Admin private key is malformed. Check FIREBASE_ADMIN_PRIVATE_KEY."
    );
  }

  return normalized;
}

function logPrivateKeyDiagnostics(
  rawValue: string,
  normalizedValue?: string
): void {
  if (process.env.NODE_ENV !== "development") return;

  // Do not log the private key itself.
  console.info("Firebase Admin private key diagnostics.", {
    present: rawValue.length > 0,
    length: rawValue.length,
    containsLiteralEscapedNewline: rawValue.includes("\\n"),
    containsActualNewline: rawValue.includes("\n"),
    startsWithPemHeader: rawValue.trim().startsWith(PEM_HEADER),
    endsWithPemFooter: rawValue.trim().endsWith(PEM_FOOTER),
    normalizedStartsWithPemHeader:
      normalizedValue?.startsWith(PEM_HEADER) ?? false,
    normalizedEndsWithPemFooter:
      normalizedValue?.endsWith(PEM_FOOTER) ?? false,
  });
}

function firebaseAdminConfigPresent(): boolean {
  if (useFirebaseEmulators) return true;

  return Boolean(
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY
  );
}

function getOrInitializeFirebaseAdminApp(): App {
  configureFirebaseEmulators();

  const existingApp = getApps().find(
    (app) => app.name === "[DEFAULT]"
  );

  if (existingApp) {
    return existingApp;
  }

  if (useFirebaseEmulators) {
    return initializeApp({
      projectId:
        process.env.FIREBASE_ADMIN_PROJECT_ID ||
        FIREBASE_EMULATOR_PROJECT_ID,
    });
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin is not configured. Check the FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY environment variables."
    );
  }

  let normalizedPrivateKey: string;

  try {
    normalizedPrivateKey = normalizePrivateKey(privateKey);
    logPrivateKeyDiagnostics(privateKey, normalizedPrivateKey);
  } catch (error) {
    logPrivateKeyDiagnostics(privateKey);
    throw error;
  }

  const app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey: normalizedPrivateKey,
    }),
    projectId,
  });

  if (process.env.NODE_ENV === "development") {
    console.info("Firebase Admin initialization succeeded.");
  }

  return app;
}

export function getAdminServices(): {
  auth: ReturnType<typeof getAuth>;
  db: Firestore;
} {
  const app = getOrInitializeFirebaseAdminApp();

  return {
    auth: getAuth(app),
    db: getFirestore(app),
  };
}

export function isTrustedAdminProfile(
  data: AdminProfile | undefined
): boolean {
  return data?.role === "admin" && data.active !== false;
}

function getErrorDetails(error: unknown): {
  name: string;
  code?: string;
  message?: string;
} {
  if (error instanceof Error) {
    const possibleCode = (
      error as Error & { code?: unknown }
    ).code;

    return {
      name: error.name || "Error",
      ...(typeof possibleCode === "string" ||
      typeof possibleCode === "number"
        ? { code: String(possibleCode) }
        : {}),
      message: error.message,
    };
  }

  return {
    name: "UnknownError",
    message: "An unexpected Firebase authorization error occurred.",
  };
}

export async function verifyAdminTokenDetailed(
  token: string
): Promise<AdminTokenVerification> {
  const result: AdminTokenVerification = {
    admin: null,
    tokenPresent: Boolean(token),
    tokenVerified: false,
    hasAdminClaim: false,
    adminRecordFound: false,
    adminRecordActive: false,
    adminRoleValid: false,
    firebaseAdminConfigPresent: firebaseAdminConfigPresent(),
  };

  if (!token) {
    return result;
  }

  let stage:
    | "firebase-admin-initialization"
    | "firebase-token-verification"
    | "admin-profile-read" = "firebase-admin-initialization";

  try {
    const { auth, db } = getAdminServices();

    stage = "firebase-token-verification";

    const decoded = await auth.verifyIdToken(token);

    result.tokenVerified = true;
    result.hasAdminClaim =
      decoded.admin === true || decoded.role === "admin";

    stage = "admin-profile-read";

    // Authorization requires a trusted Firestore profile.
    // A custom claim alone does not bypass this requirement.
    const profile = await db
      .collection("adminProfiles")
      .doc(decoded.uid)
      .get();

    const data = profile.data() as AdminProfile | undefined;

    result.adminRecordFound = profile.exists;
    result.adminRecordActive =
      profile.exists && data?.active !== false;
    result.adminRoleValid = data?.role === "admin";

    if (profile.exists && isTrustedAdminProfile(data)) {
      result.admin = decoded;
    }

    if (process.env.NODE_ENV === "development") {
      console.info("Admin token verification completed.", {
        stage,
        tokenVerified: result.tokenVerified,
        hasAdminClaim: result.hasAdminClaim,
        adminRecordFound: result.adminRecordFound,
        adminRecordActive: result.adminRecordActive,
        adminRoleValid: result.adminRoleValid,
      });
    }

    return result;
  } catch (error) {
    result.error = getErrorDetails(error);

    console.error("Admin token verification failed.", {
      stage,
      tokenPresent: result.tokenPresent,
      tokenVerified: result.tokenVerified,
      firebaseAdminConfigPresent:
        result.firebaseAdminConfigPresent,
      errorName: result.error.name,
      errorCode: result.error.code ?? null,
      errorMessage: result.error.message ?? null,
    });

    return result;
  }
}

export async function verifyAdminToken(
  token: string
): Promise<DecodedIdToken | null> {
  const result = await verifyAdminTokenDetailed(token);
  return result.admin;
}

export function getBearerToken(request: Request): string {
  const header = request.headers.get("authorization") || "";

  if (!header.startsWith("Bearer ")) {
    return "";
  }

  return header.slice("Bearer ".length).trim();
}
