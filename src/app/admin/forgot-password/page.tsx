"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, Loader2, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    const cleanEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, cleanEmail, {
        url: `${window.location.origin}/admin/reset-password`,
        handleCodeInApp: true,
      });
      setMessage("If an account exists for this email address, a password reset email has been sent.");
    } catch {
      setMessage("If an account exists for this email address, a password reset email has been sent.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <Link href="/admin/login" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-violet-700">
            <ArrowLeft size={17} /> Back to Admin Login
          </Link>
          <div className="overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-xl shadow-violet-100/50">
            <div className="bg-gradient-to-br from-violet-600 to-indigo-600 px-6 py-8 text-center text-white sm:px-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20"><ShieldCheck size={30} /></div>
               <h1 className="mt-5 text-2xl font-bold">Reset Admin Password</h1>
               <p className="mt-2 text-sm leading-5 text-violet-100">Enter your admin email address and we&apos;ll send you a password reset link.</p>
            </div>
            <div className="p-6 sm:p-8">
              <div className="mb-6 rounded-2xl border border-violet-100 bg-violet-50 p-4"><div className="flex gap-3"><LockKeyhole size={19} className="mt-0.5 shrink-0 text-violet-600" /><p className="text-xs leading-5 text-slate-600">Enter the email address associated with your Firebase Authentication admin account.</p></div></div>
              {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
              {message && <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm leading-5 text-green-700">{message}</div>}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div><label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">Email Address</label><div className="relative"><Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input id="email" type="email" required value={email} onChange={(event) => { setEmail(event.target.value); setError(""); setMessage(""); }} placeholder="Enter your email address" disabled={loading} className="w-full rounded-xl border border-slate-300 py-3 pl-11 pr-4 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-50" /></div></div>
                <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-400">{loading ? <><Loader2 size={18} className="animate-spin" /> Sending...</> : "Send Reset Link"}</button>
              </form>
              <Link href="/admin/login" className="mt-5 block text-center text-sm font-semibold text-violet-700 hover:text-violet-900">Back to Admin Login</Link>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-slate-400">e-Barangay • Barangay Poblacion North</p>
        </div>
      </div>
    </main>
  );
}
