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
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans antialiased">
      {/* HEADER */}
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative bg-gradient-to-br from-indigo-950 via-indigo-900 to-violet-950 text-white overflow-hidden py-16 lg:py-20 border-b border-indigo-800">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 bg-indigo-800/80 border border-indigo-700 px-3.5 py-1.5 rounded-full text-xs font-semibold text-indigo-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Integrated Public Services Portal
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-violet-200 to-amber-200">Barangay Poblacion North</span> Online Services
            </h1>

            <p className="text-base sm:text-lg text-indigo-100 leading-relaxed">
              Serving the community of Barangay Poblacion North, Municipality of Polanco, Zamboanga del Norte. Access barangay documents, report facility concerns, apply for equipment borrowing, and track service status conveniently online.
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-2">
              <a 
                href="#services" 
                className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-950/50 transition-all flex items-center gap-2"
              >
                <span>Explore Services</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a 
                href="#how-it-works" 
                className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm backdrop-blur-xs transition-all"
              >
                How It Works
              </a>
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
            <div className="text-xs sm:text-sm leading-relaxed space-y-0.5">
              <span className="font-extrabold text-amber-950 block sm:inline mr-2">
                Important Residency Policy Notice:
              </span>
              <span className="text-amber-900">
                This public portal is strictly intended for residents of <strong>Barangay Poblacion North, Polanco</strong>. Submitting a street or purok alone is not treated as complete proof of residency. All submissions are subject to validation by authorized barangay personnel before processing or issuance. No resident account creation is required.
              </span>
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
                Apply for official barangay documents including Barangay Clearance, Certificate of Residency, Certificate of Indigency, First-Time Jobseeker Certificate, or Business Clearance.
              </p>
              <div className="pt-2 text-[11px] text-slate-500 font-medium space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="font-semibold text-slate-700">Required Resident Info:</div>
                <div>• Full Name & Contact Number</div>
                <div>• Poblacion North Street or Purok</div>
                <div>• Purpose & Valid Proof Details</div>
              </div>
            </div>
            <div className="px-6 pb-6 pt-2">
              <a 
                href="#documents" 
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white font-bold text-xs transition-colors"
              >
                <span>Request Document</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Card 2: Report a Facility Problem */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-violet-300 hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden group">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center group-hover:bg-violet-600 group-hover:text-white transition-colors">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-violet-700 transition-colors">
                2. Report Facility Concern
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Report damaged streetlights, clogged drainage, road hazards, public building issues, or infrastructure problems directly to barangay officials.
              </p>
              <div className="pt-2 text-[11px] text-slate-500 font-medium space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="font-semibold text-slate-700">Report Details:</div>
                <div>• Title & Hazard Description</div>
                <div>• Exact Street & Purok Location</div>
                <div>• Contact Info & Optional Photo</div>
              </div>
            </div>
            <div className="px-6 pb-6 pt-2">
              <a 
                href="#reports" 
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-50 hover:bg-violet-600 text-violet-700 hover:text-white font-bold text-xs transition-colors"
              >
                <span>Report Problem</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Card 3: Borrow Equipment */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden group">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                3. Borrow Equipment
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
              <a 
                href="#borrowing" 
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white font-bold text-xs transition-colors"
              >
                <span>Borrow Equipment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
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
                <div>• Direct Contact via Phone/SMS</div>
                <div>• In-Person Validation at Barangay Hall</div>
              </div>
            </div>
            <div className="px-6 pb-6 pt-2">
              <a 
                href="#status-info" 
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-600 text-amber-800 hover:text-white font-bold text-xs transition-colors"
              >
                <span>Status Guidelines</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
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
        
        {/* DOCUMENT REQUESTS DETAILS */}
        <div id="documents" className="scroll-mt-24 bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Document Request Module</h3>
                <p className="text-xs text-slate-500">Official document issuance for Poblacion North residents</p>
              </div>
            </div>
            <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full font-bold">
              Service 1
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Residents can submit requests for essential barangay documents directly through the portal. Requirements include Full Name, Contact Number, Street/Purok within Poblacion North, Purpose, and optional supporting document upload.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {
              [
                "Barangay Clearance",
                "Certificate of Residency",
                "Certificate of Indigency",
                "First-Time Jobseeker Certificate (RA 11261)",
                "Barangay Business Clearance",
                "General Barangay Certification / ID Verification"
              ].map((doc, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 font-semibold text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>{doc}</span>
                </div>
              ))
            }
          </div>
        </div>

        {/* FACILITY REPORTING DETAILS */}
        <div id="reports" className="scroll-mt-24 bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-violet-100 text-violet-700 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Facility & Infrastructure Reporting</h3>
                <p className="text-xs text-slate-500">Report hazards, broken fixtures, and barangay concerns</p>
              </div>
            </div>
            <span className="text-xs bg-violet-50 text-violet-700 border border-violet-100 px-3 py-1 rounded-full font-bold">
              Service 2
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Report unlit streetlights, clogged street drainage, damaged pathways, or public facility issues. Provide the report title, description, location, street/purok, contact details, and optional photo attachment for inspection.
          </p>
        </div>

        {/* EQUIPMENT BORROWING DETAILS */}
        <div id="borrowing" className="scroll-mt-24 bg-white p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Equipment Borrowing Module</h3>
                <p className="text-xs text-slate-500">Chairs, tables, tents, and community event equipment</p>
              </div>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-1 rounded-full font-bold">
              Service 3
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600">
            <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                Required Emergency Contact / Witness
              </h4>
              <p className="leading-relaxed">
                All borrowers must designate an emergency contact or witness who is not the borrower. Fields include Full Name, Relationship to Borrower, and Contact Number.
              </p>
            </div>

            <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Scale className="w-4 h-4 text-indigo-600" />
                Barangay Borrowing Rules & Penalty Recording
              </h4>
              <p className="leading-relaxed">
                Late returns, lost items, or damaged equipment are subject to official barangay policy penalties. Reason, amount, payment status, and notes are recorded directly by admin personnel.
              </p>
            </div>
          </div>
        </div>

        {/* CHECK REQUEST STATUS INFO */}
        <div id="status-info" className="scroll-mt-24 bg-amber-500/10 border border-amber-200 p-8 rounded-3xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-100 text-amber-900 rounded-2xl">
              <ClockCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Service Request Status Information</h3>
              <p className="text-xs text-slate-600">How request review, approval, and updates work</p>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            To ensure data simplicity and privacy, this portal does not require reference numbers. When you submit a document request, facility report, or equipment borrowing application, authorized personnel at the Barangay Hall review your submission under one of the official statuses:
          </p>

          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="bg-amber-100 text-amber-900 border border-amber-200 px-3 py-1 rounded-md">Pending</span>
            <span className="bg-blue-100 text-blue-900 border border-blue-200 px-3 py-1 rounded-md">Under Review</span>
            <span className="bg-emerald-100 text-emerald-900 border border-emerald-200 px-3 py-1 rounded-md">Approved</span>
            <span className="bg-red-100 text-red-900 border border-red-200 px-3 py-1 rounded-md">Rejected</span>
            <span className="bg-indigo-100 text-indigo-900 border border-indigo-200 px-3 py-1 rounded-md">Ready for Pickup</span>
            <span className="bg-slate-200 text-slate-900 border border-slate-300 px-3 py-1 rounded-md">Completed</span>
          </div>

          <p className="text-xs text-slate-600 italic">
            Barangay personnel will contact you directly via your provided contact number when your request is approved, ready for pickup, or requires additional residency details.
          </p>
        </div>

      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
