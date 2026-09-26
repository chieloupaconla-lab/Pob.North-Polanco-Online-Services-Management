import React from "react";
import { ChevronRight, Clock } from "lucide-react";
import RequestStatusBadge from "./RequestStatusBadge";
import { ServiceRequestItem } from "@/types/dashboard";

interface RecentRequestsProps {
  requests: ServiceRequestItem[];
  onSelectRequest?: (request: ServiceRequestItem) => void;
  onViewAll?: () => void;
}

export default function RecentRequests({
  requests,
  onSelectRequest,
  onViewAll,
}: RecentRequestsProps) {
  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-2xs text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
          <Clock className="w-6 h-6 text-slate-400" />
        </div>
        <h2 className="text-base font-bold text-[#17213A] tracking-tight">
          No request activity to display yet.
        </h2>
        <p className="text-xs text-[#6B7280]">
          Submit a service request to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[#17213A] tracking-tight">
          Recent Requests
        </h2>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-[#6D3FE7] hover:text-purple-800 transition-colors"
          >
            View All
          </button>
        )}
      </div>

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
            {requests.map((item) => (
              <tr
                key={item.id}
                onClick={() => onSelectRequest && onSelectRequest(item)}
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
    </div>
  );
}
