import React from "react";
import Link from "next/link";
import {
  Users,
  FileText,
  Package,
  HelpCircle,
  ArrowUpRight,
} from "lucide-react";
import { QuickLinkItem } from "@/types/dashboard";

interface QuickLinksProps {
  links: QuickLinkItem[];
}

export default function QuickLinks({ links }: QuickLinksProps) {
  const getIcon = (iconName: QuickLinkItem["iconName"]) => {
    switch (iconName) {
      case "directory":
        return {
          icon: Users,
          bgStyle: "bg-[#F0EAFF] text-[#6D3FE7]",
        };
      case "programs":
        return {
          icon: FileText,
          bgStyle: "bg-blue-50 text-[#4D8FEA]",
        };
      case "equipment":
        return {
          icon: Package,
          bgStyle: "bg-emerald-50 text-[#35B978]",
        };
      case "faqs":
        return {
          icon: HelpCircle,
          bgStyle: "bg-amber-50 text-[#E5B64A]",
        };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[#17213A] tracking-tight">
          Quick Links
        </h2>
      </div>

      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3">
        {links.map((link) => {
          const { icon: Icon, bgStyle } = getIcon(link.iconName);

          return (
            <Link
              key={link.id}
              href={link.href}
              className="group relative flex flex-col gap-3 p-3.5 rounded-xl bg-slate-50/70 hover:bg-white border border-slate-100 hover:border-[#6D3FE7]/30 hover:shadow-sm transition-all duration-200"
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${bgStyle}`}
              >
                <Icon className="w-4 h-4 stroke-[2.2]" />
              </div>

              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-bold text-[#17213A] group-hover:text-[#6D3FE7] transition-colors leading-tight">
                  {link.title}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#6D3FE7] transition-colors shrink-0" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
