import React from "react";
import {
  FileText,
  AlertTriangle,
  Package,
  ClipboardList,
} from "lucide-react";

interface StatCardProps {
  title: string;
  count: number;
  icon: "document" | "complaint" | "asset" | "total";
  subtitle?: string;
  href?: string;
}

const iconMap = {
  document: FileText,
  complaint: AlertTriangle,
  asset: Package,
  total: ClipboardList,
};

const bgMap = {
  document: "bg-[#F0EAFF] text-[#6D3FE7]",
  complaint: "bg-red-50 text-[#E96B73]",
  asset: "bg-emerald-50 text-[#35B978]",
  total: "bg-blue-50 text-[#4D8FEA]",
};

export default function StatCard({
  title,
  count,
  icon,
  subtitle,
  href,
}: StatCardProps) {
  const Icon = iconMap[icon];
  const bgStyle = bgMap[icon];

  const content = (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-3 transition-all hover:border-[#6D3FE7]/30">
      <div className="flex items-center justify-between">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgStyle}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-extrabold text-[#17213A]">{count}</p>
        <p className="text-xs text-[#6B7280] font-medium mt-0.5">{title}</p>
      </div>
      {subtitle && (
        <p className="text-[11px] text-[#6B7280]">{subtitle}</p>
      )}
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6D3FE7]/40 focus-visible:ring-offset-2 rounded-2xl">
        {content}
      </a>
    );
  }

  return content;
}
