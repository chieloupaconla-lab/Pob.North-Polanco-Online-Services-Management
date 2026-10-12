import { NextRequest, NextResponse } from "next/server";
import { getBearerToken, verifyAdminToken } from "@/lib/adminAuthorization";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!await verifyAdminToken(getBearerToken(request))) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json(
    { success: false, message: "Resident email progress notifications are disabled." },
    { status: 410 },
  );
}
