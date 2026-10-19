import { createHash } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { isCurrentDocumentType } from "@/config/documentTypes";
import { isOfficialPurok } from "@/lib/purokConfig";
import { getAdminServices } from "@/lib/adminAuthorization";
import {
  getFirebaseFailureDetails,
  isFirebaseServiceUnavailable,
} from "@/lib/firebaseErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUBMISSION_ID_PATTERN = /^[a-zA-Z0-9_-]{20,80}$/;
const CANCELLATION_TOKEN_PATTERN = /^[a-f0-9-]{64,80}$/i;

const COMMON_PERSONAL_FIELDS = [
  "dateOfBirth",
  "age",
  "sex",
  "civilStatus",
  "citizenship",
  "contactNumber",
] as const;

const ALLOWED_FORM_FIELDS: Record<string, readonly string[]> = {
  "Barangay Clearance": COMMON_PERSONAL_FIELDS,
  "Certificate of Residency": [
    ...COMMON_PERSONAL_FIELDS,
    "lengthOfResidency",
  ],
  "Barangay Business Clearance": [
    "dateOfBirth",
    "contactNumber",
    "residentialAddress",
    "businessName",
    "businessType",
    "natureOfBusiness",
    "businessAddress",
    "applicationType",
  ],
  "Community Tax Certificate (Cedula)": [
    "dateOfBirth",
    "age",
    "sex",
    "civilStatus",
    "citizenship",
    "occupation",
    "residentialAddress",
  ],
};

const REQUIRED_FORM_FIELDS: Record<string, readonly string[]> = {
  "Barangay Clearance": COMMON_PERSONAL_FIELDS,
  "Certificate of Residency": [
    ...COMMON_PERSONAL_FIELDS,
    "lengthOfResidency",
  ],
  "Barangay Business Clearance": [
    "dateOfBirth",
    "contactNumber",
    "residentialAddress",
    "businessName",
    "businessType",
    "natureOfBusiness",
    "businessAddress",
    "applicationType",
  ],
  "Community Tax Certificate (Cedula)": [
    "dateOfBirth",
    "age",
    "sex",
    "civilStatus",
    "citizenship",
    "occupation",
    "residentialAddress",
  ],
};

function cleanFormData(
  value: unknown,
  documentType: string
): Record<string, string> | null {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  const input = value as Record<string, unknown>;
  const allowedFields = ALLOWED_FORM_FIELDS[documentType];

  if (!allowedFields) return null;

  // Reject unexpected keys instead of storing arbitrary submitted data.
  if (Object.keys(input).some((key) => !allowedFields.includes(key))) {
    return null;
  }

  const result: Record<string, string> = {};

  for (const key of allowedFields) {
    const rawValue = input[key];

    if (rawValue === undefined || rawValue === null) continue;

    if (typeof rawValue !== "string") return null;

    const cleanedValue = rawValue.trim();

    if (cleanedValue.length > 500) return null;

    if (cleanedValue) result[key] = cleanedValue;
  }

  for (const key of REQUIRED_FORM_FIELDS[documentType]) {
    if (!result[key]) return null;
  }

  if (
    result.age &&
    (!/^\d{1,3}$/.test(result.age) ||
      Number(result.age) < 0 ||
      Number(result.age) > 150)
  ) {
    return null;
  }

  if (
    result.dateOfBirth &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(result.dateOfBirth) ||
      Number.isNaN(Date.parse(result.dateOfBirth)) ||
      new Date(result.dateOfBirth).toISOString().slice(0, 10) !==
        result.dateOfBirth ||
      result.dateOfBirth > new Date().toISOString().slice(0, 10))
  ) {
    return null;
  }

  if (
    result.sex &&
    !["Female", "Male", "Prefer not to say"].includes(result.sex)
  ) {
    return null;
  }

  if (
    result.civilStatus &&
    !["Single", "Married", "Widowed", "Separated", "Annulled"].includes(
      result.civilStatus
    )
  ) {
    return null;
  }

  if (
    result.applicationType &&
    !["New", "Renewal"].includes(result.applicationType)
  ) {
    return null;
  }

  return result;
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { message: "Invalid document request data." },
        { status: 400 }
      );
    }

    const data = body as Record<string, unknown>;

    const fullName =
      typeof data.fullName === "string" ? data.fullName.trim() : "";
    const purok =
      typeof data.purok === "string" ? data.purok.trim() : "";
    const documentType =
      typeof data.documentType === "string"
        ? data.documentType.trim()
        : "";
    const purpose =
      typeof data.purpose === "string" ? data.purpose.trim() : "";
    const contact =
      typeof data.contact === "string" ? data.contact.trim() : "";
    const documentTypeId =
      typeof data.documentTypeId === "string"
        ? data.documentTypeId.trim()
        : "";
    const submissionId =
      typeof data.submissionId === "string"
        ? data.submissionId.trim()
        : "";
    const cancellationToken =
      typeof data.cancellationToken === "string"
        ? data.cancellationToken.trim()
        : "";

    if (
      !fullName ||
      !purok ||
      !documentType ||
      !purpose ||
      !submissionId
    ) {
      return NextResponse.json(
        { message: "Required document request fields are missing." },
        { status: 400 }
      );
    }

    if (
      fullName.length > 150 ||
      purok.length > 100 ||
      purpose.length > 1000
    ) {
      return NextResponse.json(
        { message: "Some submitted fields are too long." },
        { status: 400 }
      );
    }

    if (!isCurrentDocumentType(documentType)) {
      return NextResponse.json(
        { message: "Please select an approved document type." },
        { status: 400 }
      );
    }

    if (!isOfficialPurok(purok)) {
      return NextResponse.json(
        { message: "Please select an official Purok." },
        { status: 400 }
      );
    }

    if (!SUBMISSION_ID_PATTERN.test(submissionId)) {
      return NextResponse.json(
        { message: "Invalid document request submission." },
        { status: 400 }
      );
    }

    if (!CANCELLATION_TOKEN_PATTERN.test(cancellationToken)) {
      return NextResponse.json(
        { message: "Invalid cancellation credential." },
        { status: 400 }
      );
    }

    const formData = cleanFormData(data.formData, documentType);

    if (!formData) {
      return NextResponse.json(
        {
          message:
            "Please complete all required fields and check the additional information for your selected document.",
        },
        { status: 400 }
      );
    }

    const cancellationTokenHash = createHash("sha256")
      .update(cancellationToken)
      .digest("hex");

    const { db } = getAdminServices();

    const documentRef = db.collection("documents").doc(submissionId);
    const notificationRef = db
      .collection("notifications")
      .doc(`document-${submissionId}`);
    const activityRef = db.collection("activityLogs").doc();

    const result = await db.runTransaction(async (transaction) => {
      const existingDocument = await transaction.get(documentRef);
      const existingNotification = await transaction.get(notificationRef);
      const existingData = existingDocument.data() || {};

      const notificationFullName = String(
        existingData.fullName || fullName
      );
      const notificationDocumentType = String(
        existingData.documentType || documentType
      );

      if (!existingDocument.exists) {
        transaction.set(documentRef, {
          fullName,
          purok,
          documentType,
          ...(contact ? { contact } : {}),
          ...(documentTypeId ? { documentTypeId } : {}),
          purpose,
          formData,
          status: "Pending",
          adminNotes: "",
          cancellationTokenHash,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          completedAt: null,
        });
      }

      if (!existingNotification.exists) {
        transaction.set(notificationRef, {
          title: "New Document Request",
          message: `${notificationFullName} submitted a ${notificationDocumentType} request.`,
          type: "document",
          recipientType: "admin",
          read: false,
          referenceId: submissionId,
          referenceType: "document",
          actionUrl: "/admin/documents",
          metadata: {
            documentType: notificationDocumentType,
          },
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      return {
        created: !existingDocument.exists,
        notificationCreated: !existingNotification.exists,
      };
    });

    if (result.created) {
      await activityRef
        .set({
          action: "DOCUMENT_SUBMITTED",
          category: "Documents",
          description: `${fullName} submitted a ${documentType} request.`,
          actorType: "resident",
          actorName: fullName,
          referenceId: submissionId,
          referenceType: "document",
          status: "Pending",
          metadata: {
            documentType,
          },
          createdAt: FieldValue.serverTimestamp(),
        })
        .catch((error) => {
          console.error("Document activity log write failed:", error);
        });
    }

    return NextResponse.json({
      requestId: submissionId,
      created: result.created,
    });
  } catch (error) {
    console.error("Document request server submission failed.", {
      operation: "document-submission",
      ...getFirebaseFailureDetails(error),
    });

    if (isFirebaseServiceUnavailable(error)) {
      return NextResponse.json(
        {
          message:
            "The service is temporarily unavailable. Your request was not submitted. Please try again shortly.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { message: "We could not submit your request right now." },
      { status: 500 }
    );
  }
}