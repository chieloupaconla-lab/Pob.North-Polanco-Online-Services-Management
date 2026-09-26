"use client";

import React, { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import RequestStatusBadge from "./RequestStatusBadge";
import RequestDetailModal from "./RequestDetailModal";
import { ServiceRequestItem, RequestStatus } from "@/types/dashboard";
import { RECENT_REQUESTS_DATA } from "@/data/dashboardData";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "Document", label: "Documents" },
  { id: "Equipment", label: "Equipment" },
  { id: "Issue Report", label: "Issue Reports" },
] as const;

const STATUS_GROUPS: { id: string; label: string; statuses: RequestStatus[] }[] = [
  { id: "active", label: "Active", statuses: ["For Signature", "Processing", "Under Review", "Pending"] },
  { id: "completed", label: "Completed", statuses: ["Ready for Pickup", "Approved", "Completed"] },
];

export default function MyRequestsList() {
  const [category, setCategory] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [statusGroup, setStatusGroup] = useState<string>("all");
  const [selected, setSelected] = useState<ServiceRequestItem | null>(null);

  const filtered = useMemo(() => {
    return RECENT_REQUESTS_DATA.filter((item) => {
      const matchCategory = category === "all" || item.category === category;
      const group = STATUS_GROUPS.find((g) => g.id === statusGroup);
      const matchStatus = !group || group.statuses.includes(item.status);
      return matchCategory && matchStatus;
    });
  }, [category, statusGroup]);

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setCategory(f.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6D3FE7]/30 ${
                category === f.id
                  ? "bg-[#6D3FE7] text-white border-[#6D3FE7]"
                  : "bg-white text-slate-600 border-slate-200 hover:border-[#6D3FE7]/40"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusGroup("all")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              statusGroup === "all"
                ? "bg-[#F0EAFF] text-[#6D3FE7] border-[#6D3FE7]/30"
                : "bg-white text-slate-600 border-slate-200 hover:border-[#6D3FE7]/40"
            }`}
          >
            All Status
          </button>
          {STATUS_GROUPS.map((g) => (
            <button
              key={g.id}
              onClick={() => setStatusGroup(g.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                statusGroup === g.id
                  ? "bg-[#F0EAFF] text-[#6D3FE7] border-[#6D3FE7]/30"
                  : "bg-white text-slate-600 border-slate-200 hover:border-[#6D3FE7]/40"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#6B7280]">
            No requests match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 sm:mx-0">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[#6B7280] font-semibold uppercase text-[10px] tracking-wider bg-slate-50/50">
                  <th className="py-3 px-4 sm:px-3 rounded-l-lg">Request No.</th>
                  <th className="py-3 px-3">Service / Item</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Date Requested</th>
                  <th className="py-3 px-3 text-right rounded-r-lg">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelected(item)}
                    className="group hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 sm:px-3 font-semibold text-[#17213A] group-hover:text-[#6D3FE7] transition-colors whitespace-nowrap">
                      {item.requestNo}
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                      {item.serviceName}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <RequestStatusBadge status={item.status} />
                    </td>
                    <td className="py-3.5 px-3 text-[#6B7280] whitespace-nowrap">
                      {item.dateRequested}
                    </td>
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#6D3FE7] group-hover:translate-x-0.5 transition-all inline-block" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RequestDetailModal request={selected} onClose={() => setSelected(null)} />
    </div>
  );
}