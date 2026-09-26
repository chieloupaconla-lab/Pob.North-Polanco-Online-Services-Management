import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface AdminPageHeadingProps {
  title: string;
  description?: string;
  breadcrumb?: string;
  children?: React.ReactNode;
}

export default function AdminPageHeading({
  title,
  description,
  breadcrumb,
  children,
}: AdminPageHeadingProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
      <div className="space-y-1">
        {breadcrumb && (
          <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-[11px] text-[#6B7280]">
            <span>Admin</span>
            <ChevronRight className="w-3 h-3" />
            <span className="font-semibold text-[#6D3FE7]">{breadcrumb}</span>
          </nav>
        )}
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#17213A] tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm text-[#6B7280] max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}
