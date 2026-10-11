import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const STAFF_ACCESS_COOKIE = "staff_access";
export const STAFF_ACCESS_MAX_AGE = 10 * 60;

function getPin() {
  const pin = process.env.ADMIN_ACCESS_PIN;
  return typeof pin === "string" && pin.length > 0 ? pin : null;
}

function sign(value: string, pin: string) {
  return createHmac("sha256", pin).update(value).digest("base64url");
}

export function verifyStaffAccessToken(token: string) {
  const pin = getPin();
  const [timestamp, nonce, signature] = token.split(".");
  if (!pin || !timestamp || !nonce || !signature) return false;

  const issuedAt = Number(timestamp);
  const now = Date.now();
  if (!Number.isSafeInteger(issuedAt)) return false;
  if (now - issuedAt > STAFF_ACCESS_MAX_AGE * 1000 || issuedAt > now) return false;

  const expectedSignature = Buffer.from(sign(`${timestamp}.${nonce}`, pin));
  const receivedSignature = Buffer.from(signature);
  return expectedSignature.length === receivedSignature.length && timingSafeEqual(expectedSignature, receivedSignature);
}

export function isStaffAccessConfigured() {
  return getPin() !== null;
}

export function verifyStaffPin(enteredPin: string) {
  const expectedPin = getPin();
  if (!expectedPin) return false;

  const entered = Buffer.from(enteredPin);
  const expected = Buffer.from(expectedPin);
  return entered.length === expected.length && timingSafeEqual(entered, expected);
}

export function createStaffAccessToken() {
  const pin = getPin();
  if (!pin) return null;

  const payload = `${Date.now()}.${randomBytes(18).toString("base64url")}`;
  return `${payload}.${sign(payload, pin)}`;
}
