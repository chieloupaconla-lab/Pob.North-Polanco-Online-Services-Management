import React from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import CommunityIllustration from "./CommunityIllustration";

interface DashboardCTAProps {
  href?: string;
}

export default function DashboardCTA({ href = "/complaints" }: DashboardCTAProps) {
  return (
    <div className="relative w-full rounded-2xl bg-gradient-to-r from-[#F0EAFF] via-[#F4EFFF] to-[#EDE9FE] border border-purple-100/90 shadow-2xs overflow-hidden">
      <div className="absolute -bottom-14 -left-10 w-44 h-44 rounded-full bg-[#6D3FE7]/10 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-5 px-6 py-5 sm:px-8 sm:py-6">
        <div className="hidden md:block w-44 lg:w-52 h-28 shrink-0">
          <CommunityIllustration />
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1.5">
          <h2 className="text-base sm:text-lg font-extrabold text-[#17213A] tracking-tight leading-snug">
            Your concerns matter.
            <br className="hidden sm:block" />
            Help us improve services in Barangay Poblacion North.
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
            Submit your concerns and requests online to help us serve you better.
          </p>
        </div>

        <div className="shrink-0 w-full sm:w-auto">
          <Link
            href={href}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#6D3FE7] hover:bg-[#5B32CC] text-white text-xs font-bold shadow-sm hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6D3FE7]/40 focus-visible:ring-offset-2 transition-all"
          >
            <AlertTriangle className="w-4 h-4 stroke-[2.2]" />
            <span>Submit a Complaint</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
