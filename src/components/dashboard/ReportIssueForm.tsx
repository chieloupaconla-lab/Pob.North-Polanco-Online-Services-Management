"use client";

import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, Send } from "lucide-react";

const ISSUE_CATEGORIES = [
  "Damaged Streetlight",
  "Clogged Drainage",
  "Road / Pathway Hazard",
  "Public Facility Damage",
  "Waste Management Concern",
  "Other Infrastructure Issue",
];

export default function ReportIssueForm() {
  const [category, setCategory] = useState(ISSUE_CATEGORIES[0]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [contact, setContact] = useState("");
  const [submitted, setSubmitted] = useState(false);

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
          Issue Report Submitted
        </h2>
        <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
          Thank you for helping improve Poblacion North. Your report on{" "}
          <strong className="text-[#17213A]">{category}</strong> has been
          forwarded to barangay personnel for inspection.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
          <button
            onClick={() => setSubmitted(false)}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#6D3FE7] hover:bg-[#5B32CC] transition-colors"
          >
            Report Another Issue
          </button>
          <a
            href="/dashboard"
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4 max-w-3xl"
    >
      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-red-50 text-[#E96B73] flex items-center justify-center">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#17213A]">
            Facility / Infrastructure Report
          </h2>
          <p className="text-[11px] text-[#6B7280]">
            Provide accurate details so personnel can locate and act on the concern.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="category" className="text-[11px] font-semibold text-[#17213A]">
            Issue Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-[#17213A] bg-white focus:outline-none focus:ring-2 focus:ring-[#6D3FE7]/20 focus:border-[#6D3FE7] transition-all"
          >
            {ISSUE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <Input id="title" label="Report Title" value={title} onChange={setTitle} placeholder="Damaged streetlight near waiting shed" required />
        <Input id="location" label="Exact Location" value={location} onChange={setLocation} placeholder="Purok 3, Mabini Street" required />

        <div className="space-y-1.5 sm:col-span-2">
          <label htmlFor="description" className="text-[11px] font-semibold text-[#17213A]">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the concern, when it started, and any safety risk."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-[#17213A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6D3FE7]/20 focus:border-[#6D3FE7] transition-all resize-none"
          />
        </div>

        <Input id="contact" label="Contact Number" value={contact} onChange={setContact} placeholder="09XX XXX XXXX" required />
      </div>

      <button
        type="submit"
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#6D3FE7] hover:bg-[#5B32CC] text-white text-xs font-bold shadow-sm hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6D3FE7]/40 focus-visible:ring-offset-2 transition-all"
      >
        <Send className="w-4 h-4" />
        Submit Report
      </button>
    </form>
  );
}

function Input({
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