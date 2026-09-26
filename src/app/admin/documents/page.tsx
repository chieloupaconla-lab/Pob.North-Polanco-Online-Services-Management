"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdminAuthGuard from "@/components/AdminAuthGuard";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Loader2,
  LogOut,
  Menu,
  Search,
  X,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

type DocumentStatus =
  | "Pending"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "Completed";

interface DocumentRequest {
  id: string;
  fullName: string;
  purokStreet: string;
  documentType: string;
  purpose: string;
  status: DocumentStatus;
  adminNotes: string;
  createdAt?: {
    seconds: number;
    nanoseconds: number;
  };
  updatedAt?: {
    seconds: number;
    nanoseconds: number;
  };
  completedAt?: {
    seconds: number;
    nanoseconds: number;
  } | null;
}

const statuses: DocumentStatus[] = [
  "Pending",
  "Under Review",
  "Approved",
  "Rejected",
  "Completed",
];

const documentTypes = [
  "Barangay Clearance",
  "Barangay Certificate",
  "Certificate of Residency",
  "Certificate of Indigency",
  "Other Barangay Document",
];

export default function AdminDocumentsPage() {
  const router = useRouter();

  const [requests, setRequests] = useState<DocumentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [documentFilter, setDocumentFilter] = useState("All");

  const [selectedRequest, setSelectedRequest] =
    useState<DocumentRequest | null>(null);

  const [editStatus, setEditStatus] =
    useState<DocumentStatus>("Pending");

  const [editNotes, setEditNotes] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const requestsQuery = query(
      collection(db, "documents"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      requestsQuery,
      (snapshot) => {
        const data: DocumentRequest[] = snapshot.docs.map(
          (document) => {
            const value = document.data();

            return {
              id: document.id,
              fullName: value.fullName || "",
              purokStreet: value.purokStreet || "",
              documentType: value.documentType || "",
              purpose: value.purpose || "",
              status: value.status || "Pending",
              adminNotes: value.adminNotes || "",
              createdAt: value.createdAt,
              updatedAt: value.updatedAt,
              completedAt: value.completedAt || null,
            };
          }
        );

        setRequests(data);
        setLoading(false);
      },
      (error) => {
        console.error(
          "Document request listener error:",
          error
        );

        setErrorMessage(
          "Unable to load document requests."
        );

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredRequests = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesSearch =
        !search ||
        request.fullName.toLowerCase().includes(search) ||
        request.purokStreet.toLowerCase().includes(search) ||
        request.documentType.toLowerCase().includes(search) ||
        request.purpose.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "All" ||
        request.status === statusFilter;

      const matchesDocument =
        documentFilter === "All" ||
        request.documentType === documentFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDocument
      );
    });
  }, [
    requests,
    searchTerm,
    statusFilter,
    documentFilter,
  ]);

  const countStatus = (status: DocumentStatus) => {
    return requests.filter(
      (request) => request.status === status
    ).length;
  };

  const openRequest = (request: DocumentRequest) => {
    setSelectedRequest(request);
    setEditStatus(request.status);
    setEditNotes(request.adminNotes || "");
    setSaveMessage("");
    setErrorMessage("");
  };

  const closeRequest = () => {
    if (isSaving) {
      return;
    }

    setSelectedRequest(null);
    setSaveMessage("");
    setErrorMessage("");
  };

  const saveChanges = async () => {
    if (!selectedRequest) {
      return;
    }

    if (
      editStatus === "Rejected" &&
      !editNotes.trim()
    ) {
      setErrorMessage(
        "Please provide a reason in the admin notes before rejecting the request."
      );

      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");
      setSaveMessage("");

      const requestRef = doc(
        db,
        "documents",
        selectedRequest.id
      );

      const updateData: Record<string, unknown> = {
        status: editStatus,
        adminNotes: editNotes.trim(),
        updatedAt: serverTimestamp(),
      };

      if (editStatus === "Completed") {
        updateData.completedAt = serverTimestamp();
      } else {
        updateData.completedAt = null;
      }

      await updateDoc(requestRef, updateData);

      setSaveMessage(
        "Document request status updated successfully."
      );

      setSelectedRequest((previous) =>
        previous
          ? {
              ...previous,
              status: editStatus,
              adminNotes: editNotes.trim(),
            }
          : null
      );
    } catch (error) {
      console.error(
        "Document status update error:",
        error
      );

      setErrorMessage(
        "Unable to update the document request. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/admin/login");
  };

  const getStatusClasses = (
    status: DocumentStatus
  ) => {
    switch (status) {
      case "Pending":
        return "bg-amber-100 text-amber-700";

      case "Under Review":
        return "bg-blue-100 text-blue-700";

      case "Approved":
        return "bg-green-100 text-green-700";

      case "Rejected":
        return "bg-red-100 text-red-700";

      case "Completed":
        return "bg-violet-100 text-violet-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const formatDate = (
    timestamp?: {
      seconds: number;
      nanoseconds: number;
    }
  ) => {
    if (!timestamp) {
      return "—";
    }

    return new Date(
      timestamp.seconds * 1000
    ).toLocaleString("en-PH", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <AdminAuthGuard>
      <div className="min-h-screen bg-slate-50">

        {/* Mobile Header */}
        <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-4 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
              <ClipboardList
                size={21}
                className="text-violet-600"
              />
            </div>

            <div>
              <p className="font-bold text-slate-900">
                Document Requests
              </p>

              <p className="text-xs text-slate-500">
                Admin Panel
              </p>
            </div>
          </div>

          <button
            onClick={() =>
              setMobileMenuOpen(!mobileMenuOpen)
            }
            className="rounded-xl border border-slate-200 p-2"
          >
            <Menu size={22} />
          </button>
        </div>

        <div className="flex min-h-screen">

          {/* Sidebar */}
          <aside
            className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-200 bg-white transition-transform lg:static lg:translate-x-0 ${
              mobileMenuOpen
                ? "translate-x-0"
                : "-translate-x-full"
            }`}
          >
            <div className="flex h-full flex-col">

              <div className="border-b border-slate-100 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100">
                    <ClipboardList
                      size={23}
                      className="text-violet-600"
                    />
                  </div>

                  <div>
                    <p className="font-bold text-slate-900">
                      e-Barangay
                    </p>

                    <p className="text-xs text-slate-500">
                      Admin Panel
                    </p>
                  </div>
                </div>
              </div>

              <nav className="flex-1 space-y-1 p-4">

                <button
                  onClick={() =>
                    router.push("/admin")
                  }
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <ClipboardList size={18} />
                  Dashboard
                </button>

                <button
                  className="flex w-full items-center gap-3 rounded-xl bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700"
                >
                  <FileText size={18} />
                  Document Requests
                </button>

                <button
                  onClick={() =>
                    router.push("/admin/complaints")
                  }
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <AlertCircle size={18} />
                  Community Concerns
                </button>

                <button
                  onClick={() =>
                    router.push("/admin/assets")
                  }
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <ClipboardList size={18} />
                  Asset Borrowing
                </button>

                <div className="my-4 border-t border-slate-100" />

                <button
                  onClick={() =>
                    router.push("/")
                  }
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  <ArrowLeft size={18} />
                  Public Portal
                </button>
              </nav>

              <div className="border-t border-slate-100 p-4">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
            </div>
          </aside>

          {/* Main */}
          <main className="min-w-0 flex-1">

            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

              {/* Header */}
              <div className="mb-8">
                <p className="text-sm font-medium text-violet-600">
                  Administration
                </p>

                <h1 className="mt-1 text-3xl font-bold text-slate-900">
                  Document Requests
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  Review resident document requests and update
                  their processing status.
                </p>
              </div>

              {/* Summary */}
              <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-500">
                      Pending
                    </p>

                    <Clock
                      size={20}
                      className="text-amber-500"
                    />
                  </div>

                  <p className="mt-3 text-3xl font-bold text-slate-900">
                    {countStatus("Pending")}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-sm font-medium text-slate-500">
                    Under Review
                  </p>

                  <p className="mt-3 text-3xl font-bold text-slate-900">
                    {countStatus("Under Review")}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-sm font-medium text-slate-500">
                    Approved
                  </p>

                  <p className="mt-3 text-3xl font-bold text-green-600">
                    {countStatus("Approved")}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-sm font-medium text-slate-500">
                    Rejected
                  </p>

                  <p className="mt-3 text-3xl font-bold text-red-600">
                    {countStatus("Rejected")}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-sm font-medium text-slate-500">
                    Completed
                  </p>

                  <p className="mt-3 text-3xl font-bold text-violet-600">
                    {countStatus("Completed")}
                  </p>
                </div>

              </div>

              {/* Search / Filters */}
              <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="grid gap-4 lg:grid-cols-3">

                  <div className="relative">
                    <Search
                      size={18}
                      className="absolute left-4 top-3.5 text-slate-400"
                    />

                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(event) =>
                        setSearchTerm(
                          event.target.value
                        )
                      }
                      placeholder="Search name, location, document..."
                      className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value)
                    }
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500"
                  >
                    <option value="All">
                      All Statuses
                    </option>

                    {statuses.map((status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    ))}
                  </select>

                  <select
                    value={documentFilter}
                    onChange={(event) =>
                      setDocumentFilter(event.target.value)
                    }
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500"
                  >
                    <option value="All">
                      All Document Types
                    </option>

                    {documentTypes.map((type) => (
                      <option
                        key={type}
                        value={type}
                      >
                        {type}
                      </option>
                    ))}
                  </select>

                </div>
              </div>

              {/* Error */}
              {errorMessage && !selectedRequest && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {errorMessage}
                </div>
              )}

              {/* Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

                {loading ? (
                  <div className="flex min-h-72 items-center justify-center">
                    <div className="text-center">
                      <Loader2
                        size={32}
                        className="mx-auto animate-spin text-violet-600"
                      />

                      <p className="mt-3 text-sm text-slate-500">
                        Loading document requests...
                      </p>
                    </div>
                  </div>
                ) : filteredRequests.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <FileText
                      size={42}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-4 font-semibold text-slate-700">
                      No document requests found
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      New resident requests will appear here.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Desktop */}
                    <div className="hidden overflow-x-auto lg:block">
                      <table className="w-full">
                        <thead className="border-b border-slate-100 bg-slate-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Resident
                            </th>

                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Document
                            </th>

                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Purpose
                            </th>

                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Status
                            </th>

                            <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Action
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                          {filteredRequests.map(
                            (request) => (
                              <tr
                                key={request.id}
                                className="hover:bg-slate-50"
                              >
                                <td className="px-6 py-5">
                                  <p className="font-semibold text-slate-900">
                                    {request.fullName}
                                  </p>

                                  <p className="mt-1 text-xs text-slate-500">
                                    {request.purokStreet}
                                  </p>
                                </td>

                                <td className="px-6 py-5">
                                  <p className="text-sm font-medium text-slate-800">
                                    {request.documentType}
                                  </p>
                                </td>

                                <td className="max-w-xs px-6 py-5">
                                  <p className="truncate text-sm text-slate-600">
                                    {request.purpose}
                                  </p>
                                </td>

                                <td className="px-6 py-5">
                                  <span
                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                                      request.status
                                    )}`}
                                  >
                                    {request.status}
                                  </span>
                                </td>

                                <td className="px-6 py-5 text-right">
                                  <button
                                    onClick={() =>
                                      openRequest(request)
                                    }
                                    className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
                                  >
                                    Review
                                  </button>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile */}
                    <div className="divide-y divide-slate-100 lg:hidden">
                      {filteredRequests.map(
                        (request) => (
                          <div
                            key={request.id}
                            className="p-5"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {request.fullName}
                                </p>

                                <p className="mt-1 text-sm text-slate-500">
                                  {request.documentType}
                                </p>
                              </div>

                              <span
                                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                                  request.status
                                )}`}
                              >
                                {request.status}
                              </span>
                            </div>

                            <p className="mt-3 text-sm text-slate-600">
                              {request.purokStreet}
                            </p>

                            <button
                              onClick={() =>
                                openRequest(request)
                              }
                              className="mt-4 w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white"
                            >
                              Review Request
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </main>
        </div>

        {/* Review Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">

              {/* Modal Header */}
              <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Review Document Request
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Review the request and update its status.
                  </p>
                </div>

                <button
                  onClick={closeRequest}
                  className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X size={21} />
                </button>
              </div>

              <div className="space-y-6 p-6">

                {/* Resident */}
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Resident Information
                  </p>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">
                      {selectedRequest.fullName}
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      {selectedRequest.purokStreet}
                    </p>
                  </div>
                </div>

                {/* Request */}
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Request Information
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-xs text-slate-400">
                        Document Type
                      </p>

                      <p className="mt-1 font-semibold text-slate-800">
                        {selectedRequest.documentType}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-xs text-slate-400">
                        Submitted
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-800">
                        {formatDate(
                          selectedRequest.createdAt
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 p-4">
                    <p className="text-xs text-slate-400">
                      Purpose
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-700">
                      {selectedRequest.purpose}
                    </p>
                  </div>
                </div>

                {/* Workflow */}
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Request Status
                  </p>

                  <div className="grid gap-2 sm:grid-cols-5">
                    {statuses.map((status) => {
                      const isActive =
                        selectedRequest.status === status;

                      return (
                        <div
                          key={status}
                          className={`rounded-xl px-3 py-3 text-center text-xs font-semibold ${
                            isActive
                              ? getStatusClasses(status)
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {status}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status Select */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Change Status
                  </label>

                  <select
                    value={editStatus}
                    onChange={(event) =>
                      setEditStatus(
                        event.target.value as DocumentStatus
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  >
                    {statuses.map((status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label
                    htmlFor="adminNotes"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Admin Notes
                    {editStatus === "Rejected" && (
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    )}
                  </label>

                  <textarea
                    id="adminNotes"
                    value={editNotes}
                    onChange={(event) =>
                      setEditNotes(event.target.value)
                    }
                    rows={4}
                    placeholder={
                      editStatus === "Rejected"
                        ? "Enter the reason for rejection..."
                        : "Add notes about this request..."
                    }
                    className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                  />

                  {editStatus === "Rejected" && (
                    <p className="mt-2 text-xs text-red-500">
                      A reason is required when rejecting a
                      request.
                    </p>
                  )}
                </div>

                {/* Messages */}
                {errorMessage && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {errorMessage}
                  </div>
                )}

                {saveMessage && (
                  <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
                    <CheckCircle2 size={18} />
                    {saveMessage}
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeRequest}
                    disabled={isSaving}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    onClick={saveChanges}
                    disabled={isSaving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? (
                      <>
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check size={17} />
                        Save Status
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminAuthGuard>
  );
}