import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getBearerToken, getAdminServices, verifyAdminToken } from "@/lib/adminAuthorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const admin = await verifyAdminToken(getBearerToken(request));
  if (!admin) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const documentId = typeof body.documentId === "string" ? body.documentId.trim() : "";
  if (!documentId || documentId.length > 150) {
    return NextResponse.json({ message: "A valid document request ID is required." }, { status: 400 });
  }

  try {
    const { db } = getAdminServices();
    const documentRef = db.collection("documents").doc(documentId);
    const notificationRef = db.collection("notifications").doc(`document-${documentId}`);
    const existingNotifications = await db.collection("notifications")
      .where("referenceId", "==", documentId)
      .limit(1)
      .get();
    if (!existingNotifications.empty && existingNotifications.docs[0].data().type === "document") {
      return NextResponse.json({ recovered: false, existingNotificationId: existingNotifications.docs[0].id });
    }
    const result = await db.runTransaction(async (transaction) => {
      const documentSnapshot = await transaction.get(documentRef);
      if (!documentSnapshot.exists) throw new Error("DOCUMENT_NOT_FOUND");
      const notificationSnapshot = await transaction.get(notificationRef);
      if (notificationSnapshot.exists) return { recovered: false };

      const data = documentSnapshot.data() || {};
      const fullName = String(data.fullName || "Resident");
      const documentType = String(data.documentType || "Document");
      transaction.set(notificationRef, {
        title: "New Document Request",
        message: `${fullName} submitted a ${documentType} request.`,
        type: "document",
        recipientType: "admin",
        read: false,
        referenceId: documentId,
        referenceType: "document",
        actionUrl: "/admin/documents",
        metadata: { documentType, recoveredBy: admin.uid },
        createdAt: FieldValue.serverTimestamp(),
      });
      return { recovered: true };
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "DOCUMENT_NOT_FOUND") {
      return NextResponse.json({ message: "Document request not found." }, { status: 404 });
    }
    console.error("Document notification recovery failed:", error);
    return NextResponse.json({ message: "Unable to recover the document notification." }, { status: 500 });
  }
}
