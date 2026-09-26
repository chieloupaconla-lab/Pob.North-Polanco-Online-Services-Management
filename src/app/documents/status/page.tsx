"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Home,
  Loader2,
  Search,
  Clock,
  XCircle,
} from "lucide-react";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const documentTypes = [
  "Barangay Clearance",
  "Barangay Certificate",
  "Certificate of Residency",
  "Certificate of Indigency",
  "Other Barangay Document",
];

const statuses = [
  "Pending",
  "Under Review",
  "Approved",
  "Completed",
];

type RequestData = {
  id: string;
  fullName: string;
  purokStreet: string;
  documentType: string;
  purpose: string;
  status: string;
  adminNotes: string;
  createdAt: any;
  updatedAt: any;
  completedAt: any;
};

export default function DocumentStatusPage() {
  const [fullName, setFullName] = useState("");
  const [purokStreet, setPurokStreet] = useState("");
  const [documentType, setDocumentType] = useState("");

  const [request, setRequest] = useState<RequestData | null>(null);

  const [isSearching, setIsSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSearch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setErrorMessage("");
    setRequest(null);
    setSearched(false);

    if (
      !fullName.trim() ||
      !purokStreet.trim() ||
      !documentType
    ) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    try {
      setIsSearching(true);

      const requestsQuery = query(
        collection(db, "documents"),
        where("fullName", "==", fullName.trim()),
        where("purokStreet", "==", purokStreet.trim()),
        where("documentType", "==", documentType)
      );

      const snapshot = await getDocs(requestsQuery);

      if (snapshot.empty) {
        setSearched(true);
        setErrorMessage(
          "No matching document request was found. Please check the information you entered."
        );
        return;
      }

      const requests: RequestData[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<RequestData, "id">),
      }));

      requests.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() ?? 0;
        const bTime = b.createdAt?.toMillis?.() ?? 0;

        return bTime - aTime;
      });

      setRequest(requests[0]);
      setSearched(true);
    } catch (error) {
      console.error("Status search error:", error);

      setErrorMessage(
        "Unable to check your request status. Please try again."
      );
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusIndex = (status: string) => {
    return statuses.indexOf(status);
  };

  const currentStatusIndex = request
    ? getStatusIndex(request.status)
    : -1;

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Not available";

    try {
      return timestamp.toDate().toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return "Not available";
    }
  };

  const resetSearch = () => {
    setRequest(null);
    setSearched(false);
    setErrorMessage("");
    setFullName("");
    setPurokStreet("");
    setDocumentType("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b border-violet-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-3 text-slate-800 transition hover:text-violet-700"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
              <Home className="h-5 w-5 text-violet-700" />
            </div>

            <div>
              <p className="text-sm font-bold">
                Barangay Poblacion North
              </p>
              <p className="text-xs text-slate-500">
                Polanco, Zamboanga del Norte
              </p>
            </div>
          </Link>

          <Link
            href="/documents"
            className="hidden items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-violet-700 sm:flex"
          >
            <ArrowLeft className="h-4 w-4" />
            Document Requests
          </Link>
        </div>
      </header>

      <section className="px-5 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-4xl">
          {/* Heading */}
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100">
              <ClipboardCheck className="h-8 w-8 text-violet-700" />
            </div>

            <p className="mt-5 text-sm font-bold uppercase tracking-wider text-violet-600">
              Document Request Tracking
            </p>

            <h1 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Check Your Request Status
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Enter the same information you provided when submitting your
              document request to view its current status.
            </p>
          </div>

          {/* Search Form */}
          <div className="mt-8 rounded-3xl border border-violet-100 bg-white p-6 shadow-xl shadow-violet-100/40 sm:p-8">
            <form onSubmit={handleSearch} className="space-y-5">
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-sm font-bold text-slate-800"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>

                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter the same full name used in your request"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />
              </div>

              <div>
                <label
                  htmlFor="purokStreet"
                  className="mb-2 block text-sm font-bold text-slate-800"
                >
                  Purok / Street <span className="text-red-500">*</span>
                </label>

                <input
                  id="purokStreet"
                  type="text"
                  value={purokStreet}
                  onChange={(e) => setPurokStreet(e.target.value)}
                  placeholder="Enter the same Purok / Street"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />
              </div>

              <div>
                <label
                  htmlFor="documentType"
                  className="mb-2 block text-sm font-bold text-slate-800"
                >
                  Document Type <span className="text-red-500">*</span>
                </label>

                <select
                  id="documentType"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                >
                  <option value="">Select a document</option>

                  {documentTypes.map((document) => (
                    <option key={document} value={document}>
                      {document}
                    </option>
                  ))}
                </select>
              </div>

              {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm font-medium text-red-700">
                    {errorMessage}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSearching}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Checking Status...
                  </>
                ) : (
                  <>
                    <Search className="h-5 w-5" />
                    Check Request Status
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Request Result */}
          {searched && request && (
            <div className="mt-8 space-y-6">
              {/* Current Status */}
              <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-xl shadow-violet-100/40 sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
                      Current Request Status
                    </p>

                    <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
                      {request.status}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Last updated: {formatDate(request.updatedAt)}
                    </p>
                  </div>

                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
                      request.status === "Completed"
                        ? "bg-green-100"
                        : request.status === "Approved"
                        ? "bg-blue-100"
                        : request.status === "Under Review"
                        ? "bg-amber-100"
                        : "bg-violet-100"
                    }`}
                  >
                    {request.status === "Completed" ? (
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    ) : request.status === "Approved" ? (
                      <CheckCircle2 className="h-8 w-8 text-blue-600" />
                    ) : request.status === "Under Review" ? (
                      <Clock className="h-8 w-8 text-amber-600" />
                    ) : (
                      <ClipboardCheck className="h-8 w-8 text-violet-600" />
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Timeline */}
              <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-xl shadow-violet-100/40 sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                    <ClipboardCheck className="h-5 w-5 text-violet-700" />
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-900">
                      Request Progress
                    </h2>

                    <p className="text-xs text-slate-500">
                      Follow the progress of your document request.
                    </p>
                  </div>
                </div>

                <div className="mt-8">
                  {statuses.map((status, index) => {
                    const isCompleted =
                      currentStatusIndex >= index;

                    const isCurrent =
                      currentStatusIndex === index;

                    return (
                      <div
                        key={status}
                        className="relative flex gap-4"
                      >
                        {/* Connector */}
                        {index < statuses.length - 1 && (
                          <div
                            className={`absolute left-[19px] top-10 h-[calc(100%-8px)] w-0.5 ${
                              currentStatusIndex > index
                                ? "bg-violet-500"
                                : "bg-slate-200"
                            }`}
                          />
                        )}

                        {/* Circle */}
                        <div
                          className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${
                            isCompleted
                              ? "border-violet-600 bg-violet-600 text-white"
                              : "border-slate-200 bg-white text-slate-400"
                          }`}
                        >
                          {isCompleted ? (
                            <Check className="h-5 w-5" />
                          ) : (
                            <span className="text-sm font-bold">
                              {index + 1}
                            </span>
                          )}
                        </div>

                        {/* Text */}
                        <div className="pb-10">
                          <p
                            className={`text-sm font-bold ${
                              isCurrent
                                ? "text-violet-700"
                                : isCompleted
                                ? "text-slate-800"
                                : "text-slate-400"
                            }`}
                          >
                            {status}
                          </p>

                          {isCurrent && (
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              Your request is currently at this stage.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Request Details */}
              <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-xl shadow-violet-100/40 sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100">
                    <FileText className="h-5 w-5 text-violet-700" />
                  </div>

                  <h2 className="font-bold text-slate-900">
                    Request Details
                  </h2>
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-400">
                      Full Name
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {request.fullName}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-400">
                      Purok / Street
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {request.purokStreet}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-400">
                      Document Type
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {request.documentType}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-400">
                      Submitted
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {formatDate(request.createdAt)}
                    </p>
                  </div>

                  <div className="sm:col-span-2">
                    <p className="text-xs font-semibold text-slate-400">
                      Purpose
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-800">
                      {request.purpose}
                    </p>
                  </div>
                </div>
              </div>

              {/* Admin Notes */}
              {request.adminNotes?.trim() && (
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
                  <div className="flex gap-3">
                    <ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

                    <div>
                      <h2 className="text-sm font-bold text-slate-900">
                        Barangay Office Note
                      </h2>

                      <p className="mt-1 text-sm leading-6 text-slate-700">
                        {request.adminNotes}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={resetSearch}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-5 py-3.5 text-sm font-bold text-violet-700 transition hover:bg-violet-50"
                >
                  <Search className="h-5 w-5" />
                  Check Another Request
                </button>

                <Link
                  href="/documents"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-violet-700"
                >
                  <FileText className="h-5 w-5" />
                  Submit Another Request
                </Link>
              </div>
            </div>
          )}

          {/* No Result */}
          {searched && !request && errorMessage && (
            <div className="mt-8 rounded-3xl border border-red-100 bg-white p-8 text-center shadow-lg">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-7 w-7 text-red-600" />
              </div>

              <h2 className="mt-4 text-lg font-bold text-slate-900">
                Request Not Found
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Please make sure that your name, Purok/Street, and document
                type exactly match the information used when you submitted
                your request.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}