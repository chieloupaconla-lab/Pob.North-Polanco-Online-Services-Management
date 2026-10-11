import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  FileText, 
  AlertTriangle, 
  Package, 
  ClockCheck, 
  ShieldCheck, 
  UserCheck, 
  MapPin, 
  Phone, 
  ArrowRight,
  Info,
  CheckCircle2,
  FileCheck,
  Scale,
  Users,
  Search,
  ClipboardList
} from "lucide-react";

export default function Home() {
  const siteUrl = "https://pob-north-polanco-online-services-management-bb05z9zbs.vercel.app";
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "GovernmentOrganization",
        "@id": `${siteUrl}/#organization`,
        name: "Barangay Poblacion North",
        url: siteUrl,
        address: {
          "@type": "PostalAddress",
          addressLocality: "Polanco",
          addressRegion: "Zamboanga del Norte",
          addressCountry: "PH",
        },
        openingHours: "Mo-Fr 08:00-17:00",
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: "Barangay Poblacion North Online Services",
        url: siteUrl,
        publisher: { "@id": `${siteUrl}/#organization` },
      },
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/#webpage`,
        name: "Barangay Poblacion North Online Services",
        url: siteUrl,
        isPartOf: { "@id": `${siteUrl}/#website` },
        about: { "@id": `${siteUrl}/#organization` },
      },
    ],
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans antialiased">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      {/* HEADER */}
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-950 text-white overflow-hidden py-16 lg:py-20 border-b border-indigo-800">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-">
          <div className="max-w-3xl space-y-6 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 bg-indigo-800/80 border border-indigo-700 px-3.5 py-1.5 rounded-full text-xs font-semibold text-indigo-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Integrated Public Services Portal
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-violet-200 to-amber-200">Barangay Poblacion North</span> Online Services
            </h1>

            <p className="text-base sm:text-lg text-indigo-100 leading-relaxed">
              Serving the community of Barangay Poblacion North, Municipality of Polanco, Zamboanga del Norte. Access barangay documents, report community concerns, apply for equipment borrowing, and track service status conveniently online.
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-20">
              
              
            </div>
          </div>
        </div>
      </section>

      {/* RESIDENCY NOTICE BANNER */}
      <section className="bg-amber-50 border-y border-amber-200/90 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3.5 text-amber-950">
            <div className="p-2.5 bg-amber-100 text-amber-900 rounded-xl shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
           <div className="w-full">
  <div className="w-full rounded-xl bg-amber-50 px-5 py-4">
    <div className="text-xs sm:text-sm leading-relaxed">
      <p className="font-extrabold text-amber-850 mb-1">
        Important Residency Policy Notice:
      </p>

      <p className="text-amber-900">
        This public portal is strictly intended for residents of{" "}
        <strong>Barangay Poblacion North, Polanco</strong>. All
        submissions are subject to validation by authorized barangay
        personnel before processing or issuance. No resident account
        creation is required.
      </p>
    </div>
  </div>
</div>
          </div>
        </div>
      </section>

      {/* SERVICE CARDS SECTION */}
      <section id="services" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">
            Barangay Services
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Select a Public Service
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Fast, transparent, and direct services for Barangay Poblacion North residents.
          </p>
        </div>

        {/* 4 Core Service Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Request a Document */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden group">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                1. Request a Document
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Apply for Barangay Clearance, Certificate of Residency, Barangay Business Clearance, or Community Tax Certificate (Cedula).
              </p>
              <div className="pt-2 text-[11px] text-slate-500 font-medium space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="font-semibold text-slate-700">Required Resident Info:</div>
                <div>• Full Name & Contact Number</div>
                <div>• Poblacion North Street or Purok</div>
                <div>• Purpose & Valid Proof Details</div>
              </div>
            </div>
            <div className="px-6 pb-6 pt-2">
              
            </div>
          </div>

          {/* Card 2: Report a Facility Problem */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-violet-300 hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden group">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-colors">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-violet-700 transition-colors">
                2. Report Community Concern
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Report damaged streetlights, road hazards, public building issues, or infrastructure problems directly to barangay officials.
              </p>
              <div className="pt-2 text-[11px] text-slate-500 font-medium space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="font-semibold text-slate-700">Report Details:</div>
                <div>• Title & Hazard Description</div>
                <div>• Exact Street & Purok Location</div>
                <div>• Contact Info & Optional Photo</div>
              </div>
            </div>
            <div className="px-6 pb-6 pt-2">
             
            </div>
          </div>

          {/* Card 3: Borrow Equipment */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden group">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                3. Borrow & Returning
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Request to borrow barangay equipment (chairs, tables, tents, sound system). Requires designated witness/emergency contact details and policy agreement.
              </p>
              <div className="pt-2 text-[11px] text-slate-500 font-medium space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="font-semibold text-slate-700">Borrower Requirements:</div>
                <div>• Equipment & Schedule Details</div>
                <div>• Mandatory Witness Contact Info</div>
                <div>• Agreement to Penalty Policies</div>
              </div>
            </div>
            <div className="px-6 pb-6 pt-2">
              
            </div>
          </div>

          {/* Card 4: Check Request Status */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden group">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <ClockCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                4. Request Status Info
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Understand how request statuses are tracked and updated. Authorized barangay personnel review submissions and communicate directly with residents.
              </p>
              <div className="pt-2 text-[11px] text-slate-500 font-medium space-y-1 bg-amber-50/60 p-3 rounded-lg border border-amber-100">
                <div className="font-semibold text-amber-900">Official Process:</div>
                <div>• Pending → Under Review → Approved</div>
                <div>• In-Person Validation at Barangay Hall</div>
              </div>
            </div>
            <div className="px-6 pb-6 pt-2">
             
            </div>
          </div>

        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-16 bg-white border-y border-slate-200 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">
              Simple Steps
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              How the Service Portal Works
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              No login or password needed. Three simple steps for Barangay Poblacion North residents.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            
            {/* Step 1 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold text-base flex items-center justify-center shadow-md">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Submit Service Form
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Choose a service (Document, Facility Report, or Equipment Borrowing). Provide your complete Full Name, Contact Number, and exact Purok or Street in Poblacion North.
              </p>
              <div className="text-[11px] text-indigo-700 font-semibold bg-indigo-50 p-2.5 rounded-lg border border-indigo-100 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>No resident account login required</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold text-base flex items-center justify-center shadow-md">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Barangay Staff Validation
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Authorized barangay personnel review your application, verify your residency in local records, and inspect reported facilities or equipment availability.
              </p>
              <div className="text-[11px] text-violet-700 font-semibold bg-violet-50 p-2.5 rounded-lg border border-violet-100 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-violet-600 shrink-0" />
                <span>Verification by authorized personnel</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold text-base flex items-center justify-center shadow-md">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Action, Approval & Pickup
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Once approved or updated to <span className="font-semibold text-emerald-700">&quot;Ready for Pickup&quot;</span>, pick up your document or equipment at Barangay Hall, or receive updates on facility repair status.
              </p>
              <div className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Smooth, transparent resolution</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* DETAILED SERVICE INFORMATION SECTIONS */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="rounded-3xl border border-indigo-100 bg-indigo-50/60 p-6 sm:p-8">
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Barangay Poblacion North Online Services</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            The official online services portal of Barangay Poblacion North, Polanco, Zamboanga del Norte helps residents request barangay documents, report public facility concerns, and request barangay-owned equipment borrowing services.
          </p>
          <div className="mt-5 grid gap-3 text-sm text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
            <span className="rounded-xl bg-white p-3">Barangay Clearance</span>
            <span className="rounded-xl bg-white p-3">Certificate of Residency</span>
             <span className="rounded-xl bg-white p-3">Barangay Business Clearance</span>
             <span className="rounded-xl bg-white p-3">Community Tax Certificate (Cedula)</span>
            <span className="rounded-xl bg-white p-3">Public facility concern reporting</span>
            <span className="rounded-xl bg-white p-3">Barangay-owned equipment borrowing</span>
            <span className="rounded-xl bg-white p-3">Barangay Hall: Monday-Friday, 8:00 AM-5:00 PM</span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
