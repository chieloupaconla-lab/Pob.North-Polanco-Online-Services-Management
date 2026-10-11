"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ADMIN_PASSWORD_REQUIREMENT_MESSAGE, isValidAdminPassword } from "@/lib/passwordUtils";

export default function AdminResetPasswordPage() {
  const [actionCode] = useState(() => typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("oobCode") || "");
  const [checkingCode, setCheckingCode] = useState(() => Boolean(actionCode));
  const [validCode, setValidCode] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(() => actionCode ? "" : "This password reset link is invalid or has expired.");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!actionCode) return;
    void verifyPasswordResetCode(auth, actionCode)
      .then(() => setValidCode(true))
      .catch((verifyError) => { console.error("Password reset code verification error:", verifyError); setError("This password reset link is invalid or has expired."); })
      .finally(() => setCheckingCode(false));
  }, [actionCode]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!isValidAdminPassword(password)) { setError(ADMIN_PASSWORD_REQUIREMENT_MESSAGE); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setSaving(true);
    try {
      await confirmPasswordReset(auth, actionCode, password);
      setSuccess(true);
    } catch (resetError) {
      console.error("Password reset confirmation error:", resetError);
      const code = resetError && typeof resetError === "object" && "code" in resetError ? String((resetError as { code?: unknown }).code) : "";
      setError(code === "auth/expired-action-code" || code === "auth/invalid-action-code" ? "This password reset link is invalid or has expired. Please request a new password reset link." : "Unable to reset your password. Please request a new reset link and try again.");
    } finally { setSaving(false); }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50"><div className="flex min-h-screen items-center justify-center px-4 py-10"><div className="w-full max-w-md"><Link href="/admin/login" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-violet-700"><ArrowLeft size={17} /> Back to Admin Login</Link><div className="overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-xl shadow-violet-100/50"><div className="bg-gradient-to-br from-violet-600 to-indigo-600 px-6 py-8 text-center text-white sm:px-8"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20"><ShieldCheck size={30} /></div><h1 className="mt-5 text-2xl font-bold">Reset Admin Password</h1><p className="mt-2 text-sm leading-5 text-violet-100">Create a new secure password for the Admin Portal.</p></div><div className="p-6 sm:p-8">
      {checkingCode && <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500"><Loader2 className="animate-spin" size={18} /> Verifying reset link...</div>}
      {!checkingCode && !validCode && !success && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-5 text-red-700">{error}<Link href="/admin/forgot-password" className="mt-3 block font-semibold text-red-800 underline">Request New Reset Link</Link></div>}
      {success && <div className="text-center"><CheckCircle2 className="mx-auto text-green-600" size={42} /><h2 className="mt-4 text-lg font-bold text-slate-900">Password Reset Successful</h2><p className="mt-2 text-sm leading-6 text-slate-600">Your password has been changed. You can now sign in to the Admin Portal.</p><Link href="/admin/login" className="mt-5 inline-flex rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700">Back to Admin Login</Link></div>}
      {!checkingCode && validCode && !success && <>{error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}<form onSubmit={handleSubmit} className="space-y-5"><PasswordField id="password" label="New Password" value={password} onChange={setPassword} visible={showPassword} onToggle={() => setShowPassword((value) => !value)} disabled={saving} /><PasswordField id="confirmPassword" label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} visible={showConfirm} onToggle={() => setShowConfirm((value) => !value)} disabled={saving} /><div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-6 text-slate-600"><p className="font-semibold text-slate-700">Password must contain:</p><p>✓ At least 8 characters</p><p>✓ At least 1 uppercase letter</p><p>✓ At least 1 symbol</p></div><button type="submit" disabled={saving} className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-400">{saving ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : "Reset Password"}</button></form></>}
    </div></div><p className="mt-6 text-center text-xs text-slate-400">e-Barangay • Barangay Poblacion North</p></div></div></main>
  );
}

function PasswordField({ id, label, value, onChange, visible, onToggle, disabled }: { id: string; label: string; value: string; onChange: (value: string) => void; visible: boolean; onToggle: () => void; disabled: boolean }) {
  return <div><label htmlFor={id} className="mb-2 block text-sm font-semibold text-slate-700">{label}</label><div className="relative"><input id={id} type={visible ? "text" : "password"} required minLength={8} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100 disabled:bg-slate-50" /><button type="button" onClick={onToggle} disabled={disabled} aria-label={visible ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100">{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>;
}
