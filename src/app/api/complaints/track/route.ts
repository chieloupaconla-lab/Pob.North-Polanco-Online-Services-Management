import { NextResponse } from "next/server";
import { getAdminServices } from "@/lib/adminAuthorization";

const TRACKING_CODE_PATTERN = /^(?:PN-[A-HJ-NP-Z2-9]{6}|CN-[A-HJ-NP-Z2-9]{8})$/;

function getAdminDb() {
  return getAdminServices().db;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { trackingCode?: unknown };
    const trackingCode = typeof body.trackingCode === "string" ? body.trackingCode.trim().toUpperCase() : "";
    if (!TRACKING_CODE_PATTERN.test(trackingCode)) {
      return NextResponse.json({ found: false }, { status: 404 });
    }

    const snapshot = await getAdminDb().collection("complaints").where("trackingCode", "==", trackingCode).limit(10).get();
    const complaint = snapshot.docs.find((item) => {
      const data = item.data();
      return data.submissionType === "Anonymous" || data.anonymous === true;
    });

    if (!complaint) return NextResponse.json({ found: false }, { status: 404 });

    const data = complaint.data();
    return NextResponse.json({
      found: true,
      complaint: {
        category: typeof data.category === "string" ? data.category : "Community Concern",
        customConcern: typeof data.customConcern === "string" ? data.customConcern : "",
        description: typeof data.description === "string" ? data.description : "No description provided.",
        status: typeof data.status === "string" ? data.status : "Pending",
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? null,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString?.() ?? null,
      },
    });
  } catch (error) {
    console.error("Anonymous complaint tracking failed:", error);
    return NextResponse.json({ found: false }, { status: 503 });
  }
}
