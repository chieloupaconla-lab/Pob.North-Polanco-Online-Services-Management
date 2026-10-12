import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getAdminServices } from "@/lib/adminAuthorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_COMPRESSED_FILE_SIZE = 700 * 1024;
const CLOUDINARY_HOST = "res.cloudinary.com";

function isCloudinaryEvidenceUrl(value: string, cloudName: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      url.hostname === CLOUDINARY_HOST &&
      url.pathname.includes(`/${cloudName}/`);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      complaintId?: unknown;
      uploadToken?: unknown;
      evidenceUrl?: unknown;
      evidenceUploadStatus?: unknown;
      evidenceFileSize?: unknown;
    };

    const complaintId = typeof body.complaintId === "string"
      ? body.complaintId.trim()
      : "";
    const uploadToken = typeof body.uploadToken === "string"
      ? body.uploadToken.trim()
      : "";
    const evidenceUploadStatus = body.evidenceUploadStatus;

    if (!complaintId || !uploadToken ||
      (evidenceUploadStatus !== "Uploaded" && evidenceUploadStatus !== "Failed")) {
      return NextResponse.json({ message: "Invalid complaint evidence update." }, { status: 400 });
    }

    const cloudName =
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() ||
      process.env.CLOUDINARY_CLOUD_NAME?.trim();
    if (!cloudName) {
      return NextResponse.json({ message: "Cloudinary upload is not configured." }, { status: 503 });
    }

    const { db } = getAdminServices();
    const complaintRef = db.collection("complaints").doc(complaintId);
    const complaintSnapshot = await complaintRef.get();
    const storedToken = complaintSnapshot.data()?.uploadToken;

    if (!complaintSnapshot.exists || typeof storedToken !== "string" || storedToken !== uploadToken) {
      return NextResponse.json({ message: "Complaint evidence update is not authorized." }, { status: 403 });
    }

    if (evidenceUploadStatus === "Uploaded") {
      const evidenceUrl = typeof body.evidenceUrl === "string"
        ? body.evidenceUrl.trim()
        : "";
      const evidenceFileSize = body.evidenceFileSize;

      if (!isCloudinaryEvidenceUrl(evidenceUrl, cloudName) ||
        typeof evidenceFileSize !== "number" ||
        !Number.isInteger(evidenceFileSize) ||
        evidenceFileSize < 1 ||
        evidenceFileSize > MAX_COMPRESSED_FILE_SIZE) {
        return NextResponse.json({ message: "Invalid complaint evidence." }, { status: 400 });
      }

      await complaintRef.update({
        evidenceUrl,
        evidenceUploadStatus,
        evidenceFileSize,
        uploadToken: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      await complaintRef.update({
        evidenceUploadStatus,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Complaint evidence update failed.", {
      operation: "complaint-evidence-update",
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json({ message: "Unable to update complaint evidence." }, { status: 500 });
  }
}
