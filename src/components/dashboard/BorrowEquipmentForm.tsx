"use client";

import React, { useState } from "react";
import {
  Package,
  CheckCircle2,
  Send,
  Minus,
  Plus,
  Users,
} from "lucide-react";

interface EquipmentItem {
  id: string;
  name: string;
  available: number;
  icon: string;
  accent: string;
}

const EQUIPMENT: EquipmentItem[] = [
  { id: "chairs", name: "Plastic Chairs", available: 120, icon: "🪑", accent: "bg-[#F0EAFF]" },
  { id: "tables", name: "Folding Tables", available: 30, icon: "🪵", accent: "bg-blue-50" },
  { id: "tents", name: "Canopy Tents", available: 8, icon: "⛺", accent: "bg-emerald-50" },
  { id: "sound", name: "Sound System", available: 3, icon: "🔊", accent: "bg-amber-50" },
  { id: "tarpaulin", name: "Tarpaulin / Stand", available: 15, icon: "🎪", accent: "bg-rose-50" },
  { id: "tables-tennis", name: "Sports Equipment Set", available: 5, icon: "🏓", accent: "bg-violet-50" },
];

export default function BorrowEquipmentForm() {
  const [qty, setQty] = useState<Record<string, number>>({});
  const [borrower, setBorrower] = useState("");
  const [contact, setContact] = useState("");
  const [witness, setWitness] = useState("");
  const [witnessContact, setWitnessContact] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const updateQty = (id: string, delta: number, max: number) => {
    setQty((prev) => {
      const next = Math.min(Math.max((prev[id] ?? 0) + delta, 0), max);
      return { ...prev, [id]: next };
    });
  };

  const selectedCount = Object.values(qty).reduce((a, b) => a + b, 0);

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
          Borrowing Request Submitted
        </h2>
        <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
          Your request for {selectedCount} item(s) has been received. Please
          await confirmation from barangay personnel before claiming the
          equipment.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
          <button
            onClick={() => {
              setSubmitted(false);
              setQty({});
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#6D3FE7] hover:bg-[#5B32CC] transition-colors"
          >
            New Borrowing Request
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
      className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6"
    >
      {/* Equipment List */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#35B978] flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#17213A]">
              Available Equipment
            </h2>
            <p className="text-[11px] text-[#6B7280]">
              Select the equipment and quantity you need.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {EQUIPMENT.map((item) => {
            const current = qty[item.id] ?? 0;
            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-colors ${
                  current > 0
                    ? "border-[#35B978] bg-emerald-50/40"
                    : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${item.accent}`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-[#17213A] truncate">
                        {item.name}
                      </h3>
                      <p className="text-[11px] text-[#6B7280]">
                        {item.available} available
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => updateQty(item.id, -1, item.available)}
                    disabled={current === 0}
                    aria-label={`Decrease ${item.name} quantity`}
                    className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-[#17213A]">
                    {current}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQty(item.id, 1, item.available)}
                    disabled={current >= item.available}
                    aria-label={`Increase ${item.name} quantity`}
                    className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Borrower Details */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4 h-fit lg:sticky lg:top-24">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#6D3FE7]" />
          <h2 className="text-base font-bold text-[#17213A]">
            Borrower & Witness
          </h2>
        </div>

        <div className="space-y-3.5">
          <Input id="borrower" label="Borrower Full Name" value={borrower} onChange={setBorrower} placeholder="Your Full Name" required />
          <Input id="contact" label="Borrower Contact" value={contact} onChange={setContact} placeholder="09XX XXX XXXX" required />
          <Input id="witness" label="Witness / Emergency Contact" value={witness} onChange={setWitness} placeholder="Maria Dela Cruz" required />
          <Input id="witnessContact" label="Witness Contact Number" value={witnessContact} onChange={setWitnessContact} placeholder="09XX XXX XXXX" required />
        </div>

        <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-[11px] text-amber-900 leading-snug">
          Late returns, lost, or damaged equipment are subject to barangay
          penalty policies.
        </div>

        <button
          type="submit"
          disabled={selectedCount === 0}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#6D3FE7] hover:bg-[#5B32CC] disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold shadow-sm hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6D3FE7]/40 focus-visible:ring-offset-2 transition-all"
        >
          <Send className="w-4 h-4" />
          Submit Borrowing Request
        </button>
        {selectedCount > 0 && (
          <p className="text-[11px] text-center text-[#6B7280]">
            {selectedCount} item(s) selected
          </p>
        )}
      </div>
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