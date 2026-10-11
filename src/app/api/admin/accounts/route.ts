import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAdminServices, getBearerToken, verifyAdminToken } from "@/lib/adminAuthorization";
import { formatNameForDisplay } from "@/lib/nameUtils";
import { isValidAdminPassword } from "@/lib/passwordUtils";
import { STAFF_ACCESS_COOKIE, verifyStaffAccessToken } from "@/lib/staffAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function firebaseAdminConfigPresent() {
  return Boolean(
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY
  );
}

function errorDetails(error: unknown) {
  if (!error || typeof error !== "object") {
    return { name: "UnknownError" };
  }

  const value = error as { name?: unknown; code?: unknown };
  const message = error instanceof Error ? error.message : "";
  return {
    name: typeof value.name === "string" ? value.name : "UnknownError",
    ...(typeof value.code === "string" ? { code: value.code } : {}),
    ...(message ? { message } : {}),
  };
}

function errorResponse({
  code,
  message,
  status,
  step,
  error,
  firebaseUserCreated = false,
  adminAuthorizationCreated = false,
}: {
  code: string;
  message: string;
  status: number;
  step: "STAFF_ACCESS_CHECK" | "FIREBASE_AUTH_CREATE_USER" | "FIRESTORE_ADMIN_AUTHORIZATION" | "OTHER";
  error?: unknown;
  firebaseUserCreated?: boolean;
  adminAuthorizationCreated?: boolean;
}) {
  const details = errorDetails(error);
  console.error("Admin signup failure.", {
    step,
    status,
    ...details,
    firebaseUserCreated,
    adminAuthorizationCreated,
  });

  const debug = process.env.NODE_ENV === "development"
    ? {
        step,
        name: details.name,
        code: details.code || code,
        message: details.message || message,
        firebaseUserCreated,
        adminAuthorizationCreated,
      }
    : undefined;

  return NextResponse.json(
    {
      success: false,
      code,
      message,
      ...(debug ? { debug } : {}),
    },
    { status }
  );
}

export async function POST(request: Request) {
  let createdUserUid: string | null = null;

  try {
    const actor = await verifyAdminToken(getBearerToken(request));
    const cookieStore = await cookies();
    const staffAccessGranted = verifyStaffAccessToken(cookieStore.get(STAFF_ACCESS_COOKIE)?.value || "");
    console.info("Admin signup request received.", {
      method: request.method,
      staffAccessGranted,
      firebaseAdminConfigPresent: firebaseAdminConfigPresent(),
    });
    if (!actor && !staffAccessGranted) {
      console.warn("Admin signup staff access check failed.");
      return errorResponse({
        code: "UNAUTHORIZED",
        message: "You are not authorized to create an admin account.",
        status: 403,
        step: "STAFF_ACCESS_CHECK",
      });
    }

    const rawBody = await request.text();
    let body: { fullName?: unknown; email?: unknown; password?: unknown };
    try {
      body = JSON.parse(rawBody) as { fullName?: unknown; email?: unknown; password?: unknown };
    } catch {
      console.warn("Admin signup request body validation failed.");
      return errorResponse({
        code: "INVALID_REQUEST",
        message: "Please provide valid account details.",
        status: 400,
        step: "OTHER",
      });
    }
    const fullName = typeof body.fullName === "string" ? formatNameForDisplay(body.fullName) : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!fullName || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !isValidAdminPassword(password)) {
      console.warn("Admin signup validation failed.");
      return errorResponse({
        code: "VALIDATION_ERROR",
        message: "Please provide valid account details and meet the password requirements.",
        status: 400,
        step: "OTHER",
      });
    }

    let auth;
    let db;
    try {
      ({ auth, db } = getAdminServices());
      console.info("Admin signup Firebase Admin initialization passed.", {
        firebaseAdminConfigPresent: firebaseAdminConfigPresent(),
      });
    } catch (error) {
      console.error("Admin signup Firebase Admin initialization failed.", errorDetails(error));
      return errorResponse({
        code: "FIREBASE_ADMIN_CONFIG_ERROR",
        message: "Unable to create the admin account right now. Please try again.",
        status: 500,
        step: "OTHER",
        error,
      });
    }

    let user;
    try {
      console.info("Admin signup Firebase create-user operation started.");
      user = await auth.createUser({ email, password, displayName: fullName });
      createdUserUid = user.uid;
      console.info("Admin signup Firebase create-user operation succeeded.");
    } catch (error) {
      const details = errorDetails(error);
      console.error("Admin signup Firebase create-user operation failed.", details);
      if (details.code?.includes("email-already-exists")) {
        // A staff-authorized signup can finish authorizing an existing Firebase user
        // created before the admin profile flow was added. No duplicate user is made.
        user = await auth.getUserByEmail(email);
        createdUserUid = user.uid;
        console.info("Admin signup found an existing Firebase user; authorization will be completed.");
      }
      else {
        return errorResponse({
          code: "FIREBASE_AUTH_ERROR",
          message: "Unable to create the admin account. Please try again.",
          status: 500,
          step: "FIREBASE_AUTH_CREATE_USER",
          error,
        });
      }
    }

    try {
      console.info("Admin signup admin authorization write started.");
      await auth.setCustomUserClaims(user.uid, { admin: true, role: "admin" });
      await db.collection("adminProfiles").doc(user.uid).set({
        fullName,
        email,
        role: "admin",
        active: true,
        createdAt: new Date(),
        createdBy: actor?.uid || "staff-access",
      });
      console.info("Admin signup admin authorization write succeeded.");
    } catch (error) {
      console.error("Admin signup admin authorization write failed.", errorDetails(error));
      return errorResponse({
        code: "ADMIN_AUTHORIZATION_ERROR",
        message: "The account could not be authorized as an administrator. Please contact the system administrator.",
        status: 500,
        step: "FIRESTORE_ADMIN_AUTHORIZATION",
        error,
        firebaseUserCreated: true,
      });
    }

    try {
      await db.collection("activityLogs").add({
        action: "ADMIN_CREATED",
        category: "Admin",
        description: `${fullName} created an administrator account.`,
        actorType: actor ? "admin" : "system",
        actorName: actor?.email || "Staff Access",
        ...(actor?.uid ? { actorId: actor.uid } : {}),
        referenceId: user.uid,
        referenceType: "system",
        createdAt: new Date(),
      });
    } catch (logError) {
      console.error("Admin account activity log failed.", errorDetails(logError));
    }
    return NextResponse.json({ success: true, created: true, message: "Admin account created successfully." });
  } catch (error) {
    console.error("Admin signup unexpected server failure.", errorDetails(error));
    return errorResponse({
      code: "SIGNUP_SERVER_ERROR",
      message: "Unable to create the admin account right now. Please try again.",
      status: 500,
      step: createdUserUid ? "FIRESTORE_ADMIN_AUTHORIZATION" : "OTHER",
      error,
      firebaseUserCreated: Boolean(createdUserUid),
    });
  }
}
