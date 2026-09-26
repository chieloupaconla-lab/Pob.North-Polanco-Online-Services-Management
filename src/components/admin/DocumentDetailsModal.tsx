"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  MessageSquare,
} from "lucide-react";
import DocumentStatusBadge from "./DocumentStatusBadge";
import {
  DocumentRequest,
  DocumentStatus,
} from "@/types/documents";
import {
  updateDocumentStatus,
  updateAdminNotes,
  getDocumentRequestById,
} from "@/lib/documentService";

interface DocumentDetailsModalProps {
  request: DocumentRequest | null;
  onClose: () => void;
  onStatusChange?: (id: string, status: DocumentStatus) => void;
}

export default function DocumentDetailsModal({
  request,
  onClose,
  onStatusChange,
}: DocumentDetailsModalProps) {
  const [currentRequest, setCurrentRequest] =
    useState<DocumentRequest | null>(request);
  const [adminNotes, setAdminNotes] = useState("");
  const [notesEditing, setNotesEditing] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "approve" | "reject" | "complete" | null
  >(null);
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    setCurrentRequest(request);
  }, [request]);

  useEffect(() => {
    if (currentRequest) {
      setAdminNotes(currentRequest.adminNotes || "");
      setNotesEditing(false);
      setConfirmAction(null);
      setRejectReason("");
      setError("");
      setSuccessMsg("");
    }
  }, [currentRequest]);

  useEffect(() => {
    if (!currentRequest) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentRequest, onClose]);

  const refreshData = async () => {
    if (!currentRequest) return;
    const updated = await getDocumentRequestById(currentRequest.id);
    if (updated) {
      setCurrentRequest(updated);
      setAdminNotes(updated.adminNotes || "");
    }
  };

  if (!currentRequest) return null;

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleStatusUpdate = async (
    newStatus: DocumentStatus,
    action: "approve" | "reject" | "complete"
  ) => {
    setLoading(true);
    setError("");
    try {
      const completedAt =
        newStatus === "Completed" ? new Date() : undefined;
      await updateDocumentStatus(
        currentRequest.id,
        newStatus,
        action === "reject" ? rejectReason : currentRequest.adminNotes,
        completedAt
      );
      showSuccess(
        action === "approve"
          ? "Document request approved."
          : action === "reject"
          ? "Document request rejected."
          : "Document request marked as completed."
      );
      await refreshData();
      onStatusChange?.(currentRequest.id, newStatus);
      setConfirmAction(null);
      setRejectReason("");
    } catch {
      setError("Unable to update the request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    setLoading(true);
    setError("");
    try {
      await updateAdminNotes(currentRequest.id, adminNotes);
      showSuccess("Admin notes saved.");
      await refreshData();
      setNotesEditing(false);
    } catch {
      setError("Unable to save notes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const timelineSteps = [
    { label: "Submitted", status: "Submitted" as const },
    { label: "Pending", status: "Pending" as const },
    { label: "Under Review", status: "Under Review" as const },
    { label: "Approved", status: "Approved" as const },
    { label: "Completed", status: "Completed" as const },
  ];

  const isRejected = currentRequest.status === "Rejected";
  const timelineStatuses = isRejected
    ? ["Submitted", "Pending", "Under Review", "Rejected"]
    : timelineSteps.map((s) => s.status);

  const currentStatusIndex = isRejected
    ? 3
    : timelineSteps.findIndex((s) => s.status === currentRequest.status);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200/90 z-10 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-5 py-4 border-b border-slate-100 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-sm font-bold text-[#17213A]">
              Request Details
            </h2>
            <p className="text-[11px] text-[#6B7280]">
              {currentRequest.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {successMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs text-emerald-700">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {successMsg}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-xs font-semibold text-[#6B7280]">
              Current Status
            </span>
            <DocumentStatusBadge status={currentRequest.status} />
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-bold text-[#17213A] mb-3">
              Process Timeline
            </h3>
            <div className="space-y-0">
              {timelineStatuses.map((step, idx) => {
                const isActive = idx <= currentStatusIndex;
                const isCurrent = idx === currentStatusIndex;
                return (
                  <div key={step} className="flex items-start gap-3">
                    <div className="flex flex-col items-center pt-0.5">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isActive
                            ? "bg-[#6D3FE7] text-white"
                            : "bg-slate-200 text-slate-400"
                        }`}
                      >
                        {isActive ? (
                          isCurrent ? (
                            <span className="leading-none">●</span>
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )
                        ) : (
                          ""
                        )}
                      </div>
                      {idx < timelineStatuses.length - 1 && (
                        <div
                          className={`w-0.5 h-6 ${
                            isActive ? "bg-[#6D3FE7]/30" : "bg-slate-200"
                          }`}
                        />
                      )}
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        isCurrent
                          ? "text-[#6D3FE7]"
                          : isActive
                          ? "text-[#17213A]"
                          : "text-slate-400"
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-[#17213A] mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-[#6D3FE7]" />
              REQUESTER INFORMATION
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-100 bg-white p-3.5 space-y-1">
                <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide">
                  Full Name
                </span>
                <p className="text-xs font-bold text-[#17213A]">
                  {currentRequest.fullName}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-3.5 space-y-1">
                <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide">
                  Purok / Street
                </span>
                <p className="text-xs font-bold text-[#17213A]">
                  {currentRequest.purokStreet}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-[#17213A] mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#6D3FE7]" />
              DOCUMENT INFORMATION
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-100 bg-white p-3.5 space-y-1">
                <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide">
                  Document Type
                </span>
                <p className="text-xs font-bold text-[#17213A]">
                  {currentRequest.documentType}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-3.5 space-y-1">
                <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide">
                  Purpose
                </span>
                <p className="text-xs font-bold text-[#17213A]">
                  {currentRequest.purpose}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-[#17213A] mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#6D3FE7]" />
              REQUEST INFORMATION
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-100 bg-white p-3.5 space-y-1">
                <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide">
                  Date Submitted
                </span>
                <p className="text-xs font-bold text-[#17213A]">
                  {formatDate(currentRequest.createdAt)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-white p-3.5 space-y-1">
                <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide">
                  Current Status
                </span>
                <p className="text-xs font-bold text-[#17213A]">
                  {currentRequest.status}
                </p>
              </div>
              {currentRequest.completedAt && (
                <div className="rounded-xl border border-slate-100 bg-white p-3.5 space-y-1">
                  <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide">
                    Completed At
                  </span>
                  <p className="text-xs font-bold text-[#17213A]">
                    {formatDate(currentRequest.completedAt)}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-[#17213A] mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#6D3FE7]" />
              ADMIN INFORMATION
            </h3>
            {notesEditing ? (
              <div className="space-y-2">
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  placeholder="Enter admin notes..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-[#17213A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#6D3FE7]/20 focus:border-[#6D3FE7] transition-all resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveNotes}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#6D3FE7] hover:bg-[#5B32CC] disabled:opacity-50 transition-colors flex items-center gap-1.5"
                  >
                    {loading && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    )}
                    {loading ? "Saving..." : "Save Notes"}
                  </button>
                  <button
                    onClick={() => {
                      setAdminNotes(currentRequest.adminNotes);
                      setNotesEditing(false);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-100 bg-white p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[#6B7280]">
                    {currentRequest.adminNotes || "No admin notes yet."}
                  </p>
                  <button
                    onClick={() => setNotesEditing(true)}
                    className="text-[10px] font-semibold text-[#6D3FE7] hover:text-purple-800 transition-colors"
                  >
                    Edit Notes
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-3">
            <h3 className="text-xs font-bold text-[#17213A]">
              Status Actions
            </h3>

            {currentRequest.status === "Pending" && (
              <button
                onClick={() => setConfirmAction("approve")}
                className="w-full sm:w-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#6D3FE7] hover:bg-[#5B32CC] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6D3FE7]/40 focus-visible:ring-offset-2"
              >
                Review Request
              </button>
            )}

            {currentRequest.status === "Under Review" && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setConfirmAction("approve")}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2"
                >
                  Approve
                </button>
                <button
                  onClick={() => setConfirmAction("reject")}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 focus-visible:ring-offset-2"
                >
                  Reject
                </button>
              </div>
            )}

            {currentRequest.status === "Approved" && (
              <button
                onClick={() => setConfirmAction("complete")}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2"
              >
                Mark as Completed
              </button>
            )}

            {currentRequest.status === "Rejected" && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4 space-y-1">
                <p className="text-xs font-bold text-red-700">
                  This request has been rejected.
                </p>
                {currentRequest.adminNotes && (
                  <p className="text-xs text-red-600">
                    Reason: {currentRequest.adminNotes}
                  </p>
                )}
              </div>
            )}

            {currentRequest.status === "Completed" && (
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-1">
                <p className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-500" />
                  Completed
                </p>
                {currentRequest.completedAt && (
                  <p className="text-xs text-slate-500">
                    Completed on: {formatDate(currentRequest.completedAt)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {confirmAction === "approve" && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setConfirmAction(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#17213A]">
                  Approve Request
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Are you sure you want to approve this document request?
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusUpdate("Approved", "approve")}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {loading && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                {loading ? "Approving..." : "Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmAction === "reject" && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setConfirmAction(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#17213A]">
                  Reject Request
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Are you sure you want to reject this document request?
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#17213A]">
                Rejection Reason *
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Enter the reason for rejection..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-[#17213A] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-all resize-none"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setConfirmAction(null);
                  setRejectReason("");
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleStatusUpdate("Rejected", "reject")
                }
                disabled={loading || !rejectReason.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {loading && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                {loading ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmAction === "complete" && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setConfirmAction(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#17213A]">
                  Complete Request
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Are you sure you want to mark this document request as
                  completed?
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusUpdate("Completed", "complete")}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {loading && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                {loading ? "Completing..." : "Complete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
