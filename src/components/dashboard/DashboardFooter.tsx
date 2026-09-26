import React from "react";

export default function DashboardFooter() {
  return (
    <footer className="border-t border-slate-200/80 mt-6 pt-5 pb-2">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#6B7280]">
        <p>© 2025 Barangay Poblacion North, Polanco. All rights reserved.</p>
        <p className="font-medium italic text-[#6D3FE7]/80">
          Serbisyong May Puso para sa Lahat
        </p>
      </div>
    </footer>
  );
}
