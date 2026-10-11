import { NextResponse } from "next/server";
import { getBearerToken, verifyAdminTokenDetailed } from "@/lib/adminAuthorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const result = await verifyAdminTokenDetailed(getBearerToken(request));
  const authorized = Boolean(result.admin);
  const tokenError = result.error?.code?.startsWith("auth/") === true;
  const serviceUnavailable = Boolean(result.error) && !tokenError;
  const responseStatus = serviceUnavailable
    ? 503
    : authorized
      ? 200
      : result.tokenPresent
        ? result.tokenVerified
          ? 403
          : 401
        : 401;
  const responseCode = serviceUnavailable
    ? "ADMIN_AUTHORIZATION_SERVICE_UNAVAILABLE"
    : authorized
      ? "AUTHORIZED"
      : result.tokenVerified
        ? "ACCOUNT_NOT_AUTHORIZED"
        : "INVALID_ADMIN_TOKEN";
  console.info("Admin access request received", {
    firebaseIdTokenPresent: result.tokenPresent,
    firebaseTokenVerification: result.tokenVerified ? "SUCCESS" : "FAIL",
    firebaseAuthenticatedUser: result.tokenVerified ? "YES" : "NO",
    adminRecordFound: result.adminRecordFound ? "YES" : "NO",
    adminRecordActive: result.adminRecordActive ? "YES" : "NO",
    adminRoleValid: result.adminRoleValid ? "YES" : "NO",
    finalAuthorization: authorized ? "ALLOWED" : "DENIED",
  });
  console.info("Admin access authorization check.", {
    method: request.method,
    tokenPresent: result.tokenPresent,
    tokenVerified: result.tokenVerified,
    hasAdminClaim: result.hasAdminClaim,
    adminRecordFound: result.adminRecordFound,
    adminRecordActive: result.adminRecordActive,
    adminRoleValid: result.adminRoleValid,
    firebaseAdminConfigPresent: result.firebaseAdminConfigPresent,
    authorizationResult: authorized ? "ALLOWED" : "DENIED",
    ...(result.error ? { error: result.error } : {}),
  });

  const debug = process.env.NODE_ENV === "development"
    ? {
        tokenPresent: result.tokenPresent,
        tokenVerified: result.tokenVerified,
        hasAdminClaim: result.hasAdminClaim,
        adminRecordFound: result.adminRecordFound,
        adminRecordActive: result.adminRecordActive,
        adminRoleValid: result.adminRoleValid,
        firebaseAdminConfigPresent: result.firebaseAdminConfigPresent,
        error: result.error,
      }
    : undefined;

  return NextResponse.json(
    {
      authorized,
      code: responseCode,
      ...(serviceUnavailable
        ? { message: "Admin authorization is temporarily unavailable. Please try again shortly." }
        : {}),
      ...(debug ? { debug } : {}),
    },
    { status: responseStatus }
  );
}
