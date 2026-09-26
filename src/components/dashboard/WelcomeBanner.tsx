import React from "react";
import BarangayHallIllustration from "./BarangayHallIllustration";

export default function WelcomeBanner() {
  return (
    <div className="relative w-full rounded-2xl bg-gradient-to-r from-[#F0EAFF] via-[#F4EFFF] to-[#FAF8FF] border border-purple-100/90 shadow-2xs overflow-hidden min-h-[160px] flex items-center">
      
      <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-[#6D3FE7]/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 right-1/3 w-40 h-40 rounded-full bg-emerald-400/10 blur-xl pointer-events-none" />

      <div className="relative z-10 w-full px-6 py-5 sm:px-8 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        <div className="max-w-xl space-y-1.5">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#17213A] tracking-tight leading-tight">
            Welcome to <span className="text-[#6D3FE7]">Barangay Poblacion North</span>!
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-700 leading-normal">
            Access barangay services and submit requests online with ease.
          </p>
        </div>

        <div className="hidden sm:block w-72 lg:w-96 h-32 lg:h-36 shrink-0 relative rounded-xl overflow-hidden -mr-2">
          <BarangayHallIllustration />
        </div>

      </div>
    </div>
  );
}
