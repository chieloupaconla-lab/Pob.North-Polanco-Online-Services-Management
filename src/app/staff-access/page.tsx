"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function StaffAccessPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (!pin) {
      setError("Please enter your staff access PIN.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/staff-access/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
       const result = (await response.json().catch(() => ({}))) as { success?: boolean; message?: string };
       if (response.status === 401) {
         setError("Invalid PIN");
         return;
       }
       if (response.status >= 500) {
         setError("Staff access is temporarily unavailable. Please contact the system administrator.");
         return;
       }
       if (!response.ok || result.success !== true) {
         setError(result.message || "Unable to verify staff access. Please try again.");
        return;
      }
      router.replace("/admin/login");
    } catch {
      setError("Unable to verify staff access. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" />
          Back to Public Portal
        </Link>
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Staff Access</h1>
              <p className="text-xs text-slate-500">Authorized personnel only</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="staff-pin" className="mb-2 block text-sm font-semibold text-slate-700">Access PIN</label>
              <div className="relative">
                <input
                  id="staff-pin"
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  autoComplete="off"
                  value={pin}
                  onChange={(event) => { setPin(event.target.value); setError(""); }}
                  disabled={loading}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100 disabled:bg-slate-50"
                />
                <button type="button" onClick={() => setShowPin((value) => !value)} disabled={loading} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label={showPin ? "Hide PIN" : "Show PIN"}>
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700">{error}</p>}

            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Checking..." : "Continue"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
