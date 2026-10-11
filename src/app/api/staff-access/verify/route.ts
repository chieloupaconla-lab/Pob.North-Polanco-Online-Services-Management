import { NextResponse } from "next/server";
import {
  createStaffAccessToken,
  isStaffAccessConfigured,
  STAFF_ACCESS_COOKIE,
  STAFF_ACCESS_MAX_AGE,
  verifyStaffPin,
} from "@/lib/staffAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 60_000;

function getClientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function unavailableResponse(reason: string, request: Request) {
  console.error("Staff access unavailable.", {
    reason,
    method: request.method,
    configured: Boolean(process.env.ADMIN_ACCESS_PIN),
  });
  return NextResponse.json(
    { success: false, message: "Staff access is temporarily unavailable. Please contact the system administrator." },
    { status: 500 }
  );
}

export async function POST(request: Request) {
  if (!isStaffAccessConfigured()) {
    return unavailableResponse("pin_not_configured", request);
  }

  try {
    const key = getClientKey(request);
    const now = Date.now();
    const current = attempts.get(key);
    if (current && current.resetAt > now && current.count >= MAX_ATTEMPTS) {
      return NextResponse.json({ success: false, message: "Too many attempts. Please try again later." }, { status: 429 });
    }

    const body = (await request.json()) as { pin?: unknown };
    const pin = typeof body.pin === "string" ? body.pin : "";
    if (!pin || !verifyStaffPin(pin)) {
      if (!current || current.resetAt <= now) attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
      else attempts.set(key, { count: current.count + 1, resetAt: current.resetAt });
      return NextResponse.json({ success: false, message: "Invalid PIN" }, { status: 401 });
    }

    const token = createStaffAccessToken();
    if (!token) {
      return unavailableResponse("token_not_created", request);
    }

    const response = NextResponse.json({ success: true });
    attempts.delete(key);
    response.cookies.set({
      name: STAFF_ACCESS_COOKIE,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: STAFF_ACCESS_MAX_AGE,
    });
    return response;
  } catch (error) {
    return unavailableResponse(
      error instanceof SyntaxError ? "invalid_request_body" : "unexpected_server_error",
      request
    );
  }
}
