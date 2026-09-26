import React from "react";
import { RequestStatus } from "@/types/dashboard";

interface RequestStatusBadgeProps {
  status: RequestStatus;
  className?: string;
}

export default function RequestStatusBadge({
  status,
  className = "",
}: RequestStatusBadgeProps) {
  let badgeStyle = "bg-slate-100 text-slate-700 border-slate-200";

  switch (status) {
    case "For Signature":
      badgeStyle = "bg-[#F0EAFF] text-[#6D3FE7] border-[#E1D4FF]";
      break;
    case "Processing":
      badgeStyle = "bg-[#EBF3FF] text-[#3B82F6] border-[#D1E4FF]";
      break;
    case "Ready for Pickup":
      badgeStyle = "bg-[#EAF8F1] text-[#10B981] border-[#C3F1DB]";
      break;
    case "Approved":
      badgeStyle = "bg-[#E8F7F0] text-[#059669] border-[#C1EAD7]";
      break;
    case "Under Review":
      badgeStyle = "bg-[#FEF8E7] text-[#D97706] border-[#FDE68A]";
      break;
    case "Pending":
      badgeStyle = "bg-amber-50 text-amber-700 border-amber-200";
      break;
    case "Completed":
      badgeStyle = "bg-slate-100 text-slate-700 border-slate-200";
      break;
    case "Rejected":
      badgeStyle = "bg-red-50 text-red-600 border-red-200";
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border shadow-2xs transition-colors whitespace-nowrap ${badgeStyle} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {status}
    </span>
  );
}
