
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { FieldValue, type DocumentReference } from "firebase-admin/firestore";
import { getAdminServices, getBearerToken, verifyAdminToken } from "@/lib/adminAuthorization";
import { sendResidentEmailNotification } from "@/lib/send-email-notification";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RECORD_TARGETS = {
  document: { collection: "documents", anonymous: false },
  complaint: { collection: "complaints", anonymous: true },
  asset: { collection: "assets", anonymous: false },
} as const;
type NotificationRecordType = keyof typeof RECORD_TARGETS;

export async function POST(request: NextRequest) {
  let claimedEventRef: DocumentReference | null = null;
  try {
    if (!await verifyAdminToken(getBearerToken(request))) {
      return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();

    const {
      recordType: requestedRecordType,
      title,
      requestType,
      requestId,
      oldStatus,
      newStatus,
    } = body;

    if (requestedRecordType !== "document" && requestedRecordType !== "complaint" && requestedRecordType !== "asset") {
      return NextResponse.json(
        {
          success: false,
          message: "A valid notification record type is required.",
        },
        { status: 400 }
      );
    }
    const recordType = requestedRecordType as NotificationRecordType;

    if (
      typeof title !== "string" ||
      !title.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Email title is required.",
        },
        { status: 400 }
      );
    }

    if (
      typeof requestType !== "string" ||
      !requestType.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Request type is required.",
        },
        { status: 400 }
      );
    }

    if (
      typeof oldStatus !== "string" ||
      typeof newStatus !== "string" ||
      !oldStatus.trim() ||
      !newStatus.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Request statuses are required.",
        },
        { status: 400 }
      );
    }

    if (oldStatus.trim() === newStatus.trim()) {
      return NextResponse.json({ success: false, message: "No status change occurred." }, { status: 400 });
    }

    if (typeof requestId !== "string" || !requestId.trim()) {
      return NextResponse.json({ success: false, message: "Request ID is required for email deduplication." }, { status: 400 });
    }

    const target = RECORD_TARGETS[recordType];
    const { db } = getAdminServices();
    const requestSnapshot = await db.collection(target.collection).doc(requestId.trim()).get();
    if (!requestSnapshot.exists) {
      return NextResponse.json({ success: false, message: "The request record could not be found." }, { status: 404 });
    }

    const requestData = requestSnapshot.data() || {};
    const recipientEmail = typeof requestData.email === "string"
      ? requestData.email.trim().toLowerCase()
      : "";
    if (!EMAIL_PATTERN.test(recipientEmail)) {
      console.warn("Resident email notification skipped: request has no valid stored email.", {
        recordType,
        requestId: requestId.trim(),
        hasEmail: Boolean(recipientEmail),
      });
      return NextResponse.json({ success: false, message: "This request has no valid submitted email address." }, { status: 422 });
    }

    const isAnonymousComplaint = target.anonymous &&
      (requestData.anonymous === true || requestData.submissionType === "Anonymous");
    const recipientName = isAnonymousComplaint
      ? "Resident"
      : typeof requestData.fullName === "string"
        ? requestData.fullName.trim()
        : typeof requestData.borrowerName === "string"
          ? requestData.borrowerName.trim()
          : "Resident";

    const eventId = createHash("sha256")
      .update(`${recordType}|${requestType.trim()}|${requestId.trim()}|${oldStatus.trim()}|${newStatus.trim()}`)
      .digest("hex");
    const eventRef = db.collection("residentStatusEmailEvents").doc(eventId);
    claimedEventRef = eventRef;
    const eventClaim = await db.runTransaction(async (transaction) => {
      const eventSnapshot = await transaction.get(eventRef);
      const status = eventSnapshot.data()?.status;
      if (status === "accepted" || status === "sent" || status === "sending") return false;
      transaction.set(eventRef, {
        status: "sending",
        requestId: requestId.trim(),
        recordType,
        requestType: requestType.trim(),
        oldStatus: oldStatus.trim(),
        newStatus: newStatus.trim(),
        attemptedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      return true;
    });

    if (!eventClaim) {
      return NextResponse.json({ success: true, message: "Resident status email already sent or is being processed." });
    }

    const result =
      await sendResidentEmailNotification({
        email: recipientEmail,
        fullName: recipientName,
        title: title.trim(),
        requestType: requestType.trim(),
        requestId:
          typeof requestId === "string"
            ? requestId
            : undefined,
        oldStatus: oldStatus.trim(),
        newStatus: newStatus.trim(),
      });

    await eventRef.set({
      status: result.success ? "accepted" : "failed",
      deliveryStatus: result.success ? "accepted" : "failed",
      completedAt: FieldValue.serverTimestamp(),
      ...(result.id ? { providerMessageId: result.id } : {}),
      ...(result.success ? {} : { failureMessage: result.message }),
    }, { merge: true });

    return NextResponse.json(result, { status: result.success ? 200 : 502 });
  } catch (error) {
    if (claimedEventRef) {
      await claimedEventRef.set({
        status: "failed",
        deliveryStatus: "failed",
        completedAt: FieldValue.serverTimestamp(),
        failureMessage: "Notification processing failed.",
      }, { merge: true }).catch(() => undefined);
    }
    console.error("Admin email notification API error.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorCode: typeof (error as { code?: unknown })?.code === "string" ? (error as { code: string }).code : "unknown",
    });

    return NextResponse.json(
      {
        success: false,
        message: "Failed to send email notification.",
      },
      { status: 500 }
    );
  }
}

