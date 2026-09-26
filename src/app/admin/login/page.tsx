"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowLeft,
  LockKeyhole,
  UserPlus,
  Loader2,
} from "lucide-react";
import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setErrorMessage("");
    setLoading(true);

    try {
      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

      console.log(
        "Admin signed in:",
        userCredential.user.email
      );

      window.location.href = "/admin";
    } catch (error: unknown) {
      console.error("Firebase login error:", error);

      if (
        error &&
        typeof error === "object" &&
        "code" in error
      ) {
        const firebaseError = error as {
          code: string;
        };

        switch (firebaseError.code) {
          case "auth/invalid-credential":
            setErrorMessage(
              "Invalid email or password. Please check your credentials and try again."
            );
            break;

          case "auth/user-not-found":
            setErrorMessage(
              "No account was found with this email address."
            );
            break;

          case "auth/wrong-password":
            setErrorMessage(
              "Incorrect password. Please try again."
            );
            break;

          case "auth/invalid-email":
            setErrorMessage(
              "Please enter a valid email address."
            );
            break;

          case "auth/user-disabled":
            setErrorMessage(
              "This account has been disabled."
            );
            break;

          case "auth/too-many-requests":
            setErrorMessage(
              "Too many login attempts. Please wait a while and try again."
            );
            break;

          case "auth/network-request-failed":
            setErrorMessage(
              "Network error. Please check your internet connection."
            );
            break;

          default:
            setErrorMessage(
              "Unable to sign in. Please check your email and password."
            );
        }
      } else {
        setErrorMessage(
          "Unable to sign in. Please try again."
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

          {/* Back to Public Portal */}
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-violet-700"
          >
            <ArrowLeft size={17} />
            Back to Public Portal
          </Link>

          <div className="overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-xl shadow-violet-100/50">

            {/* Header */}
            <div className="bg-gradient-to-br from-violet-600 to-indigo-600 px-6 py-8 text-center text-white sm:px-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                <ShieldCheck size={32} />
              </div>

              <h1 className="mt-5 text-2xl font-bold">
                Admin Personnel Login
              </h1>

              <p className="mt-2 text-sm leading-5 text-violet-100">
                Barangay Poblacion North Administration Portal
              </p>
            </div>

            <div className="p-6 sm:p-8">

              {/* Security Notice */}
              <div className="mb-6 rounded-2xl border border-violet-100 bg-violet-50 p-4">
                <div className="flex gap-3">
                  <LockKeyhole
                    size={19}
                    className="mt-0.5 shrink-0 text-violet-600"
                  />

                  <p className="text-xs leading-5 text-slate-600">
                    This portal is intended only for authorized
                    Barangay Poblacion North personnel.
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

              {/* Login Form */}
              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >

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
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMessage("");
                    }}
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
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorMessage("");
                      }}
                      placeholder="Enter your password"
                      disabled={loading}
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:bg-slate-50"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(!showPassword)
                      }
                      disabled={loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed"
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Sign In */}
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
                      Signing In...
                    </>
                  ) : (
                    "Sign In to Admin Portal"
                  )}
                </button>
              </form>

              {/* Signup */}
              <div className="mt-6 border-t border-slate-100 pt-5 text-center">
                <p className="text-sm text-slate-500">
                  Don't have an admin account?
                </p>

                <Link
                  href="/admin/signup"
                  className="mt-2 inline-flex items-center gap-2 rounded-xl bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
                >
                  <UserPlus size={17} />
                  Create Admin Account
                </Link>
              </div>

              {/* Footer Notice */}
              <div className="mt-5 text-center">
                <p className="text-xs leading-5 text-slate-400">
                  Authorized personnel only. Access to
                  administrative functions is restricted.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            e-Barangay • Barangay Poblacion North
          </p>
        </div>
      </div>
    </main>
  );
}