import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { isCurrentDocumentType } from "@/config/documentTypes";
import { isOfficialPurok } from "@/lib/purokConfig";
import { getAdminServices } from "@/lib/adminAuthorization";
import { getFirebaseFailureDetails, isFirebaseServiceUnavailable } from "@/lib/firebaseErrors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SUBMISSION_ID_PATTERN = /^[a-zA-Z0-9_-]{20,80}$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    const purok = typeof body.purok === "string" ? body.purok.trim() : "";
    const documentType = typeof body.documentType === "string" ? body.documentType.trim() : "";
    const purpose = typeof body.purpose === "string" ? body.purpose.trim() : "";
    const contact = typeof body.contact === "string" ? body.contact.trim() : "";
    const documentTypeId = typeof body.documentTypeId === "string" ? body.documentTypeId.trim() : "";
    const submissionId = typeof body.submissionId === "string" ? body.submissionId.trim() : "";

    if (!fullName || !purok || !documentType || !purpose || !submissionId) {
      return NextResponse.json({ message: "Required document request fields are missing." }, { status: 400 });
    }
    if (!isCurrentDocumentType(documentType)) return NextResponse.json({ message: "Please select an approved document type." }, { status: 400 });
    if (!isOfficialPurok(purok)) return NextResponse.json({ message: "Please select an official Purok." }, { status: 400 });
    if (!SUBMISSION_ID_PATTERN.test(submissionId)) return NextResponse.json({ message: "Invalid document request submission." }, { status: 400 });

    const { db } = getAdminServices();
    const documentRef = db.collection("documents").doc(submissionId);
    const notificationRef = db.collection("notifications").doc(`document-${submissionId}`);
    const activityRef = db.collection("activityLogs").doc();
    const result = await db.runTransaction(async (transaction) => {
      const existingDocument = await transaction.get(documentRef);
      const existingNotification = await transaction.get(notificationRef);
      const existingData = existingDocument.data() || {};
      const notificationFullName = String(existingData.fullName || fullName);
      const notificationDocumentType = String(existingData.documentType || documentType);

      if (!existingDocument.exists) {
        transaction.set(documentRef, {
          fullName,
          purok,
          documentType,
          ...(contact ? { contact } : {}),
          ...(documentTypeId ? { documentTypeId } : {}),
          purpose,
          status: "Pending",
          adminNotes: "",
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
          metadata: { documentType: notificationDocumentType },
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      return {
        created: !existingDocument.exists,
        notificationCreated: !existingNotification.exists,
      };
    });

    if (result.created) {
      await activityRef.set({
        action: "DOCUMENT_SUBMITTED",
        category: "Documents",
        description: `${fullName} submitted a ${documentType} request.`,
        actorType: "resident",
        actorName: fullName,
        referenceId: submissionId,
        referenceType: "document",
        status: "Pending",
        metadata: { documentType },
        createdAt: FieldValue.serverTimestamp(),
      }).catch((error) => console.error("Document activity log write failed:", error));
    }

    return NextResponse.json({ requestId: submissionId, created: result.created });
  } catch (error) {
    console.error("Document request server submission failed.", {
      operation: "document-submission",
      ...getFirebaseFailureDetails(error),
    });
    if (isFirebaseServiceUnavailable(error)) {
      return NextResponse.json({ message: "The service is temporarily unavailable. Your request was not submitted. Please try again shortly." }, { status: 503 });
    }
    return NextResponse.json({ message: "We could not submit your request right now." }, { status: 500 });
  }
}
