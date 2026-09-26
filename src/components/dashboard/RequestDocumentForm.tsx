"use client";

import React, { useState } from "react";
import {
  FileText,
  CheckCircle2,
  Send,
  Hash,
  Receipt,
  Home,
  Wallet,
  Briefcase,
  Store,
  UserCheck,
} from "lucide-react";

interface DocumentType {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}

const DOCUMENT_TYPES: DocumentType[] = [
  {
    id: "cedula",
    name: "Cedula",
    description: "Community Tax Certificate (CTC) for employment and local transactions.",
    icon: Receipt,
    accent: "bg-[#F0EAFF] text-[#6D3FE7]",
  },
  {
    id: "barangay-clearance",
    name: "Barangay Clearance",
    description: "General clearance for employment, business, or local requirements.",
    icon: FileText,
    accent: "bg-blue-50 text-[#4D8FEA]",
  },
  {
    id: "certificate-of-residency",
    name: "Certificate of Residency",
    description: "Proof of residency within Barangay Poblacion North.",
    icon: Home,
    accent: "bg-emerald-50 text-[#35B978]",
  },
  {
    id: "certificate-of-indigency",
    name: "Certificate of Indigency",
    description: "Certification for financial or medical assistance requirements.",
    icon: Wallet,
    accent: "bg-amber-50 text-[#E5B64A]",
  },
  {
    id: "first-time-jobseeker",
    name: "First-Time Jobseeker",
    description: "Certificate under RA 11261 for first-time jobseekers.",
    icon: Briefcase,
    accent: "bg-violet-50 text-[#7C3AED]",
  },
  {
    id: "business-clearance",
    name: "Barangay Business Clearance",
    description: "Clearance required for business permit applications.",
    icon: Store,
    accent: "bg-rose-50 text-[#E96B73]",
  },
];

export default function RequestDocumentForm() {
  const [selectedId, setSelectedId] = useState<string>("cedula");
  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [purok, setPurok] = useState("");
  const [purpose, setPurpose] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const selectedDoc = DOCUMENT_TYPES.find((d) => d.id === selectedId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 shadow-2xs text-center max-w-2xl mx-auto space-y-4">
        <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#35B978] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-extrabold text-[#17213A]">
          Request Submitted Successfully
        </h2>
        <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
          Your <strong className="text-[#17213A]">{selectedDoc?.name}</strong>{" "}
          request has been received. Barangay personnel will verify your
          residency and contact you at{" "}
          <strong className="text-[#17213A]">{contact || "your number"}</strong>{" "}
          once it is ready.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
          <button
            onClick={() => {
              setSubmitted(false);
              setFullName("");
              setContact("");
              setPurok("");
              setPurpose("");
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#6D3FE7] hover:bg-[#5B32CC] transition-colors"
          >
            Submit Another Request
          </button>
          <a
            href="/dashboard/my-requests"
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            View My Requests
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
      {/* Document Type Selection */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#17213A]">
            Select Document Type
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Choose the barangay document you would like to request.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {DOCUMENT_TYPES.map((doc) => {
            const Icon = doc.icon;
            const isSelected = selectedId === doc.id;
            return (
              <button
                key={doc.id}
                type="button"
                onClick={() => setSelectedId(doc.id)}
                aria-pressed={isSelected}
                className={`text-left p-4 rounded-xl border transition-all duration-150 flex gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6D3FE7]/30 ${
                  isSelected
                    ? "border-[#6D3FE7] bg-[#F0EAFF]/60 shadow-2xs"
                    : "border-slate-200 hover:border-[#6D3FE7]/40 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${doc.accent}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-[#17213A]">
                      {doc.name}
                    </h3>
                    {isSelected && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#6D3FE7]" />
                    )}
                  </div>
                  <p className="text-[11px] text-[#6B7280] mt-1 leading-snug">
                    {doc.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Request Form */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4 h-fit lg:sticky lg:top-24">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-[#6D3FE7]" />
          <h2 className="text-base font-bold text-[#17213A]">
            Resident Information
          </h2>
        </div>

        <div className="space-y-3.5">
          <Field
            id="fullName"
            label="Full Name"
            value={fullName}
            onChange={setFullName}
            placeholder="Your Full Name"
            required
          />
          <Field
            id="contact"
            label="Contact Number"
            value={contact}
            onChange={setContact}
            placeholder="09XX XXX XXXX"
            required
          />
          <Field
            id="purok"
            label="Purok / Street (Poblacion North)"
            value={purok}
            onChange={setPurok}
            placeholder="Purok 3, Mabini Street"
            required
          />
          <div className="space-y-1.5">
            <label
              htmlFor="purpose"
              className="text-[11px] font-semibold text-[#17213A]"
            >
              Purpose
            </label>
            <textarea
              id="purpose"
              rows={3}
              required
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="State the purpose of your request"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-[#17213A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6D3FE7]/20 focus:border-[#6D3FE7] transition-all resize-none"
            />
          </div>
        </div>

        <div className="rounded-xl bg-[#F0EAFF]/50 border border-purple-100 p-3 flex items-start gap-2">
          <Hash className="w-4 h-4 text-[#6D3FE7] shrink-0 mt-0.5" />
          <p className="text-[11px] text-[#6B7280] leading-snug">
            Selected:{" "}
            <strong className="text-[#17213A]">{selectedDoc?.name}</strong>.
            Submitting a Purok or street alone is not proof of residency.
          </p>
        </div>

        <button
          type="submit"
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#6D3FE7] hover:bg-[#5B32CC] text-white text-xs font-bold shadow-sm hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6D3FE7]/40 focus-visible:ring-offset-2 transition-all"
        >
          <Send className="w-4 h-4" />
          Submit Request
        </button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-[11px] font-semibold text-[#17213A]">
        {label}
      </label>
      <input
        id={id}
        type="text"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-[#17213A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6D3FE7]/20 focus:border-[#6D3FE7] transition-all"
      />
    </div>
  );
}
