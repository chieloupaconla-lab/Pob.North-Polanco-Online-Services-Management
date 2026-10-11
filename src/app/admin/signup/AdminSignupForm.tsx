"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  UserPlus,
  Eye,
  EyeOff,
  ArrowLeft,
  ShieldCheck,
  LockKeyhole,
  Loader2,
} from "lucide-react";
import { formatNameForDisplay } from "@/lib/nameUtils";
import {
  ADMIN_PASSWORD_REQUIREMENT_MESSAGE,
  isValidAdminPassword,
} from "@/lib/passwordUtils";

const ADMIN_SIGNUP_FALLBACK_ERROR =
  "Unable to create the admin account right now. Please try again.";

type AdminSignupResponse = {
  created?: boolean;
  code?: string;
  message?: string;
  debug?: {
    step?: string;
    name?: string;
    code?: string;
    message?: string;
    firebaseUserCreated?: boolean;
    adminAuthorizationCreated?: boolean;
  };
};

async function readAdminSignupResponse(
  response: Response
): Promise<AdminSignupResponse> {
  const body = await response.text();
  if (!body.trim()) return {};

  try {
    const parsed: unknown = JSON.parse(body);
    if (!parsed || typeof parsed !== "object") return {};

    const data = parsed as Record<string, unknown>;
    return {
      created: data.created === true ? true : undefined,
      code: typeof data.code === "string" ? data.code : undefined,
      message: typeof data.message === "string" ? data.message : undefined,
    };
  } catch {
    return {};
  }
}

export default function AdminSignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setErrorMessage("");
    setSuccessMessage("");

  };

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");
    const formattedName = formatNameForDisplay(formData.fullName);

    // Check password confirmation
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (!isValidAdminPassword(formData.password)) {
      setErrorMessage(ADMIN_PASSWORD_REQUIREMENT_MESSAGE);
      return;
    }

    // Check full name
    if (!formattedName) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: formattedName, email: formData.email, password: formData.password }),
      });
        const result = await readAdminSignupResponse(response);
        if (!response.ok) {
          if (result.code === "UNAUTHORIZED") {
            router.replace("/staff-access");
            return;
          }

          if (process.env.NODE_ENV === "development" && result.debug) {
           setErrorMessage(
             `Signup failed.\nCode: ${result.debug.step || result.code || "OTHER"}\nReason: ${result.debug.message || result.message || ADMIN_SIGNUP_FALLBACK_ERROR}`
             + `\nFirebase Auth user created: ${result.debug.firebaseUserCreated ? "YES" : "NO"}`
             + `\nAdmin authorization created: ${result.debug.adminAuthorizationCreated ? "YES" : "NO"}`
           );
           return;
         }

         const message = result.code === "UNAUTHORIZED"
           ? "You are not authorized to create an admin account."
           : result.code === "EMAIL_ALREADY_EXISTS"
             ? "An admin account with this email already exists."
            : result.code === "FIREBASE_ADMIN_CONFIG_ERROR"
              ? "Admin account creation is not configured on the server. Please contact the system administrator."
            : result.code === "ADMIN_AUTHORIZATION_ERROR"
              ? "The account could not be authorized as an administrator. Please contact the system administrator."
              : result.code === "FIREBASE_AUTH_ERROR" || result.code === "SIGNUP_SERVER_ERROR"
                ? "Unable to create the admin account. Please try again."
               : result.message || ADMIN_SIGNUP_FALLBACK_ERROR;
         throw new Error(message);
       }

       if (result.created !== true) {
         throw new Error(ADMIN_SIGNUP_FALLBACK_ERROR);
       }

      setSuccessMessage(
         "Admin account created successfully. You can now sign in to the Admin Portal."
      );

      setFormData({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

    } catch (error: unknown) {
      if (error instanceof Error && !("code" in error)) {
        setErrorMessage(error.message);
        return;
      }

      if (
        error &&
        typeof error === "object" &&
        "code" in error
      ) {
        const firebaseError = error as {
          code: string;
        };

        switch (firebaseError.code) {
          case "auth/email-already-in-use":
            setErrorMessage(
              "This email address is already registered."
            );
            break;

          case "auth/invalid-email":
            setErrorMessage(
              "Please enter a valid email address."
            );
            break;

          case "auth/weak-password":
            setErrorMessage(
              "The password is too weak. Please use at least 8 characters."
            );
            break;

          case "auth/operation-not-allowed":
            setErrorMessage(
              "Email and password authentication is not enabled in Firebase."
            );
            break;

          case "auth/network-request-failed":
            setErrorMessage(
              "Network error. Please check your internet connection and try again."
            );
            break;

          default:
            setErrorMessage(
              "Unable to create the admin account. Please try again."
            );
        }
      } else {
        setErrorMessage(
          "Unable to create the admin account. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">

          {/* Back to Login */}
          <Link
            href="/admin/login"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-violet-700"
          >
            <ArrowLeft size={17} />
            Back to Admin Login
          </Link>

          {/* Main Card */}
          <div className="overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-xl shadow-violet-100/50">

            {/* Header */}
            <div className="bg-gradient-to-br from-violet-600 to-indigo-600 px-6 py-8 text-center text-white sm:px-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                <UserPlus size={30} />
              </div>

              <h1 className="mt-5 text-2xl font-bold">
                Create Admin Account
              </h1>

              <p className="mt-2 text-sm leading-5 text-violet-100">
                Register an authorized Barangay Personnel account
              </p>
            </div>

            {/* Form Area */}
            <div className="p-6 sm:p-8">

              {/* Security Notice */}
              <div className="mb-6 rounded-2xl border border-violet-100 bg-violet-50 p-4">
                <div className="flex gap-3">
                  <ShieldCheck
                    size={19}
                    className="mt-0.5 shrink-0 text-violet-600"
                  />

                  <p className="text-xs leading-5 text-slate-600">
                    Admin registration is intended only for
                    authorized Barangay Poblacion North personnel.
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm leading-5 text-red-700">
                    {errorMessage}
                  </p>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                  <p className="text-sm leading-5 text-green-700">
                    {successMessage}
                  </p>
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

                {/* Full Name */}
                <div>
                  <label
                    htmlFor="fullName"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Full Name
                  </label>

                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Email Address
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email address"
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                  />
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                      disabled={loading}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      disabled={loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>

                  <p className="mt-1.5 text-xs text-slate-400">
                      At least 8 characters, 1 uppercase letter, and 1 symbol (for example: _ ).
                  </p>
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Confirm Password
                  </label>

                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      disabled={loading}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />

                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      disabled={loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed"
                      aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                      aria-pressed={showConfirmPassword}
                      title={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 focus:outline-none focus:ring-4 focus:ring-violet-200 disabled:cursor-not-allowed disabled:bg-violet-400"
                >
                  {loading ? (
                    <>
                      <Loader2
                        size={18}
                        className="animate-spin"
                      />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      Create Admin Account
                    </>
                  )}
                </button>
              </form>

              {/* Login Link */}
              <div className="mt-6 border-t border-slate-100 pt-5 text-center">
                <p className="text-sm text-slate-500">
                  Already have an admin account?
                </p>

                <Link
                  href="/admin/login"
                  className="mt-1 inline-block text-sm font-semibold text-violet-600 hover:text-violet-700"
                >
                  Sign in here
                </Link>
              </div>

              {/* Security */}
              <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
                <LockKeyhole size={14} />
                <span>Authorized personnel only</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-slate-400">
            e-Barangay • Barangay Poblacion North
          </p>
        </div>
      </div>
    </main>
  );
}
