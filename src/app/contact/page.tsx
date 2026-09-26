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
  Send,
  FileText,
} from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans antialiased">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 flex-1">
        <div className="space-y-8 max-w-3xl mx-auto">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17213A] tracking-tight">
              Contact the Barangay
            </h1>
            <p className="text-sm text-[#6B7280]">
              Reach out to Barangay Poblacion North for any inquiries or
              concerns.
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
              <div className="text-sm text-slate-600 space-y-3">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#6D3FE7] shrink-0 mt-0.5" />
                  <span>
                    Barangay Hall, Poblacion North, Polanco, Zamboanga del
                    Norte, Philippines 7106
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-[#6D3FE7] shrink-0" />
                  <span>Monday – Friday: 8:00 AM – 5:00 PM</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#4D8FEA] flex items-center justify-center">
                  <Phone className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-[#17213A]">
                  Phone & Email
                </h2>
              </div>
              <div className="text-sm text-slate-600 space-y-3">
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#4D8FEA] shrink-0" />
                  <span>(065) 123-4567</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-[#4D8FEA] shrink-0" />
                  <a
                    href="mailto:poblacionnorth.polanco@gmail.com"
                    className="text-[#6D3FE7] hover:underline"
                  >
                    poblacionnorth.polanco@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
            <h2 className="text-base font-bold text-[#17213A]">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <a
                href="/documents"
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#F0EAFF] text-[#6D3FE7] text-sm font-bold hover:bg-[#E1D4FF] transition-colors"
              >
                <FileText className="w-4 h-4" />
                Request Document
              </a>
              <a
                href="/complaints"
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm font-bold hover:bg-red-100 transition-colors"
              >
                <Send className="w-4 h-4" />
                Submit Complaint
              </a>
              <a
                href="/assets"
                className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-bold hover:bg-emerald-100 transition-colors"
              >
                <Building2 className="w-4 h-4" />
                Borrow Asset
              </a>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
