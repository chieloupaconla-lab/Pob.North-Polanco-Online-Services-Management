"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  MapPin,
  Clock,
  Phone,
  Mail,
  Building2,
  FileText,
  Users,
  ShieldCheck,
} from "lucide-react";

export default function InfoPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans antialiased">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 flex-1">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17213A] tracking-tight">
              Barangay Information
            </h1>
            <p className="text-sm text-[#6B7280]">
              Everything you need to know about Barangay Poblacion North.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F0EAFF] text-[#6D3FE7] flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-[#17213A]">
                  Barangay Hall
                </h2>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                The Barangay Hall is the center of local governance and public
                services in Poblacion North. Residents can visit for document
                processing, complaint filing, equipment borrowing, and more.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#4D8FEA] flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-[#17213A]">
                  Office Hours
                </h2>
              </div>
              <div className="text-sm text-slate-600 space-y-1">
                <p>
                  <strong>Monday – Friday:</strong> 8:00 AM – 5:00 PM
                </p>
                <p>
                  <strong>Saturday – Sunday:</strong> Closed
                </p>
                <p>
                  <strong>Holidays:</strong> Closed per national holiday
                  schedule
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#35B978] flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-[#17213A]">
                  Location
                </h2>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Barangay Hall, Poblacion North, Polanco, Zamboanga del Norte,
                Philippines 7106
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-[#7C3AED] flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-[#17213A]">
                  Contact
                </h2>
              </div>
              <div className="text-sm text-slate-600 space-y-1">
                <p>
                  <strong>Phone:</strong> (065) 123-4567
                </p>
                <p>
                  <strong>Email:</strong>{" "}
                  <a
                    href="mailto:poblacionnorth.polanco@gmail.com"
                    className="text-[#6D3FE7] hover:underline"
                  >
                    poblacionnorth.polanco@gmail.com
                  </a>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-[#17213A]">
                Available Services
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                "Request a Document",
                "Check Request Status",
                "Submit a Complaint",
                "Borrow Barangay Asset",
                "Barangay Information",
                "Contact the Barangay",
              ].map((service) => (
                <div
                  key={service}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs font-semibold text-slate-700 flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{service}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#4D8FEA] flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-[#17213A]">
                Residency Policy
              </h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              This public portal is strictly intended for residents of Barangay
              Poblacion North, Polanco. Submitting a street or purok alone is
              not treated as complete proof of residency. All submissions are
              subject to validation by authorized barangay personnel before
              processing or issuance. No resident account creation is required.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
