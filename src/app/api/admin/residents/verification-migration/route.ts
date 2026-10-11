import {
  FieldPath,
  FieldValue,
  type DocumentReference,
  type Firestore,
  type QueryDocumentSnapshot,
} from "firebase-admin/firestore";

import { NextResponse } from "next/server";

import {
  getBearerToken,
  getAdminServices,
  verifyAdminTokenDetailed,
} from "@/lib/adminAuthorization";

import {
  getFirebaseDiagnosticDetails,
  isFirebaseServiceUnavailable,
} from "@/lib/firebaseErrors";

import {
  getCanonicalPurok,
  getStoredPurok,
  normalizePurokForSearch,
} from "@/lib/purokConfig";

import {
  getResidentVerificationFields,
  normalizeResidentName,
  RESIDENT_VERIFICATION_VERSION,
} from "@/lib/residentVerification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BATCH_SIZE = 400;

type InvalidResidentDiagnostic = {
  id: string;
  problems: string[];
};

/**
 * Validate the minimum information needed for resident verification.
 * This function does not modify any resident records.
 */
function getResidentValidationProblems(
  data: Record<string, unknown>
): string[] {
  const problems: string[] = [];

  const fullName =
    typeof data.fullName === "string" ? data.fullName.trim() : "";

  const storedPurok = getStoredPurok(data);
  const canonicalPurok = getCanonicalPurok(storedPurok);

  if (!fullName) {
    problems.push("MISSING_OR_INVALID_FULL_NAME");
  } else {
    const fields = getResidentVerificationFields(fullName, "");

    if (fields.verificationNameTokens.length < 2) {
      problems.push("INSUFFICIENT_NAME_TOKENS");
    }
  }

  if (!storedPurok) {
    problems.push("MISSING_PUROK");
  } else if (!canonicalPurok) {
    problems.push("UNSUPPORTED_PUROK");
  }

  return problems;
}

/**
 * Compare primitive values and arrays without changing stored data.
 */
function sameValue(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return (
      a.length === b.length &&
      a.every((value, index) => value === b[index])
    );
  }

  return a === b;
}

/**
 * Prevent unnecessary Firestore writes.
 */
function needsUpdate(
  current: Record<string, unknown>,
  next: Record<string, unknown>
): boolean {
  return Object.entries(next).some(
    ([key, value]) => !sameValue(current[key], value)
  );
}

/**
 * Find invalid residents.
 *
 * WARNING:
 * This reads every resident document. Only run this diagnostic when
 * necessary because Firestore reads consume the project's quota.
 */
async function findInvalidResidents(
  db: Firestore
): Promise<InvalidResidentDiagnostic[]> {
  const invalidResidents: InvalidResidentDiagnostic[] = [];

  let lastDocument: QueryDocumentSnapshot | undefined;

  while (true) {
    let query = db
      .collection("residents")
      .orderBy(FieldPath.documentId())
      .limit(BATCH_SIZE);

    if (lastDocument) {
      query = query.startAfter(lastDocument);
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
      break;
    }

    for (const resident of snapshot.docs) {
      const problems = getResidentValidationProblems(
        resident.data() as Record<string, unknown>
      );

      if (problems.length > 0) {
        invalidResidents.push({
          id: resident.id,
          problems,
        });
      }
    }

    lastDocument = snapshot.docs[snapshot.docs.length - 1];

    if (snapshot.size < BATCH_SIZE) {
      break;
    }
  }

  return invalidResidents;
}

/**
 * Verify that the request belongs to an authorized administrator.
 * Never remove this check to make the migration endpoint accessible.
 */
async function getAuthorizedAdmin(
  request: Request,
  operation: string
) {
  const result = await verifyAdminTokenDetailed(
    getBearerToken(request)
  );

  if (!result.admin) {
    console.warn(
      "Resident verification migration authorization failed.",
      {
        operation,
        tokenPresent: result.tokenPresent,
        tokenVerified: result.tokenVerified,
        firebaseAdminConfigPresent:
          result.firebaseAdminConfigPresent,
        errorName: result.error?.name || null,
        errorCode: result.error?.code || null,
      }
    );

    return null;
  }

  return result.admin;
}

/**
 * GET /api/admin/residents/verification-migration
 *
 * Returns the current migration status.
 *
 * Optional:
 * ?diagnose=invalid
 *
 * The diagnostic option reads the full residents collection and
 * should only be used when Firestore quota is available.
 */
export async function GET(request: Request) {
  const admin = await getAuthorizedAdmin(
    request,
    "resident-verification-migration-status"
  );

  if (!admin) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 }
    );
  }

  let stage = "firebase-admin-initialization";

  try {
    const { db } = getAdminServices();

    stage = "migration-metadata-read";

    const snapshot = await db
      .collection("systemMetadata")
      .doc("residentVerification")
      .get();

    const data = snapshot.data() || {};

    const response: {
      complete: boolean;
      status: string;
      version: number | null;
      processedCount: number;
      updatedCount: number;
      invalidCount: number;
      invalidResidents?: InvalidResidentDiagnostic[];
    } = {
      complete:
        snapshot.exists &&
        data.complete === true &&
        data.version === RESIDENT_VERIFICATION_VERSION,
      status:
        typeof data.status === "string"
          ? data.status
          : "not-started",
      version:
        typeof data.version === "number"
          ? data.version
          : null,
      processedCount:
        typeof data.processedCount === "number"
          ? data.processedCount
          : 0,
      updatedCount:
        typeof data.updatedCount === "number"
          ? data.updatedCount
          : 0,
      invalidCount:
        typeof data.invalidCount === "number"
          ? data.invalidCount
          : 0,
    };

    const url = new URL(request.url);

    if (url.searchParams.get("diagnose") === "invalid") {
      stage = "invalid-resident-diagnostic";

      response.invalidResidents =
        await findInvalidResidents(db);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error(
      "Resident verification migration status failed:",
      JSON.stringify({
        operation: "resident-verification-migration-status",
        stage,
        firebaseTarget:
          process.env.FIREBASE_USE_EMULATORS === "true"
            ? "emulator"
            : "admin-project",
        ...getFirebaseDiagnosticDetails(error),
      })
    );

    return NextResponse.json(
      {
        message:
          "Migration status is temporarily unavailable. Check the server logs and Firestore quota.",
      },
      {
        status: isFirebaseServiceUnavailable(error) ? 503 : 500,
      }
    );
  }
}

/**
 * POST /api/admin/residents/verification-migration
 *
 * Prepares resident records for the verification system.
 *
 * Only authorized administrators can execute this operation.
 * The migration remains incomplete if any invalid resident records
 * are found or if the operation fails.
 */
export async function POST(request: Request) {
  const admin = await getAuthorizedAdmin(
    request,
    "resident-verification-migration"
  );

  if (!admin) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 }
    );
  }

  let processedCount = 0;
  let updatedCount = 0;
  let invalidCount = 0;

  const invalidResidents: InvalidResidentDiagnostic[] = [];

  let stage = "firebase-admin-initialization";

  let metadataRef: DocumentReference | undefined;

  try {
    const { db } = getAdminServices();

    metadataRef = db
      .collection("systemMetadata")
      .doc("residentVerification");

    stage = "migration-metadata-start";

    await metadataRef.set(
      {
        complete: false,
        version: RESIDENT_VERIFICATION_VERSION,
        status: "running",
        processedCount: 0,
        updatedCount: 0,
        invalidCount: 0,
        startedAt: FieldValue.serverTimestamp(),
        startedBy: admin.uid,
      },
      { merge: true }
    );

    let lastDocument: QueryDocumentSnapshot | undefined;

    while (true) {
      stage = "migration-resident-read";

      let query = db
        .collection("residents")
        .orderBy(FieldPath.documentId())
        .limit(BATCH_SIZE);

      if (lastDocument) {
        query = query.startAfter(lastDocument);
      }

      const snapshot = await query.get();

      if (snapshot.empty) {
        break;
      }

      const batch = db.batch();
      let writesInBatch = 0;

      for (const resident of snapshot.docs) {
        processedCount += 1;

        const data = resident.data() as Record<string, unknown>;

        const problems = getResidentValidationProblems(data);

        if (problems.length > 0) {
          invalidResidents.push({
            id: resident.id,
            problems,
          });

          invalidCount += 1;
          continue;
        }

        const fullName =
          typeof data.fullName === "string"
            ? data.fullName.trim()
            : "";

        const canonicalPurok = getCanonicalPurok(
          getStoredPurok(data)
        );

        // Keep the validation check even though the earlier
        // validation should already have checked the Purok.
        if (!canonicalPurok) {
          invalidResidents.push({
            id: resident.id,
            problems: ["UNSUPPORTED_PUROK"],
          });

          invalidCount += 1;
          continue;
        }

        const nameFields = getResidentVerificationFields(
          fullName,
          normalizePurokForSearch(canonicalPurok)
        );

        const nextFields: Record<string, unknown> = {
          fullNameNormalized: normalizeResidentName(fullName),
          ...nameFields,
        };

        // Only update fields that actually need to change.
        if (needsUpdate(data, nextFields)) {
          batch.update(resident.ref, nextFields);
          writesInBatch += 1;
        }
      }

      if (writesInBatch > 0) {
        stage = "migration-batch-write";

        await batch.commit();

        updatedCount += writesInBatch;
      }

      lastDocument = snapshot.docs[snapshot.docs.length - 1];

      if (snapshot.size < BATCH_SIZE) {
        break;
      }
    }

    stage = "migration-final-status";

    if (invalidCount > 0) {
      await metadataRef.set(
        {
          complete: false,
          version: RESIDENT_VERIFICATION_VERSION,
          status: "blocked",
          processedCount,
          updatedCount,
          invalidCount,
          finishedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return NextResponse.json(
        {
          complete: false,
          status: "blocked",
          processedCount,
          updatedCount,
          invalidCount,
          invalidResidents,
          message:
            "Some resident records need correction. Review the reported record IDs and problems, correct the records through the authorized resident registry, and run the migration again.",
        },
        { status: 409 }
      );
    }

    await metadataRef.set(
      {
        complete: true,
        version: RESIDENT_VERIFICATION_VERSION,
        status: "complete",
        residentCount: processedCount,
        processedCount,
        updatedCount,
        invalidCount: 0,
        finishedAt: FieldValue.serverTimestamp(),
        finishedBy: admin.uid,
      },
      { merge: true }
    );

    return NextResponse.json({
      complete: true,
      status: "complete",
      residentCount: processedCount,
      processedCount,
      updatedCount,
      invalidCount: 0,
      version: RESIDENT_VERIFICATION_VERSION,
    });
  } catch (error) {
    console.error(
      "Resident verification migration failed:",
      JSON.stringify({
        operation: "resident-verification-migration",
        stage,
        firebaseTarget:
          process.env.FIREBASE_USE_EMULATORS === "true"
            ? "emulator"
            : "admin-project",
        processedCount,
        updatedCount,
        invalidCount,
        ...getFirebaseDiagnosticDetails(error),
      })
    );

    // Best effort only. This status write can fail too if Firestore
    // is unavailable or the quota has been exhausted.
    if (metadataRef) {
      try {
        await metadataRef.set(
          {
            complete: false,
            version: RESIDENT_VERIFICATION_VERSION,
            status: "failed",
            processedCount,
            updatedCount,
            invalidCount,
            failedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      } catch (statusError) {
        console.error(
          "Unable to record migration failure status:",
          JSON.stringify(
            getFirebaseDiagnosticDetails(statusError)
          )
        );
      }
    }

    const unavailable = isFirebaseServiceUnavailable(error);

    return NextResponse.json(
      {
        complete: false,
        status: "failed",
        processedCount,
        updatedCount,
        invalidCount,
        message: unavailable
          ? "Firestore is temporarily unavailable or a quota has been reached. Wait until access is restored before retrying."
          : "The migration failed. Review the server log for the failing stage before retrying.",
      },
      { status: unavailable ? 503 : 500 }
    );
  }
}