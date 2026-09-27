"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import {
  Bell,
  FileText,
  Megaphone,
  Package,
  Search,
  CheckCircle2,
  Clock3,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  CalendarDays,
  UserRound,
} from "lucide-react";

import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

type RequestType =
  | "Document Request"
  | "Complaint"
  | "Asset Borrowing";

type RequestItem = {
  id: string;
  type: RequestType;
  title: string;
  status: string;
  createdAt: Date | null;
  details: string;
  extraDetails?: string;
};

const documentStatuses = [
  "Pending",
  "Under Review",
  "Approved",
  "Completed",
];

const complaintStatuses = [
  "Pending",
  "Under Review",
  "For Action",
  "In Progress",
  "Resolved",
];

const assetStatuses = [
  "Pending",
  "Under Review",
  "Approved",
  "Released",
  "Returned",
];

function convertTimestamp(value: unknown): Date | null {
  if (value instanceof Timestamp) {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  return null;
}

function getStatuses(type: RequestType) {
  if (type === "Document Request") {
    return documentStatuses;
  }

  if (type === "Complaint") {
    return complaintStatuses;
  }

  return assetStatuses;
}

function getStatusIndex(
  statuses: string[],
  currentStatus: string
) {
  return statuses.indexOf(currentStatus);
}

function StatusTimeline({
  statuses,
  currentStatus,
}: {
  statuses: string[];
  currentStatus: string;
}) {
  const currentIndex = getStatusIndex(
    statuses,
    currentStatus
  );

  return (
    <div className="mt-6 overflow-x-auto pb-2">
      <div className="flex min-w-[620px] items-start">
        {statuses.map((status, index) => {
          const completed =
            currentIndex >= 0 && index <= currentIndex;

          const active = index === currentIndex;

          return (
            <div
              key={status}
              className="relative flex flex-1 flex-col items-center"
            >
              {index > 0 && (
                <div
                  className={`absolute right-1/2 top-4 h-0.5 w-full ${
                    index <= currentIndex
                      ? "bg-violet-500"
                      : "bg-slate-200"
                  }`}
                />
              )}

              <div
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                  active
                    ? "border-violet-600 bg-violet-600 text-white"
                    : completed
                    ? "border-violet-500 bg-violet-100 text-violet-700"
                    : "border-slate-200 bg-white text-slate-300"
                }`}
              >
                {completed ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <Clock3 size={15} />
                )}
              </div>

              <p
                className={`mt-2 text-center text-xs font-medium ${
                  active
                    ? "text-violet-700"
                    : completed
                    ? "text-slate-700"
                    : "text-slate-400"
                }`}
              >
                {status}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getIcon(type: RequestType) {
  if (type === "Document Request") {
    return <FileText size={22} />;
  }

  if (type === "Complaint") {
    return <Megaphone size={22} />;
  }

  return <Package size={22} />;
}

function getIconContainer(type: RequestType) {
  if (type === "Document Request") {
    return "bg-violet-100 text-violet-700";
  }

  if (type === "Complaint") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-emerald-100 text-emerald-700";
}

function getStatusStyle(status: string) {
  if (
    status === "Completed" ||
    status === "Resolved" ||
    status === "Returned"
  ) {
    return "bg-emerald-100 text-emerald-700";
  }

  if (
    status === "Rejected" ||
    status === "Damaged" ||
    status === "Lost"
  ) {
    return "bg-red-100 text-red-700";
  }

  if (
    status === "In Progress" ||
    status === "For Action" ||
    status === "Released"
  ) {
    return "bg-blue-100 text-blue-700";
  }

  if (status === "Overdue") {
    return "bg-orange-100 text-orange-700";
  }

  return "bg-amber-100 text-amber-700";
}

function getStatusMessage(
  type: RequestType,
  status: string
) {
  if (type === "Asset Borrowing") {
    switch (status) {
      case "Pending":
        return "Your equipment borrowing request has been submitted and is waiting for barangay review.";

      case "Under Review":
        return "Your equipment borrowing request is currently being reviewed by the barangay.";

      case "Approved":
        return "Your equipment borrowing request has been approved. Please wait for the release instructions.";

      case "Released":
        return "The requested barangay equipment has been released to you. Please return it on the agreed date.";

      case "Returned":
        return "The borrowed barangay equipment has been recorded as returned.";

      case "Rejected":
        return "Your equipment borrowing request was not approved. Please contact the barangay for details.";

      case "Overdue":
        return "The expected return date has passed. Please coordinate with the barangay regarding the borrowed equipment.";

      case "Damaged":
        return "The returned equipment was recorded with a damaged condition. Please coordinate with the barangay regarding the applicable action.";

      case "Lost":
        return "The borrowed equipment was recorded as lost. Please coordinate with the barangay regarding the applicable action.";

      default:
        return "Your equipment borrowing request has been updated.";
    }
  }

  if (type === "Document Request") {
    switch (status) {
      case "Pending":
        return "Your document request has been submitted and is waiting for review.";

      case "Under Review":
        return "Your document request is currently being reviewed by the barangay.";

      case "Approved":
        return "Your document request has been approved.";

      case "Rejected":
        return "Your document request was not approved. Please check with the barangay for details.";

      case "Completed":
        return "Your document request has been completed.";

      default:
        return "Your document request has been updated.";
    }
  }

  switch (status) {
    case "Pending":
      return "Your community concern has been submitted and is waiting for review.";

    case "Under Review":
      return "Your community concern is currently being reviewed.";

    case "For Action":
      return "Your community concern has been forwarded for appropriate action.";

    case "In Progress":
      return "Action is currently being taken regarding your community concern.";

    case "Resolved":
      return "Your community concern has been marked as resolved.";

    default:
      return "Your community concern has been updated.";
  }
}

export default function NotificationsPage() {
  const [fullName, setFullName] = useState("");
  const [purokStreet, setPurokStreet] = useState("");

  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSearch(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanName = fullName.trim();
    const cleanPurokStreet = purokStreet.trim();

    if (!cleanName || !cleanPurokStreet) {
      setErrorMessage(
        "Please enter your Full Name and Purok / Street."
      );
      return;
    }

    setLoading(true);
    setSearched(false);
    setRequests([]);
    setErrorMessage("");

    try {
      const foundRequests: RequestItem[] = [];

      // ==================================================
      // DOCUMENT REQUESTS
      // ==================================================

      const documentsQuery = query(
        collection(db, "documents"),
        where("fullName", "==", cleanName),
        where(
          "purokStreet",
          "==",
          cleanPurokStreet
        )
      );

      const documentsSnapshot =
        await getDocs(documentsQuery);

      documentsSnapshot.forEach(
        (documentSnapshot) => {
          const data = documentSnapshot.data();

          foundRequests.push({
            id: documentSnapshot.id,
            type: "Document Request",
            title:
              data.documentType ||
              "Barangay Document",
            status: data.status || "Pending",
            createdAt: convertTimestamp(
              data.createdAt
            ),
            details: data.purpose
              ? `Purpose: ${data.purpose}`
              : "Online document request",
          });
        }
      );

      // ==================================================
      // NAMED COMMUNITY CONCERNS
      // ==================================================

      const complaintsQuery = query(
        collection(db, "complaints"),
        where("fullName", "==", cleanName)
      );

      const complaintsSnapshot =
        await getDocs(complaintsQuery);

      complaintsSnapshot.forEach(
        (documentSnapshot) => {
          const data = documentSnapshot.data();

          if (!data.fullName) {
            return;
          }

          foundRequests.push({
            id: documentSnapshot.id,
            type: "Complaint",
            title: "Community Concern",
            status: data.status || "Pending",
            createdAt: convertTimestamp(
              data.createdAt
            ),
            details: data.locationOfConcern
              ? `Location: ${data.locationOfConcern}`
              : "Community concern submitted online",
          });
        }
      );

      // ==================================================
      // ASSET BORROWING
      // ==================================================

      const assetsQuery = query(
        collection(db, "assets"),
        where(
          "borrowerName",
          "==",
          cleanName
        ),
        where(
          "purokStreet",
          "==",
          cleanPurokStreet
        )
      );

      const assetsSnapshot =
        await getDocs(assetsQuery);

      assetsSnapshot.forEach(
        (documentSnapshot) => {
          const data = documentSnapshot.data();

          const quantity =
            Number(data.quantity) || 1;

          const borrowDate =
            data.borrowDate || "";

          const expectedReturnDate =
            data.expectedReturnDate || "";

          foundRequests.push({
            id: documentSnapshot.id,
            type: "Asset Borrowing",
            title:
              data.assetName ||
              "Barangay Asset",
            status: data.status || "Pending",
            createdAt: convertTimestamp(
              data.createdAt
            ),
            details: `Quantity: ${quantity}`,
            extraDetails:
              borrowDate || expectedReturnDate
                ? `Borrow date: ${
                    borrowDate || "Not specified"
                  }${
                    expectedReturnDate
                      ? ` • Expected return: ${expectedReturnDate}`
                      : ""
                  }`
                : undefined,
          });
        }
      );

      // ==================================================
      // SORT NEWEST FIRST
      // ==================================================

      foundRequests.sort((a, b) => {
        const dateA =
          a.createdAt?.getTime() ?? 0;

        const dateB =
          b.createdAt?.getTime() ?? 0;

        return dateB - dateA;
      });

      setRequests(foundRequests);
      setSearched(true);
    } catch (error) {
      console.error(
        "Error loading resident submissions:",
        error
      );

      setErrorMessage(
        "We could not load your submissions right now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-white">
      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="border-b border-violet-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <Bell size={21} />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">
                Barangay Poblacion North
              </p>

              <p className="truncate text-xs text-slate-500">
                Resident Notifications
              </p>
            </div>
          </Link>

          <Link
            href="/"
            className="hidden shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:inline-flex"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>
      </header>

      {/* ==================================================
          MAIN CONTENT
      ================================================== */}

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* Page Title */}

        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
            <Bell size={28} />
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            My Notifications
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            View the progress of your barangay
            document requests, community concerns,
            and asset borrowing submissions in one
            place.
          </p>
        </div>

        {/* ==================================================
            SEARCH FORM
        ================================================== */}

        <section className="mx-auto mt-8 max-w-3xl rounded-3xl border border-violet-100 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">
              Check My Submissions
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Enter the same information you used
              when submitting your barangay service
              request.
            </p>
          </div>

          <form
            onSubmit={handleSearch}
            className="space-y-5"
          >
            {/* Full Name */}

            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Full Name
              </label>

              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(event) =>
                  setFullName(event.target.value)
                }
                placeholder="Enter your full name"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              />
            </div>

            {/* Purok / Street */}

            <div>
              <label
                htmlFor="purokStreet"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Purok / Street
              </label>

              <input
                id="purokStreet"
                type="text"
                value={purokStreet}
                onChange={(event) =>
                  setPurokStreet(event.target.value)
                }
                placeholder="Example: Purok 1, Poblacion North"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              />
            </div>

            {/* Error */}

            {errorMessage && (
              <div className="flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0"
                />

                <p>{errorMessage}</p>
              </div>
            )}

            {/* Search Button */}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <RefreshCw
                    size={18}
                    className="animate-spin"
                  />
                  Checking...
                </>
              ) : (
                <>
                  <Search size={18} />
                  View My Submissions
                </>
              )}
            </button>
          </form>

          {/* Privacy Notice */}

          <div className="mt-5 rounded-xl bg-violet-50 p-4">
            <p className="text-xs leading-5 text-violet-800">
              <strong>Privacy Notice:</strong>{" "}
              This page displays submissions matching
              the information you provide. Anonymous
              community concerns are not displayed
              because they do not contain identifying
              information for resident lookup.
            </p>
          </div>
        </section>

        {/* ==================================================
            RESULTS
        ================================================== */}

        {searched && (
          <section className="mt-10">
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-slate-900">
                Your Submissions
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {requests.length === 0
                  ? "No matching submissions were found."
                  : `${requests.length} submission${
                      requests.length === 1
                        ? ""
                        : "s"
                    } found.`}
              </p>
            </div>

            {/* No Results */}

            {requests.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Search size={25} />
                </div>

                <h3 className="mt-4 text-lg font-bold text-slate-900">
                  No submissions found
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Make sure your Full Name and Purok /
                  Street exactly match the information
                  you provided when submitting your
                  request.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {requests.map((request) => {
                  const statuses = getStatuses(
                    request.type
                  );

                  return (
                    <article
                      key={`${request.type}-${request.id}`}
                      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                    >
                      <div className="p-5 sm:p-6">
                        {/* Request Header */}

                        <div className="flex flex-col gap-4">
                          <div className="flex min-w-0 items-start gap-4">
                            <div
                              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${getIconContainer(
                                request.type
                              )}`}
                            >
                              {getIcon(request.type)}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="break-words text-lg font-bold text-slate-900">
                                  {request.title}
                                </h3>

                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                  {request.type}
                                </span>
                              </div>

                              <p className="mt-1 text-sm text-slate-500">
                                {request.details}
                              </p>

                              {request.extraDetails && (
                                <div className="mt-3 flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:flex-wrap sm:gap-4">
                                  <span className="inline-flex items-center gap-1.5">
                                    <CalendarDays
                                      size={14}
                                    />
                                    {request.extraDetails}
                                  </span>
                                </div>
                              )}

                              {request.createdAt && (
                                <p className="mt-2 text-xs text-slate-400">
                                  Submitted{" "}
                                  {request.createdAt.toLocaleDateString(
                                    "en-PH",
                                    {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    }
                                  )}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Current Status */}

                          <div className="flex w-full items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3 sm:w-auto sm:self-end">
                            <span className="text-xs font-medium text-slate-500 sm:hidden">
                              Current Status
                            </span>

                            <span
                              className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-bold ${getStatusStyle(
                                request.status
                              )}`}
                            >
                              {request.status}
                            </span>
                          </div>
                        </div>

                        {/* Status Message */}

                        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-violet-100 bg-violet-50 p-4">
                          <div className="mt-0.5 shrink-0 text-violet-700">
                            {request.type ===
                            "Asset Borrowing" ? (
                              <Package size={18} />
                            ) : (
                              <Bell size={18} />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-violet-900">
                              {request.status}
                            </p>

                            <p className="mt-1 text-xs leading-5 text-violet-800">
                              {getStatusMessage(
                                request.type,
                                request.status
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Asset Borrower Information */}

                        {request.type ===
                          "Asset Borrowing" && (
                          <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                            <div className="flex items-start gap-3">
                              <UserRound
                                size={18}
                                className="mt-0.5 shrink-0 text-emerald-700"
                              />

                              <div>
                                <p className="text-sm font-semibold text-emerald-900">
                                  Equipment Borrowing
                                </p>

                                <p className="mt-1 text-xs leading-5 text-emerald-800">
                                  Please keep the equipment
                                  in good condition and
                                  return it on the agreed
                                  return date.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Progress */}

                        <StatusTimeline
                          statuses={statuses}
                          currentStatus={
                            request.status
                          }
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ==================================================
            SERVICE LINKS
        ================================================== */}

        <section className="mt-12">
          <div className="mb-5 text-center">
            <h2 className="text-xl font-bold text-slate-900">
              Need Another Service?
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Submit a new barangay service request.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* Documents */}

            <Link
              href="/documents"
              className="group rounded-2xl border border-violet-100 bg-white p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
            >
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                <FileText size={21} />
              </div>

              <h3 className="mt-3 text-sm font-bold text-slate-900">
                Request a Document
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Submit an online document request.
              </p>
            </Link>

            {/* Complaints */}

            <Link
              href="/complaints"
              className="group rounded-2xl border border-amber-100 bg-white p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-md"
            >
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Megaphone size={21} />
              </div>

              <h3 className="mt-3 text-sm font-bold text-slate-900">
                Submit a Concern
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Report a community concern.
              </p>
            </Link>

            {/* Assets */}

            <Link
              href="/assets"
              className="group rounded-2xl border border-emerald-100 bg-white p-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
            >
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Package size={21} />
              </div>

              <h3 className="mt-3 text-sm font-bold text-slate-900">
                Borrow an Asset
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Request barangay-owned equipment.
              </p>
            </Link>
          </div>
        </section>
      </div>

      {/* ==================================================
          FOOTER
      ================================================== */}

      <footer className="mt-16 border-t border-violet-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center sm:px-6 lg:px-8">
          <p className="text-xs text-slate-500">
            Barangay Poblacion North • Municipality of
            Polanco • Zamboanga del Norte
          </p>
        </div>
      </footer>
    </main>
  );
}