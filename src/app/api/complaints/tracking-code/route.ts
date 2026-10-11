import { NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { getAdminServices } from "@/lib/adminAuthorization";

const CODE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function getAdminDb() {
  return getAdminServices().db;
}

function createCode() {
  let code = "PN-";
  for (let index = 0; index < 6; index += 1) {
    code += CODE_CHARACTERS[randomInt(CODE_CHARACTERS.length)];
  }
  return code;
}

export async function POST() {
  try {
    const db = getAdminDb();
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const trackingCode = createCode();
      const existing = await db.collection("complaints").where("trackingCode", "==", trackingCode).limit(1).get();
      if (existing.empty) return NextResponse.json({ trackingCode });
    }
    return NextResponse.json({ message: "Unable to create a tracking code." }, { status: 503 });
  } catch (error) {
    console.error("Anonymous complaint tracking-code generation failed:", error);
    return NextResponse.json({ message: "Unable to create a tracking code." }, { status: 503 });
  }
}
