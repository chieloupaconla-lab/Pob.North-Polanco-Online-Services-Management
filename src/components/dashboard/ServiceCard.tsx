import React from "react";
import Link from "next/link";
import { FileText, ClockCheck, AlertTriangle, Package, ArrowRight } from "lucide-react";
import { ServiceCardItem } from "@/types/dashboard";

interface ServiceCardProps {
  card: ServiceCardItem;
}

export default function ServiceCard({ card }: ServiceCardProps) {
  let IconComponent: React.ElementType = FileText;
  let bgIconStyle = "bg-[#F0EAFF] text-[#6D3FE7]";
  let borderHoverStyle = "hover:border-[#6D3FE7]/40 hover:shadow-md";

  switch (card.iconName) {
    case "document":
      IconComponent = FileText;
      bgIconStyle = "bg-[#F0EAFF] text-[#6D3FE7]";
      borderHoverStyle = "hover:border-[#6D3FE7]/40 hover:shadow-md";
      break;
    case "status":
      IconComponent = ClockCheck;
      bgIconStyle = "bg-blue-50 text-[#4D8FEA]";
      borderHoverStyle = "hover:border-[#4D8FEA]/40 hover:shadow-md";
      break;
    case "complaint":
      IconComponent = AlertTriangle;
      bgIconStyle = "bg-red-50 text-[#E96B73]";
      borderHoverStyle = "hover:border-[#E96B73]/40 hover:shadow-md";
      break;
    case "asset":
      IconComponent = Package;
      bgIconStyle = "bg-emerald-50 text-[#35B978]";
      borderHoverStyle = "hover:border-[#35B978]/40 hover:shadow-md";
      break;
  }

  return (
    <Link
      href={card.href}
      className={`group relative bg-white rounded-2xl border border-slate-200/80 p-6 min-h-[170px] flex flex-col justify-between cursor-pointer transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6D3FE7]/30 focus-visible:ring-offset-2 ${borderHoverStyle}`}
    >
      <div className="space-y-3">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${bgIconStyle}`}
        >
          <IconComponent className="w-5 h-5 stroke-[2.2]" aria-hidden="true" />
        </div>

        <div>
          <h3 className="text-base font-bold text-[#17213A] group-hover:text-[#6D3FE7] transition-colors leading-tight">
            {card.title}
          </h3>
          <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
            {card.description}
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <span
          aria-hidden="true"
          className="w-8 h-8 rounded-full bg-slate-100/80 text-slate-500 group-hover:bg-[#6D3FE7] group-hover:text-white transition-all flex items-center justify-center shadow-2xs"
        >
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </span>
      </div>
    </Link>
  );
}
