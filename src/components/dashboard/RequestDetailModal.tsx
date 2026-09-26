"use client";

import React, { useEffect } from "react";
import {
  X,
  Hash,
  ClipboardList,
  Calendar,
  MapPin,
  Clock,
  FileText,
} from "lucide-react";
import RequestStatusBadge from "./RequestStatusBadge";
import { ServiceRequestItem } from "@/types/dashboard";

interface RequestDetailModalProps {
  request: ServiceRequestItem | null;
  onClose: () => void;
}

export default function RequestDetailModal({
  request,
  onClose,
}: RequestDetailModalProps) {
  useEffect(() => {
    if (!request) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [request, onClose]);

  if (!request) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Request details for ${request.requestNo}`}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200/90 z-10 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-5 py-4 border-b border-slate-100 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F0EAFF] text-[#6D3FE7] flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#17213A]">
                Request Details
              </h2>
              <p className="text-[11px] text-[#6B7280]">
                {request.requestNo}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none"
            aria-label="Close request details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Status Row */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-xs font-semibold text-[#6B7280]">
              Current Status
            </span>
            <RequestStatusBadge status={request.status} />
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DetailRow
              icon={<Hash className="w-4 h-4" />}
              label="Request No."
              value={request.requestNo}
            />
            <DetailRow
              icon={<FileText className="w-4 h-4" />}
              label="Service / Item"
              value={request.serviceName}
            />
            <DetailRow
              icon={<Calendar className="w-4 h-4" />}
              label="Date Requested"
              value={request.dateRequested}
            />
            <DetailRow
              icon={<MapPin className="w-4 h-4" />}
              label="Purok / Street"
              value={request.purok ?? "Poblacion North"}
            />
          </div>

          {/* Description */}
          {request.details && (
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 space-y-1.5">
              <h3 className="text-xs font-bold text-[#17213A]">Details</h3>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                {request.details}
              </p>
            </div>
          )}

          {/* Last Updated */}
          {request.lastUpdated && (
            <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
              <Clock className="w-3.5 h-3.5" />
              <span>Last updated: {request.lastUpdated}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5 sm:justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors focus:outline-none"
          >
            Close
          </button>
          <a
            href="/dashboard/my-requests"
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[#6D3FE7] hover:bg-[#5B32CC] transition-colors text-center focus:outline-none"
          >
            View in My Requests
          </a>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-3.5 space-y-1">
      <div className="flex items-center gap-1.5 text-[#6B7280]">
        <span className="text-[#6D3FE7]">{icon}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-xs font-bold text-[#17213A]">{value}</p>
    </div>
  );
}
