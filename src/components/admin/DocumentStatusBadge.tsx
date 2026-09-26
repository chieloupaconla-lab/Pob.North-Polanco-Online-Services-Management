import React from "react";
import { DocumentStatus } from "@/types/documents";

interface DocumentStatusBadgeProps {
  status: DocumentStatus;
  className?: string;
}

export default function DocumentStatusBadge({
  status,
  className = "",
}: DocumentStatusBadgeProps) {
  let badgeStyle = "bg-slate-100 text-slate-700 border-slate-200";

  switch (status) {
    case "Pending":
      badgeStyle = "bg-amber-50 text-amber-700 border-amber-200";
      break;
    case "Under Review":
      badgeStyle = "bg-blue-50 text-blue-700 border-blue-200";
      break;
    case "Approved":
      badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
      break;
    case "Rejected":
      badgeStyle = "bg-red-50 text-red-700 border-red-200";
      break;
    case "Completed":
      badgeStyle = "bg-slate-100 text-slate-600 border-slate-200";
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
