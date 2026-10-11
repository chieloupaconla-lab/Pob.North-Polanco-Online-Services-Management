import { NextResponse } from "next/server";
import { getAdminServices } from "@/lib/adminAuthorization";
import { getFirebaseDiagnosticDetails } from "@/lib/firebaseErrors";
import {
  getCanonicalPurok,
  normalizePurokForSearch,
} from "@/lib/purokConfig";
import {
  getResidentNameSearchParts,
  isResidentVerificationReady,
  RESIDENT_VERIFICATION_VERSION,
  verifyResidentIdentity,
} from "@/lib/residentVerification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let stage = "request-validation";

  try {
    const body = (await request.json()) as {
      fullName?: unknown;
      purok?: unknown;
    };

    const fullName =
      typeof body.fullName === "string" ? body.fullName.trim() : "";

    const purokInput =
      typeof body.purok === "string" ? body.purok.trim() : "";

    const purok = getCanonicalPurok(purokInput);

    if (!fullName || !purok) {
      return NextResponse.json(
        {
          verified: false,
          unavailable: false,
          message:
            "Please enter your full name and select an official Purok.",
        },
        { status: 400 }
      );
    }

    stage = "firebase-admin-initialization";
    const { db } = getAdminServices();

    // Keep verification blocked until the required migration is complete.
    stage = "resident-verification-metadata-read";

    const migration = await db
      .collection("systemMetadata")
      .doc("residentVerification")
      .get();

    const migrationData = migration.data();

    if (
      !migration.exists ||
      !isResidentVerificationReady(migrationData)
    ) {
      console.error("Resident verification migration is not ready:", {
        operation: "resident-verification-metadata",
        stage,
        firebaseTarget:
          process.env.FIREBASE_USE_EMULATORS === "true"
            ? "emulator"
            : "admin-project",
        documentExists: migration.exists,
        complete: migrationData?.complete === true,
        version:
          typeof migrationData?.version === "number"
            ? migrationData.version
            : "missing",
        requiredVersion: RESIDENT_VERIFICATION_VERSION,
        status:
          typeof migrationData?.status === "string"
            ? migrationData.status
            : "missing",
        processedCount:
          typeof migrationData?.processedCount === "number"
            ? migrationData.processedCount
            : null,
        invalidCount:
          typeof migrationData?.invalidCount === "number"
            ? migrationData.invalidCount
            : null,
      });

      return NextResponse.json(
        {
          verified: false,
          unavailable: true,
          message:
            "Resident verification is being prepared. Please try again later.",
        },
        { status: 503 }
      );
    }

    stage = "resident-name-validation";

    const { firstName, surname } =
      getResidentNameSearchParts(fullName);

    if (!firstName || !surname) {
      return NextResponse.json({
        verified: false,
        unavailable: false,
        ambiguous: false,
        message:
          "Please enter your full name as recorded in the resident registry.",
      });
    }

    // Query only indexed verification fields to limit unnecessary reads.
    stage = "resident-verification-query";

    const normalizedPurok = normalizePurokForSearch(purok);

    const snapshot = await db
      .collection("residents")
      .where("active", "==", true)
      .where("purokNormalized", "==", normalizedPurok)
      .where("verificationFirstName", "==", firstName)
      .where("verificationSurname", "==", surname)
      .get();

    stage = "resident-identity-check";

    const results = snapshot.docs
      .filter((resident) => resident.data().archived !== true)
      .map((resident) =>
        verifyResidentIdentity(fullName, purok, resident.data())
      );

    const highConfidenceMatches = results.filter(
      (result) => result.verified
    );

    const mediumConfidenceMatches = results.filter(
      (result) => result.status === "MEDIUM_CONFIDENCE"
    );

    // Only one unambiguous, high-confidence match is accepted.
    if (
      highConfidenceMatches.length === 1 &&
      mediumConfidenceMatches.length === 0
    ) {
      return NextResponse.json({
        verified: true,
        unavailable: false,
        ambiguous: false,
      });
    }

    // Never approve uncertain or conflicting matches.
    if (
      highConfidenceMatches.length > 1 ||
      mediumConfidenceMatches.length > 0
    ) {
      return NextResponse.json({
        verified: false,
        unavailable: false,
        ambiguous: true,
        message:
          "We could not uniquely confirm your details. Please contact the barangay for assistance.",
      });
    }

    return NextResponse.json({
      verified: false,
      unavailable: false,
      ambiguous: false,
      message:
        "We could not match your details with the resident registry. Please check your full name and Purok.",
    });
  } catch (error) {
    console.error(
      "Resident verification failed:",
      JSON.stringify({
        operation: "resident-verification",
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
        verified: false,
        unavailable: true,
        message:
          "Resident verification is temporarily unavailable. Please try again later.",
      },
      { status: 503 }
    );
  }
}