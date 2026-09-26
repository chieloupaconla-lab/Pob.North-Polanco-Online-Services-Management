"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { HelpCircle, FileText, Clock, ShieldCheck, Users, Phone } from "lucide-react";

const FAQS = [
  {
    question: "How do I request a barangay document?",
    answer:
      "Click on 'Request Document' from the dashboard or navigation menu, select the document type, fill in your details, and submit. No account or login is required.",
  },
  {
    question: "How long does it take to process a request?",
    answer:
      "Processing times vary by document type and request volume. Barangay personnel will review your submission and update the status. You can check the status at any time from the dashboard.",
  },
  {
    question: "Do I need to create an account?",
    answer:
      "No. This portal does not require resident registration, login, or any account creation. You can access all public services directly.",
  },
  {
    question: "Can I check my request status online?",
    answer:
      "Yes. Use the 'Check Request Status' page or visit 'My Requests' in the dashboard to track the current status of your submissions.",
  },
  {
    question: "What equipment can I borrow?",
    answer:
      "You can borrow plastic chairs, folding tables, canopy tents, sound systems, tarpaulins/stands, and sports equipment sets. Check the borrowing page for availability.",
  },
  {
    question: "How do I submit a complaint?",
    answer:
      "Click on 'Submit Complaint' from the dashboard or navigation menu, choose a category, describe your concern, and submit. Your report will be forwarded to barangay personnel.",
  },
  {
    question: "Is there a fee for requesting documents?",
    answer:
      "Document fees vary by type. Please contact the Barangay Hall for specific fee schedules and payment procedures.",
  },
  {
    question: "What are the barangay hall hours?",
    answer:
      "Monday through Friday, 8:00 AM to 5:00 PM. The barangay hall is closed on weekends and national holidays.",
  },
];

export default function FAQsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans antialiased">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 flex-1">
        <div className="space-y-8 max-w-3xl mx-auto">
          <div className="space-y-2 text-center">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6D3FE7] bg-[#F0EAFF] px-3 py-1 rounded-full uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5" />
              FAQs
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17213A] tracking-tight">
              Frequently Asked Questions
            </h1>
            <p className="text-sm text-[#6B7280]">
              Answers to common questions about barangay services and
              processes.
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-2"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#F0EAFF] text-[#6D3FE7] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-bold">{idx + 1}</span>
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-[#17213A]">
                      {faq.question}
                    </h2>
                    <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed mt-1">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
            <p className="text-xs text-[#6B7280] text-center">
              Still have questions? Contact the Barangay Hall at{" "}
              <strong className="text-[#17213A]">(065) 123-4567</strong> or visit
              us during office hours.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
