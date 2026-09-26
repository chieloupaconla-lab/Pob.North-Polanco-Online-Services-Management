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
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  FileText,
  Loader2,
  LogOut,
  Menu,
  Package,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

import { auth, db } from "@/lib/firebase";
import AdminAuthGuard from "@/components/AdminAuthGuard";

type AssetStatus =
  | "Pending"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "Released"
  | "Returned"
  | "Overdue"
  | "Damaged"
  | "Lost";

type AssetRequest = {
  id: string;
  borrowerName: string;
  borrowerContactNumber: string;
  purokStreet: string;
  assetName: string;
  quantity: number;
  purpose: string;
  borrowDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  witnessName: string;
  witnessRelationship: string;
  witnessContactNumber: string;
  status: AssetStatus;
  returnCondition?: string;
  damageDetails?: string;
  lossDetails?: string;
  penalty?: string;
  adminNotes?: string;
  createdAt?: {
    seconds: number;
    nanoseconds: number;
  };
  updatedAt?: unknown;
};

const statuses: AssetStatus[] = [
  "Pending",
  "Under Review",
  "Approved",
  "Rejected",
  "Released",
  "Returned",
  "Overdue",
  "Damaged",
  "Lost",
];

const assets = [
  "Chairs",
  "Tables",
  "Tents",
  "Sound System",
  "Other Barangay-Owned Asset",
];

function formatDate(date?: string) {
  if (!date) return "—";

  const parsed = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCreatedAt(timestamp?: AssetRequest["createdAt"]) {
  if (!timestamp?.seconds) return "—";

  return new Date(timestamp.seconds * 1000).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: AssetStatus }) {
  const styles: Record<AssetStatus, string> = {
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    "Under Review": "bg-blue-50 text-blue-700 border-blue-200",
    Approved: "bg-violet-50 text-violet-700 border-violet-200",
    Rejected: "bg-red-50 text-red-700 border-red-200",
    Released: "bg-indigo-50 text-indigo-700 border-indigo-200",
    Returned: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Overdue: "bg-orange-50 text-orange-700 border-orange-200",
    Damaged: "bg-rose-50 text-rose-700 border-rose-200",
    Lost: "bg-slate-100 text-slate-700 border-slate-300",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function SummaryCard({
  label,
  count,
  icon,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{count}</p>
        </div>

        <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
          {icon}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value?: string | number;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-sm text-slate-700">{value || "—"}</p>
    </div>
  );
}

function AdminAssetsContent() {
  const router = useRouter();

  const [requests, setRequests] = useState<AssetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [assetFilter, setAssetFilter] = useState("All");

  const [selectedRequest, setSelectedRequest] =
    useState<AssetRequest | null>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [editStatus, setEditStatus] =
    useState<AssetStatus>("Pending");
  const [editNotes, setEditNotes] = useState("");
  const [editReturnCondition, setEditReturnCondition] = useState("");
  const [editDamageDetails, setEditDamageDetails] = useState("");
  const [editLossDetails, setEditLossDetails] = useState("");
  const [editPenalty, setEditPenalty] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const assetsQuery = query(
      collection(db, "assets"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      assetsQuery,
      (snapshot) => {
        const data: AssetRequest[] = snapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<AssetRequest, "id">),
        }));

        setRequests(data);
        setLoading(false);
        setError("");
      },
      (firebaseError) => {
        console.error(firebaseError);
        setError(firebaseError.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredRequests = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesSearch =
        !searchValue ||
        request.borrowerName?.toLowerCase().includes(searchValue) ||
        request.assetName?.toLowerCase().includes(searchValue) ||
        request.purokStreet?.toLowerCase().includes(searchValue) ||
        request.purpose?.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "All" || request.status === statusFilter;

      const matchesAsset =
        assetFilter === "All" || request.assetName === assetFilter;

      return matchesSearch && matchesStatus && matchesAsset;
    });
  }, [requests, search, statusFilter, assetFilter]);

  const summary = {
    pending: requests.filter((r) => r.status === "Pending").length,
    review: requests.filter((r) => r.status === "Under Review").length,
    approved: requests.filter((r) => r.status === "Approved").length,
    released: requests.filter((r) => r.status === "Released").length,
    returned: requests.filter((r) => r.status === "Returned").length,
    overdue: requests.filter((r) => r.status === "Overdue").length,
    issues: requests.filter(
      (r) => r.status === "Damaged" || r.status === "Lost"
    ).length,
  };

  const openRequest = (request: AssetRequest) => {
    setSelectedRequest(request);
    setEditStatus(request.status);
    setEditNotes(request.adminNotes || "");
    setEditReturnCondition(request.returnCondition || "");
    setEditDamageDetails(request.damageDetails || "");
    setEditLossDetails(request.lossDetails || "");
    setEditPenalty(request.penalty || "");
  };

  const closeRequest = () => {
    if (saving) return;

    setSelectedRequest(null);
  };

  const saveChanges = async () => {
    if (!selectedRequest) return;

    if (editStatus === "Rejected" && !editNotes.trim()) {
      alert("Please provide an admin note explaining the rejection.");
      return;
    }

    setSaving(true);

    try {
      const requestRef = doc(db, "assets", selectedRequest.id);

      await updateDoc(requestRef, {
        status: editStatus,
        adminNotes: editNotes.trim(),
        returnCondition: editReturnCondition.trim(),
        damageDetails: editDamageDetails.trim(),
        lossDetails: editLossDetails.trim(),
        penalty: editPenalty.trim(),
        updatedAt: serverTimestamp(),
        actualReturnDate:
          editStatus === "Returned" ||
          editStatus === "Damaged" ||
          editStatus === "Lost"
            ? new Date().toISOString().split("T")[0]
            : selectedRequest.actualReturnDate || null,
      });

      setSelectedRequest(null);
    } catch (error) {
      console.error(error);
      alert("Unable to save the changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace("/admin/login");
  };

  return (
    <div className="min-h-screen bg-violet-50">
      {/* Mobile Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-violet-100 bg-white px-4 py-3 lg:hidden">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
            Admin Portal
          </p>
          <p className="font-bold text-slate-900">
            Asset Borrowing
          </p>
        </div>

        <button
          onClick={() => setMobileMenuOpen(true)}
          className="rounded-xl border border-violet-100 p-2 text-slate-600"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-violet-100 bg-white transition-transform duration-200 lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-violet-100 px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-600 p-3 text-white">
                <ShieldCheck size={22} />
              </div>

              <div>
                <p className="font-bold text-slate-900">
                  e-Barangay
                </p>
                <p className="text-xs text-slate-500">
                  Admin Portal
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-4 py-5">
            <button
              onClick={() => router.push("/admin")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-violet-50"
            >
              <FileText size={18} />
              Dashboard
            </button>

            <button
              onClick={() => router.push("/admin/documents")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-violet-50"
            >
              <FileText size={18} />
              Document Requests
            </button>

            <button
              onClick={() => router.push("/admin/complaints")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-violet-50"
            >
              <AlertCircle size={18} />
              Community Concerns
            </button>

            <button
              className="flex w-full items-center gap-3 rounded-xl bg-violet-100 px-4 py-3 text-sm font-semibold text-violet-700"
            >
              <Package size={18} />
              Asset Borrowing
            </button>

            <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400">
              <Clock3 size={18} />
              Notifications
              <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px]">
                Soon
              </span>
            </button>

            <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400">
              <Settings size={18} />
              Settings
              <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px]">
                Soon
              </span>
            </button>

            <div className="my-4 border-t border-violet-100" />

            <button
              onClick={() => router.push("/")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-violet-50"
            >
              <ArrowLeft size={18} />
              Public Portal
            </button>
          </nav>

          <div className="border-t border-violet-100 p-4">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {mobileMenuOpen && (
        <button
          aria-label="Close menu"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden"
        />
      )}

      {/* Main */}
      <main className="lg:pl-72">
        <header className="hidden border-b border-violet-100 bg-white px-8 py-5 lg:block">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Barangay Poblacion North
              </p>
              <h1 className="text-2xl font-bold text-slate-900">
                Asset Borrowing & Returning
              </h1>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-violet-50 px-4 py-2">
              <UserRound size={18} className="text-violet-600" />
              <span className="text-sm font-medium text-slate-700">
                Authorized Admin
              </span>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
          {/* Intro */}
          <section className="rounded-3xl bg-gradient-to-r from-violet-700 to-indigo-700 p-6 text-white shadow-sm sm:p-8">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-violet-100">
                Administrative Management
              </p>

              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                Manage Barangay Asset Borrowing
              </h2>

              <p className="mt-3 text-sm leading-6 text-violet-100 sm:text-base">
                Review borrowing requests, approve releases, monitor
                return schedules, and record the condition of
                barangay-owned assets.
              </p>
            </div>
          </section>

          {/* Summary */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              label="Pending"
              count={summary.pending}
              icon={<Clock3 size={22} />}
            />

            <SummaryCard
              label="Under Review"
              count={summary.review}
              icon={<Eye size={22} />}
            />

            <SummaryCard
              label="Approved"
              count={summary.approved}
              icon={<CheckCircle2 size={22} />}
            />

            <SummaryCard
              label="Released"
              count={summary.released}
              icon={<Package size={22} />}
            />

            <SummaryCard
              label="Returned"
              count={summary.returned}
              icon={<RefreshCw size={22} />}
            />

            <SummaryCard
              label="Overdue"
              count={summary.overdue}
              icon={<AlertCircle size={22} />}
            />

            <SummaryCard
              label="Damaged / Lost"
              count={summary.issues}
              icon={<XCircle size={22} />}
            />

            <SummaryCard
              label="Total Requests"
              count={requests.length}
              icon={<Users size={22} />}
            />
          </section>

          {/* Filters */}
          <section className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="grid gap-3 lg:grid-cols-[1fr_200px_240px]">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search borrower, asset, location, or purpose..."
                  className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500"
              >
                <option value="All">All Statuses</option>

                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <select
                value={assetFilter}
                onChange={(e) => setAssetFilter(e.target.value)}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-violet-500"
              >
                <option value="All">All Assets</option>

                {assets.map((asset) => (
                  <option key={asset} value={asset}>
                    {asset}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Error */}
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold">
                Unable to load asset requests.
              </p>
              <p className="mt-1">{error}</p>
            </div>
          )}

          {/* Table */}
          <section className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm">
            <div className="border-b border-violet-100 px-5 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900">
                    Asset Borrowing Requests
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {filteredRequests.length} request
                    {filteredRequests.length !== 1 ? "s" : ""} found
                  </p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-64 items-center justify-center">
                <div className="text-center">
                  <Loader2
                    size={32}
                    className="mx-auto animate-spin text-violet-600"
                  />
                  <p className="mt-3 text-sm text-slate-500">
                    Loading asset requests...
                  </p>
                </div>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="flex min-h-64 items-center justify-center px-6 text-center">
                <div>
                  <Package
                    size={42}
                    className="mx-auto text-slate-300"
                  />
                  <h3 className="mt-4 font-semibold text-slate-800">
                    No asset requests found
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    New borrowing requests will appear here once
                    residents submit them.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Desktop */}
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full text-left">
                    <thead className="bg-violet-50/70">
                      <tr>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Borrower
                        </th>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Asset
                        </th>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Schedule
                        </th>
                        <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Status
                        </th>
                        <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {filteredRequests.map((request) => (
                        <tr
                          key={request.id}
                          className="transition hover:bg-violet-50/40"
                        >
                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-800">
                              {request.borrowerName}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {request.purokStreet}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-medium text-slate-800">
                              {request.assetName}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Quantity: {request.quantity}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm text-slate-700">
                              {formatDate(request.borrowDate)}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Return:{" "}
                              {formatDate(
                                request.expectedReturnDate
                              )}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge status={request.status} />
                          </td>

                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => openRequest(request)}
                              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-700"
                            >
                              <Eye size={15} />
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile */}
                <div className="divide-y divide-slate-100 lg:hidden">
                  {filteredRequests.map((request) => (
                    <button
                      key={request.id}
                      onClick={() => openRequest(request)}
                      className="w-full p-5 text-left hover:bg-violet-50/50"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {request.borrowerName}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {request.assetName} · Qty{" "}
                            {request.quantity}
                          </p>
                        </div>

                        <StatusBadge status={request.status} />
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-slate-400">
                            Borrow Date
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-700">
                            {formatDate(request.borrowDate)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-400">
                            Expected Return
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-700">
                            {formatDate(
                              request.expectedReturnDate
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-xs font-semibold text-violet-600">
                        View Request
                        <ChevronRight size={16} />
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>

          {/* Workflow */}
          <section className="rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
                <ShieldCheck size={22} />
              </div>

              <div>
                <h3 className="font-bold text-slate-900">
                  Administrative Workflow
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Review the borrower and witness information before
                  approving a request. After approval, record the
                  release of the asset. When the asset is returned,
                  record its actual return date and condition. Damaged
                  or lost assets can be documented together with any
                  applicable penalty.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold">
                  {[
                    "Pending",
                    "Under Review",
                    "Approved",
                    "Released",
                    "Returned",
                  ].map((status, index, array) => (
                    <div
                      key={status}
                      className="flex items-center gap-2"
                    >
                      <span className="rounded-full bg-violet-100 px-3 py-1.5 text-violet-700">
                        {status}
                      </span>

                      {index < array.length - 1 && (
                        <ChevronRight
                          size={14}
                          className="text-slate-400"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-4">
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-violet-100 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
                  Asset Request
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {selectedRequest.assetName}
                </h2>
              </div>

              <button
                onClick={closeRequest}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={22} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto p-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Borrower */}
                <section className="rounded-2xl border border-slate-200 p-5">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="rounded-xl bg-violet-50 p-2.5 text-violet-600">
                      <UserRound size={20} />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900">
                        Borrower Information
                      </h3>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <InfoRow
                      label="Full Name"
                      value={selectedRequest.borrowerName}
                    />

                    <InfoRow
                      label="Contact Number"
                      value={
                        selectedRequest.borrowerContactNumber
                      }
                    />

                    <InfoRow
                      label="Purok / Street"
                      value={selectedRequest.purokStreet}
                    />

                    <InfoRow
                      label="Purpose"
                      value={selectedRequest.purpose}
                    />
                  </div>
                </section>

                {/* Asset */}
                <section className="rounded-2xl border border-slate-200 p-5">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                      <Package size={20} />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900">
                        Asset Information
                      </h3>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <InfoRow
                      label="Asset"
                      value={selectedRequest.assetName}
                    />

                    <InfoRow
                      label="Quantity"
                      value={selectedRequest.quantity}
                    />

                    <InfoRow
                      label="Borrow Date"
                      value={formatDate(
                        selectedRequest.borrowDate
                      )}
                    />

                    <InfoRow
                      label="Expected Return"
                      value={formatDate(
                        selectedRequest.expectedReturnDate
                      )}
                    />

                    <InfoRow
                      label="Actual Return"
                      value={formatDate(
                        selectedRequest.actualReturnDate
                      )}
                    />
                  </div>
                </section>

                {/* Witness */}
                <section className="rounded-2xl border border-slate-200 p-5 lg:col-span-2">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
                      <Users size={20} />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900">
                        Witness / Checker
                      </h3>

                      <p className="text-xs text-slate-500">
                        Must be a different person from the borrower
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <InfoRow
                      label="Full Name"
                      value={selectedRequest.witnessName}
                    />

                    <InfoRow
                      label="Relationship"
                      value={
                        selectedRequest.witnessRelationship
                      }
                    />

                    <InfoRow
                      label="Contact Number"
                      value={
                        selectedRequest.witnessContactNumber
                      }
                    />
                  </div>
                </section>

                {/* Request info */}
                <section className="rounded-2xl border border-slate-200 p-5 lg:col-span-2">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                      <CalendarDays size={20} />
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900">
                        Request Information
                      </h3>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <InfoRow
                      label="Submitted"
                      value={formatCreatedAt(
                        selectedRequest.createdAt
                      )}
                    />

                    <InfoRow
                      label="Current Status"
                      value={selectedRequest.status}
                    />

                    <InfoRow
                      label="Request ID"
                      value={selectedRequest.id}
                    />
                  </div>
                </section>

                {/* Admin controls */}
                <section className="rounded-2xl border border-violet-200 bg-violet-50/50 p-5 lg:col-span-2">
                  <div className="mb-5">
                    <h3 className="font-bold text-slate-900">
                      Administrative Action
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Update the request status and record
                      administrative information.
                    </p>
                  </div>

                  <div className="grid gap-5 lg:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Status
                      </label>

                      <select
                        value={editStatus}
                        onChange={(e) =>
                          setEditStatus(
                            e.target.value as AssetStatus
                          )
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                      >
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Penalty
                      </label>

                      <input
                        value={editPenalty}
                        onChange={(e) =>
                          setEditPenalty(e.target.value)
                        }
                        placeholder="e.g. None / ₱500 / Applicable penalty"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Return Condition
                      </label>

                      <select
                        value={editReturnCondition}
                        onChange={(e) =>
                          setEditReturnCondition(e.target.value)
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                      >
                        <option value="">Not yet recorded</option>
                        <option value="Good Condition">
                          Good Condition
                        </option>
                        <option value="Minor Damage">
                          Minor Damage
                        </option>
                        <option value="Major Damage">
                          Major Damage
                        </option>
                        <option value="Lost">
                          Lost
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Damage Details
                      </label>

                      <input
                        value={editDamageDetails}
                        onChange={(e) =>
                          setEditDamageDetails(e.target.value)
                        }
                        placeholder="Describe any damage"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Loss Details
                      </label>

                      <input
                        value={editLossDetails}
                        onChange={(e) =>
                          setEditLossDetails(e.target.value)
                        }
                        placeholder="Describe any lost asset"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                      />
                    </div>

                    <div className="lg:col-span-2">
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Admin Notes
                      </label>

                      <textarea
                        value={editNotes}
                        onChange={(e) =>
                          setEditNotes(e.target.value)
                        }
                        rows={4}
                        placeholder="Add internal administrative notes..."
                        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                      />
                    </div>
                  </div>

                  {editStatus === "Rejected" && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      <div className="flex gap-3">
                        <AlertCircle
                          size={18}
                          className="mt-0.5 shrink-0"
                        />

                        <p>
                          A reason in Admin Notes is required when
                          rejecting a request.
                        </p>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col-reverse gap-3 border-t border-violet-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                onClick={closeRequest}
                disabled={saving}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={saveChanges}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={17} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminAssetsPage() {
  return (
    <AdminAuthGuard>
      <AdminAssetsContent />
    </AdminAuthGuard>
  );
}