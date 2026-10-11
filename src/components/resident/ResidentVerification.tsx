"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { OFFICIAL_PUROKS } from "@/lib/purokConfig";

export type VerificationStatus = "idle" | "checking" | "verified" | "unverified" | "error";

export function ResidentLocationSelect({
  id,
  value,
  onChange,
  required = true,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <select
      id={id}
      value={value}
      required={required}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-[#17213A] outline-none transition-all focus:border-[#6D3FE7] focus:ring-2 focus:ring-[#6D3FE7]/20"
    >
      <option value="">Select your Purok</option>
      {OFFICIAL_PUROKS.map((purok) => (
        <option key={purok} value={purok}>
          {purok}
        </option>
      ))}
    </select>
  );
}

export function useResidentVerification(fullName: string, purok: string) {
  const [result, setResult] = useState<{ key: string; status: VerificationStatus }>({ key: "", status: "idle" });

  useEffect(() => {
    const cleanName = fullName.trim();
    if (!cleanName || !purok) {
      return;
    }

    const key = `${cleanName}\u0000${purok}`;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setResult({ key, status: "checking" });
      try {
        const response = await fetch("/api/residents/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fullName: cleanName, purok }),
          signal: controller.signal,
        });
        const result = (await response.json()) as { verified?: boolean; unavailable?: boolean };
        setResult({ key, status: result.unavailable || response.status === 503 ? "error" : response.ok && result.verified === true ? "verified" : "unverified" });
      } catch (error) {
        if ((error as { name?: string }).name !== "AbortError") setResult({ key, status: "error" });
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [fullName, purok]);

  const key = `${fullName.trim()}\u0000${purok}`;
  return !fullName.trim() || !purok ? "idle" : result.key === key ? result.status : "checking";
}

export function ResidentVerificationPanel({ status }: { status: VerificationStatus }) {
  if (status === "idle") return null;
  if (status === "checking") {
    return <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600"><Loader2 className="h-4 w-4 animate-spin" /> Checking resident registry...</div>;
  }
  if (status === "verified") {
    return <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /><span><strong className="block">VERIFIED RESIDENT</strong>Your name is registered in the Barangay Poblacion North resident registry. The selected Purok is an official Barangay Poblacion North purok.</span></div>;
  }
  if (status === "error") return <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"><XCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /><span><strong className="block">VERIFICATION TEMPORARILY UNAVAILABLE</strong>We could not check the Resident Registry right now. Please try again shortly.</span></div>;
  return <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"><XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" /><span><strong className="block">UNABLE TO VERIFY</strong>We could not find your name in the Barangay Poblacion North resident registry. Please check your information or visit the Barangay Hall for assistance.</span></div>;
}
