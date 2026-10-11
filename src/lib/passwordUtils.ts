export const ADMIN_PASSWORD_REQUIREMENT_MESSAGE =
  "Password must be at least 8 characters and contain at least 1 uppercase letter and 1 symbol (for example: _ ).";

const ADMIN_PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;

export function isValidAdminPassword(password: string) {
  return ADMIN_PASSWORD_PATTERN.test(password);
}
