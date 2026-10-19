
import { createHash, timingSafeEqual } from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";
import { getAdminServices } from "@/lib/adminAuthorization";

export const runtime = "nodejs";

type RequestType = "document" | "complaint" | "asset";

const COLLECTIONS: Record<RequestType, string> = {
  document: "documents",
  complaint: "complaints",
  asset: "assets",
};

function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function tokensMatch(token: string, storedHash: unknown): boolean {
  if (typeof storedHash !== "string" || !/^[a-f0-9]{64}$/i.test(storedHash)) {
    return false;
  }

  const provided = Buffer.from(hashToken(token), "hex");
  const expected = Buffer.from(storedHash, "hex");

  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, message: "Invalid request." },
        { status: 400 }
      );
    }

    const { requestType, requestId, cancellationToken } = body as {
      requestType?: unknown;
      requestId?: unknown;
      cancellationToken?: unknown;
    };

    if (
      typeof requestType !== "string" ||
      !Object.prototype.hasOwnProperty.call(COLLECTIONS, requestType) ||
      typeof requestId !== "string" ||
      !/^[A-Za-z0-9_-]{1,150}$/.test(requestId) ||
      typeof cancellationToken !== "string" ||
      !/^[a-f0-9]{64}$/i.test(cancellationToken)
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid cancellation details." },
        { status: 400 }
      );
    }

    const type = requestType as RequestType;
    const { db } = getAdminServices();
    const requestRef = db.collection(COLLECTIONS[type]).doc(requestId);

    const activityRef = db.collection("activityLogs").doc();
    const notificationRef = db.collection("notifications").doc();

    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(requestRef);
      const record = snapshot.data();

      if (
        !snapshot.exists ||
        !record ||
        !tokensMatch(cancellationToken, record.cancellationTokenHash) ||
        record.status !== "Pending"
      ) {
        throw new Error("CANCELLATION_NOT_ALLOWED");
      }

      if (
        type === "asset" &&
        (
          typeof record.borrowerName !== "string" ||
          typeof record.borrowDate !== "string" ||
          typeof record.assetName !== "string"
        )
      ) {
        throw new Error("CANCELLATION_NOT_ALLOWED");
      }

      const actorName =
        type === "document"
          ? String(record.fullName ?? "Resident")
          : type === "complaint"
            ? String(record.anonymous ? "Anonymous resident" : record.fullName ?? "Resident")
            : String(record.borrowerName ?? "Resident");

      const label =
        type === "document"
          ? "document request"
          : type === "complaint"
            ? "community complaint"
            : "equipment borrowing request";

      transaction.update(requestRef, {
        status: "Cancelled",
        cancelledAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      transaction.set(activityRef, {
        action: "REQUEST_CANCELLED",
        category:
          type === "document" ? "Documents" : type === "complaint" ? "Complaints" : "Equipment",
        description: `${actorName} cancelled a ${label}.`,
        actorType: "resident",
        actorName,
        referenceId: requestId,
        referenceType: type,
        status: "Cancelled",
        metadata: { requestType: type },
        createdAt: FieldValue.serverTimestamp(),
      });

      transaction.set(notificationRef, {
        title: "Request Cancelled by Resident",
        message: `A ${label} submitted by ${actorName} was cancelled by the resident.`,
        type,
        recipientType: "admin",
        read: false,
        referenceId: requestId,
        referenceType: type,
        actionUrl:
          type === "document"
            ? "/admin/documents"
            : type === "complaint"
              ? "/admin/complaints"
              : "/admin/assets",
        metadata: { requestType: type, status: "Cancelled" },
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({
      success: true,
      message: "Your request has been cancelled successfully.",
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CANCELLATION_NOT_ALLOWED") {
      return NextResponse.json(
        {
          success: false,
          message:
            "This request cannot be cancelled. Check your cancellation token and ensure the request is still Pending.",
        },
        { status: 400 }
      );
    }

    console.error("Request cancellation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to cancel the request right now. Please try again later.",
      },
      { status: 500 }
    );
  }
}
