import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getResidentNameSearchParts,
  getResidentVerificationFields,
  isResidentVerificationReady,
  matchesResidentNameParts,
  verifyResidentIdentity,
} from "@/lib/residentVerification";
import { getFirebaseFailureDetails, isFirebaseServiceUnavailable } from "@/lib/firebaseErrors";
import { isTrustedAdminProfile } from "@/lib/adminAuthorization";

test("matches standard names case-insensitively with whitespace normalization", () => {
  assert.equal(matchesResidentNameParts("  juan   dela cruz santos ", "Santos, Juan, Dela Cruz"), true);
});

test("supports legacy first-name surname records", () => {
  assert.equal(matchesResidentNameParts("Juan Santos", "Juan Dela Cruz Santos"), true);
  assert.deepEqual(getResidentNameSearchParts("Santos, Juan, Dela Cruz"), {
    firstName: "juan",
    surname: "santos",
    tokens: ["santos", "juan", "dela", "cruz"],
  });
});

test("rejects an incorrect Purok without replacing the registered Purok", () => {
  const result = verifyResidentIdentity("Santos, Juan, Dela Cruz", "Purok Rizal", {
    fullName: "Santos, Juan, Dela Cruz",
    purok: "Purok Bonifacio",
  });
  assert.equal(result.verified, false);
  assert.equal(result.status, "PUROK_MISMATCH");
});

test("generates the indexed fields used by resident verification", () => {
  assert.deepEqual(getResidentVerificationFields("Santos, Juan, Dela Cruz", "purok bonifacio"), {
    verificationFirstName: "juan",
    verificationSurname: "santos",
    verificationNameTokens: ["santos", "juan", "dela", "cruz"],
    verificationNameVersion: 1,
    purokNormalized: "purok bonifacio",
  });
});

test("does not approve ambiguous duplicate candidates", () => {
  const results = [
    verifyResidentIdentity("Santos, Juan", "Purok Bonifacio", { fullName: "Santos, Juan", purok: "Purok Bonifacio" }),
    verifyResidentIdentity("Santos, Juan", "Purok Bonifacio", { fullName: "Santos, Juan", purok: "Purok Bonifacio" }),
  ];
  assert.equal(results.filter((result) => result.verified).length, 2);
  assert.notEqual(results.length, 1);
});

test("classifies quota and missing-index failures without logging error details", () => {
  assert.deepEqual(getFirebaseFailureDetails({ code: 8, message: "private data" }), { code: "8", kind: "quota" });
  assert.equal(isFirebaseServiceUnavailable({ code: "failed-precondition" }), true);
  assert.deepEqual(getFirebaseFailureDetails({ code: 7, message: "private data" }), { code: "7", kind: "permission" });
});

test("requires a complete, current migration marker", () => {
  assert.equal(isResidentVerificationReady(undefined), false);
  assert.equal(isResidentVerificationReady({ complete: false, version: 1 }), false);
  assert.equal(isResidentVerificationReady({ complete: true, version: 0 }), false);
  assert.equal(isResidentVerificationReady({ complete: true, version: 1 }), true);
});

test("requires an active admin profile with the admin role", () => {
  assert.equal(isTrustedAdminProfile(undefined), false);
  assert.equal(isTrustedAdminProfile({ role: "admin", active: false }), false);
  assert.equal(isTrustedAdminProfile({ role: "staff", active: true }), false);
  assert.equal(isTrustedAdminProfile({ role: "admin", active: true }), true);
});
