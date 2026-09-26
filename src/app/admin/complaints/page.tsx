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
import { useRouter } from "next/navigation";
import AdminAuthGuard from "@/components/AdminAuthGuard";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Eye,
  FileImage,
  Filter,
  Loader2,
  LogOut,
  Menu,
  MessageSquareWarning,
  Search,
  User,
  UserCheck,
  X,
} from "lucide-react";
import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

type ComplaintStatus =
  | "Pending"
  | "Under Review"
  | "For Action"
  | "In Progress"
  | "Resolved";

type SubmissionType = "anonymous" | "named";

interface Complaint {
  id: string;
  submissionType: SubmissionType;
  fullName: string;
  category: string;
  description: string;
  locationOfConcern: string;
  incidentDate: string;
  evidenceUrl: string;
  status: ComplaintStatus;
  adminNotes: string;
  assignedTo: string;
  submittedAt: string;
  createdAtValue: number;
}

const statusOptions: ComplaintStatus[] = [
  "Pending",
  "Under Review",
  "For Action",
  "In Progress",
  "Resolved",
];

const statusStyles: Record<
  ComplaintStatus,
  string
> = {
  Pending:
    "bg-amber-100 text-amber-800 border-amber-200",
  "Under Review":
    "bg-blue-100 text-blue-800 border-blue-200",
  "For Action":
    "bg-orange-100 text-orange-800 border-orange-200",
  "In Progress":
    "bg-violet-100 text-violet-800 border-violet-200",
  Resolved:
    "bg-green-100 text-green-800 border-green-200",
};

function AdminComplaintsContent() {
  const router = useRouter();

  const [complaints, setComplaints] = useState<
    Complaint[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [firestoreError, setFirestoreError] =
    useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"All" | ComplaintStatus>("All");

  const [selectedComplaint, setSelectedComplaint] =
    useState<Complaint | null>(null);

  const [photoModalUrl, setPhotoModalUrl] =
    useState("");

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [adminEmail, setAdminEmail] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  const [editStatus, setEditStatus] =
    useState<ComplaintStatus>("Pending");

  const [editNotes, setEditNotes] = useState("");
  const [editAssignedTo, setEditAssignedTo] =
    useState("");

  /*
   * Get currently logged-in admin.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setAdminEmail(user?.email || "");
      }
    );

    return () => unsubscribe();
  }, []);

  /*
   * Load complaints from Firestore in real time.
   *
   * We intentionally do not use orderBy() here so that
   * the page does not require a Firestore composite index.
   */
  useEffect(() => {
    setLoading(true);
    setFirestoreError("");

    const complaintsRef = collection(
      db,
      "complaints"
    );

    const unsubscribe = onSnapshot(
      complaintsRef,
      (snapshot) => {
        const loadedComplaints: Complaint[] =
          snapshot.docs.map((complaintDoc) => {
            const data = complaintDoc.data();

            const createdAt =
              data.createdAt?.toDate?.() || null;

            return {
              id: complaintDoc.id,

              submissionType:
                data.submissionType === "named"
                  ? "named"
                  : "anonymous",

              fullName: data.fullName || "",

              category:
                data.category ||
                "Community Concern",

              description:
                data.description || "",

              locationOfConcern:
                data.locationOfConcern || "",

              incidentDate:
                data.incidentDate || "",

              evidenceUrl:
                data.evidenceUrl || "",

              status:
                statusOptions.includes(
                  data.status
                )
                  ? data.status
                  : "Pending",

              adminNotes:
                data.adminNotes || "",

              assignedTo:
                data.assignedTo || "",

              submittedAt: createdAt
                ? createdAt.toLocaleString()
                : "Recently submitted",

              createdAtValue: createdAt
                ? createdAt.getTime()
                : 0,
            };
          });

        /*
         * Newest complaints first.
         */
        loadedComplaints.sort(
          (a, b) =>
            b.createdAtValue -
            a.createdAtValue
        );

        setComplaints(loadedComplaints);
        setLoading(false);
      },
      (error) => {
        console.error(
          "Firestore complaints error:",
          error
        );

        setFirestoreError(
          `Unable to load community concerns: ${error.message}`
        );

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  /*
   * Filter complaints.
   */
  const filteredComplaints = useMemo(() => {
    const search = searchTerm
      .trim()
      .toLowerCase();

    return complaints.filter((complaint) => {
      const matchesSearch =
        !search ||
        complaint.fullName
          .toLowerCase()
          .includes(search) ||
        complaint.description
          .toLowerCase()
          .includes(search) ||
        complaint.locationOfConcern
          .toLowerCase()
          .includes(search) ||
        complaint.category
          .toLowerCase()
          .includes(search);

      const matchesStatus =
        statusFilter === "All" ||
        complaint.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [
    complaints,
    searchTerm,
    statusFilter,
  ]);

  /*
   * Summary counts.
   */
  const pendingCount = complaints.filter(
    (item) => item.status === "Pending"
  ).length;

  const underReviewCount = complaints.filter(
    (item) => item.status === "Under Review"
  ).length;

  const forActionCount = complaints.filter(
    (item) => item.status === "For Action"
  ).length;

  const inProgressCount = complaints.filter(
    (item) => item.status === "In Progress"
  ).length;

  const resolvedCount = complaints.filter(
    (item) => item.status === "Resolved"
  ).length;

  /*
   * Open details modal.
   */
  const openComplaint = (
    complaint: Complaint
  ) => {
    setSelectedComplaint(complaint);

    setEditStatus(complaint.status);
    setEditNotes(complaint.adminNotes);
    setEditAssignedTo(
      complaint.assignedTo
    );

    setSaveMessage("");
    setSaveError("");
  };

  /*
   * Save admin changes.
   */
  const handleSaveChanges = async () => {
    if (!selectedComplaint) {
      return;
    }

    setSaving(true);
    setSaveMessage("");
    setSaveError("");

    try {
      const complaintRef = doc(
        db,
        "complaints",
        selectedComplaint.id
      );

      const updateData: Record<
        string,
        unknown
      > = {
        status: editStatus,
        adminNotes: editNotes.trim(),
        assignedTo:
          editAssignedTo.trim(),
        updatedAt: serverTimestamp(),
      };

      /*
       * Add resolvedAt only when complaint becomes
       * Resolved.
       */
      if (editStatus === "Resolved") {
        updateData.resolvedAt =
          serverTimestamp();
      } else {
        updateData.resolvedAt = null;
      }

      await updateDoc(
        complaintRef,
        updateData
      );

      setSaveMessage(
        "Complaint updated successfully."
      );

      /*
       * Update modal data immediately.
       * Firestore listener will also update the table.
       */
      setSelectedComplaint((previous) =>
        previous
          ? {
              ...previous,
              status: editStatus,
              adminNotes:
                editNotes.trim(),
              assignedTo:
                editAssignedTo.trim(),
            }
          : previous
      );
    } catch (error) {
      console.error(
        "Error updating complaint:",
        error
      );

      setSaveError(
        "Unable to update this complaint. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * Sign out admin.
   */
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace("/admin/login");
    } catch (error) {
      console.error(
        "Sign out error:",
        error
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() =>
            setMobileMenuOpen(false)
          }
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-violet-100 bg-white shadow-xl transition-transform duration-300 lg:translate-x-0 ${
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
              e-Barangay
            </p>

            <h1 className="mt-1 text-lg font-bold text-slate-900">
              Admin Portal
            </h1>
          </div>

          <button
            type="button"
            onClick={() =>
              setMobileMenuOpen(false)
            }
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          <button
            type="button"
            onClick={() =>
              router.push("/admin")
            }
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
          >
            <ClipboardList size={19} />
            Dashboard
          </button>

          <button
            type="button"
            onClick={() =>
              router.push("/admin/documents")
            }
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
          >
            <ClipboardList size={19} />
            Document Requests
          </button>

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl bg-violet-100 px-4 py-3 text-sm font-semibold text-violet-700"
          >
            <MessageSquareWarning size={19} />
            Community Concerns
          </button>

          <button
            type="button"
            onClick={() =>
              router.push("/admin/assets")
            }
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
          >
            <ClipboardList size={19} />
            Asset Borrowing
          </button>

          <div className="my-4 border-t border-slate-100" />

          <button
            type="button"
            onClick={() =>
              router.push("/")
            }
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
          >
            <ArrowLeft size={19} />
            Public Portal
          </button>
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="mb-3 rounded-xl bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-500">
              Signed in as
            </p>

            <p className="mt-1 truncate text-sm font-semibold text-slate-800">
              {adminEmail ||
                "Barangay Administrator"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-72">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setMobileMenuOpen(true)
                }
                className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              >
                <Menu size={22} />
              </button>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
                  Administration
                </p>

                <h2 className="text-xl font-bold text-slate-900">
                  Community Concerns
                </h2>
              </div>
            </div>

            <div className="hidden items-center gap-3 sm:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                <User size={19} />
              </div>

              <div className="hidden md:block">
                <p className="text-xs text-slate-500">
                  Admin
                </p>

                <p className="max-w-[220px] truncate text-sm font-semibold text-slate-800">
                  {adminEmail ||
                    "Barangay Administrator"}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          {/* Page Intro */}
          <div className="mb-8">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  <MessageSquareWarning
                    size={25}
                  />
                </div>

                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  Community Concerns
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Review and manage concerns submitted
                  through the public Barangay Poblacion
                  North portal.
                </p>
              </div>

              <div className="rounded-xl border border-violet-100 bg-violet-50 px-4 py-3">
                <p className="text-xs font-medium text-violet-600">
                  Total Concerns
                </p>

                <p className="mt-1 text-2xl font-bold text-violet-800">
                  {complaints.length}
                </p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="mb-8 grid grid-cols-2 gap-4 xl:grid-cols-5">
            <SummaryCard
              label="Pending"
              value={pendingCount}
              icon={<AlertCircle size={20} />}
              iconClass="bg-amber-100 text-amber-700"
            />

            <SummaryCard
              label="Under Review"
              value={underReviewCount}
              icon={<Eye size={20} />}
              iconClass="bg-blue-100 text-blue-700"
            />

            <SummaryCard
              label="For Action"
              value={forActionCount}
              icon={
                <ClipboardList size={20} />
              }
              iconClass="bg-orange-100 text-orange-700"
            />

            <SummaryCard
              label="In Progress"
              value={inProgressCount}
              icon={
                <Loader2 size={20} />
              }
              iconClass="bg-violet-100 text-violet-700"
            />

            <SummaryCard
              label="Resolved"
              value={resolvedCount}
              icon={
                <CheckCircle2 size={20} />
              }
              iconClass="bg-green-100 text-green-700"
            />
          </div>

          {/* Error */}
          {firestoreError && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
              <div className="flex gap-3">
                <AlertCircle
                  size={20}
                  className="mt-0.5 shrink-0 text-red-600"
                />

                <div>
                  <p className="font-semibold text-red-800">
                    Unable to load concerns
                  </p>

                  <p className="mt-1 text-sm leading-6 text-red-700">
                    {firestoreError}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
              <div className="relative">
                <Search
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) =>
                    setSearchTerm(e.target.value)
                  }
                  placeholder="Search by name, description, or location..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                />
              </div>

              <div className="relative">
                <Filter
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value as
                        | "All"
                        | ComplaintStatus
                    )
                  }
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                >
                  <option value="All">
                    All Statuses
                  </option>

                  {statusOptions.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Loading */}
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <Loader2
                size={34}
                className="mx-auto animate-spin text-violet-600"
              />

              <p className="mt-4 text-sm font-medium text-slate-600">
                Loading community concerns...
              </p>
            </div>
          ) : filteredComplaints.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <MessageSquareWarning
                  size={28}
                />
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-800">
                No community concerns found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Submitted concerns from residents will
                appear here automatically.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1000px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                          Resident
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                          Concern
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                          Location
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                          Evidence
                        </th>

                        <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                          Status
                        </th>

                        <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredComplaints.map(
                        (complaint) => (
                          <tr
                            key={complaint.id}
                            className="border-b border-slate-100 last:border-0 hover:bg-violet-50/30"
                          >
                            <td className="px-5 py-5">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                                  {complaint.submissionType ===
                                  "anonymous" ? (
                                    <MessageSquareWarning
                                      size={18}
                                    />
                                  ) : (
                                    <User size={18} />
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-800">
                                    {complaint.submissionType ===
                                    "anonymous"
                                      ? "Anonymous"
                                      : complaint.fullName ||
                                        "Named Resident"}
                                  </p>

                                  <p className="mt-1 text-xs text-slate-400">
                                    {complaint.submittedAt}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="max-w-[300px] px-5 py-5">
                              <p className="font-semibold text-slate-800">
                                Community Concern
                              </p>

                              <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                                {
                                  complaint.description
                                }
                              </p>
                            </td>

                            <td className="px-5 py-5">
                              <p className="max-w-[180px] text-sm text-slate-600">
                                {complaint.locationOfConcern ||
                                  "Not provided"}
                              </p>
                            </td>

                            <td className="px-5 py-5">
                              {complaint.evidenceUrl ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPhotoModalUrl(
                                      complaint.evidenceUrl
                                    )
                                  }
                                  className="inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
                                >
                                  <FileImage
                                    size={15}
                                  />
                                  View Photo
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400">
                                  No photo
                                </span>
                              )}
                            </td>

                            <td className="px-5 py-5">
                              <StatusBadge
                                status={
                                  complaint.status
                                }
                              />
                            </td>

                            <td className="px-5 py-5 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  openComplaint(
                                    complaint
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-violet-700"
                              >
                                <Eye size={15} />
                                View Details
                              </button>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards */}
              <div className="space-y-4 lg:hidden">
                {filteredComplaints.map(
                  (complaint) => (
                    <div
                      key={complaint.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                            {complaint.submissionType ===
                            "anonymous" ? (
                              <MessageSquareWarning
                                size={19}
                              />
                            ) : (
                              <User size={19} />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-800">
                              {complaint.submissionType ===
                              "anonymous"
                                ? "Anonymous"
                                : complaint.fullName ||
                                  "Named Resident"}
                            </p>

                            <p className="mt-1 text-xs text-slate-400">
                              {complaint.submittedAt}
                            </p>
                          </div>
                        </div>

                        <StatusBadge
                          status={
                            complaint.status
                          }
                        />
                      </div>

                      <div className="mt-5">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Concern
                        </p>

                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-700">
                          {
                            complaint.description
                          }
                        </p>
                      </div>

                      <div className="mt-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Location
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          {complaint.locationOfConcern ||
                            "Not provided"}
                        </p>
                      </div>

                      {complaint.evidenceUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            setPhotoModalUrl(
                              complaint.evidenceUrl
                            )
                          }
                          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700"
                        >
                          <FileImage size={15} />
                          View Proof Photo
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          openComplaint(
                            complaint
                          )
                        }
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700"
                      >
                        <Eye size={17} />
                        View & Manage Concern
                      </button>
                    </div>
                  )
                )}
              </div>
            </>
          )}

          {/* Workflow */}
          <div className="mt-8 rounded-2xl border border-violet-100 bg-violet-50 p-6">
            <h3 className="font-bold text-violet-900">
              Administrative Workflow
            </h3>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              {statusOptions.map(
                (status, index) => (
                  <div
                    key={status}
                    className="flex items-center gap-2"
                  >
                    <span
                      className={`rounded-lg border px-3 py-2 text-xs font-semibold ${statusStyles[status]}`}
                    >
                      {status}
                    </span>

                    {index <
                      statusOptions.length - 1 && (
                      <span className="text-violet-300">
                        →
                      </span>
                    )}
                  </div>
                )
              )}
            </div>

            <p className="mt-4 text-xs leading-6 text-violet-700">
              Administrators should update the status as
              the concern progresses. Internal notes and
              assigned personnel are visible only to
              authorized administrators.
            </p>
          </div>
        </main>
      </div>

      {/* Complaint Details Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-5 sm:px-7">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
                  Community Concern
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Concern Details
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedComplaint(null)
                }
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                <X size={22} />
              </button>
            </div>

            <div className="space-y-7 p-5 sm:p-7">
              {/* Resident Info */}
              <section>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
                  Submission Information
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoBox
                    label="Submission Type"
                    value={
                      selectedComplaint.submissionType ===
                      "anonymous"
                        ? "Anonymous"
                        : "Provide My Name"
                    }
                  />

                  <InfoBox
                    label="Name"
                    value={
                      selectedComplaint.submissionType ===
                      "anonymous"
                        ? "Anonymous"
                        : selectedComplaint.fullName ||
                          "Not provided"
                    }
                  />

                  <InfoBox
                    label="Category"
                    value="Community Concern"
                  />

                  <InfoBox
                    label="Submitted"
                    value={
                      selectedComplaint.submittedAt
                    }
                  />
                </div>
              </section>

              {/* Concern */}
              <section>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
                  Concern Information
                </h3>

                <div className="space-y-4">
                  <InfoBox
                    label="Location of Concern"
                    value={
                      selectedComplaint.locationOfConcern ||
                      "Not provided"
                    }
                  />

                  <InfoBox
                    label="Date of Incident"
                    value={
                      selectedComplaint.incidentDate ||
                      "Not provided"
                    }
                  />

                  <div>
                    <p className="mb-2 text-xs font-semibold text-slate-400">
                      Description
                    </p>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                        {
                          selectedComplaint.description
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Evidence */}
              <section>
                <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">
                  Photo of Proof / Supporting Evidence
                </h3>

                {selectedComplaint.evidenceUrl ? (
                  <div className="overflow-hidden rounded-2xl border border-violet-100 bg-violet-50">
                    <div className="relative">
                      <img
                        src={
                          selectedComplaint.evidenceUrl
                        }
                        alt="Complaint supporting evidence"
                        className="max-h-[420px] w-full object-contain bg-slate-100"
                      />
                    </div>

                    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-violet-600">
                          <FileImage
                            size={19}
                          />
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            Supporting photo attached
                          </p>

                          <p className="text-xs text-slate-500">
                            Uploaded by the resident
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setPhotoModalUrl(
                            selectedComplaint.evidenceUrl
                          )
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-violet-700"
                      >
                        <Eye size={15} />
                        View Full Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                    <FileImage
                      size={28}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 text-sm font-medium text-slate-500">
                      No supporting photo was attached.
                    </p>
                  </div>
                )}
              </section>

              {/* Admin Management */}
              <section className="rounded-2xl border border-violet-100 bg-violet-50 p-5">
                <div className="mb-5">
                  <h3 className="font-bold text-violet-900">
                    Administrative Management
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-violet-700">
                    These fields are for authorized barangay
                    personnel and are not visible to residents.
                  </p>
                </div>

                <div className="space-y-5">
                  {/* Status */}
                  <div>
                    <label
                      htmlFor="adminStatus"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Status
                    </label>

                    <select
                      id="adminStatus"
                      value={editStatus}
                      onChange={(e) =>
                        setEditStatus(
                          e.target.value as ComplaintStatus
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                    >
                      {statusOptions.map(
                        (status) => (
                          <option
                            key={status}
                            value={status}
                          >
                            {status}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                  {/* Assigned To */}
                  <div>
                    <label
                      htmlFor="assignedTo"
                      className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700"
                    >
                      <UserCheck size={16} />
                      Assigned Personnel
                    </label>

                    <input
                      id="assignedTo"
                      type="text"
                      value={editAssignedTo}
                      onChange={(e) =>
                        setEditAssignedTo(
                          e.target.value
                        )
                      }
                      placeholder="Example: Barangay Secretary"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                    />
                  </div>

                  {/* Admin Notes */}
                  <div>
                    <label
                      htmlFor="adminNotes"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Internal Notes
                    </label>

                    <textarea
                      id="adminNotes"
                      value={editNotes}
                      onChange={(e) =>
                        setEditNotes(
                          e.target.value
                        )
                      }
                      rows={5}
                      placeholder="Add internal notes, action taken, verification details, or other administrative information..."
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                    />
                  </div>
                </div>
              </section>

              {/* Save messages */}
              {saveMessage && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                  <div className="flex gap-3">
                    <CheckCircle2
                      size={19}
                      className="mt-0.5 shrink-0 text-green-600"
                    />

                    <p className="text-sm font-medium text-green-700">
                      {saveMessage}
                    </p>
                  </div>
                </div>
              )}

              {saveError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <div className="flex gap-3">
                    <AlertCircle
                      size={19}
                      className="mt-0.5 shrink-0 text-red-600"
                    />

                    <p className="text-sm font-medium text-red-700">
                      {saveError}
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedComplaint(null)
                  }
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
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
        </div>
      )}

      {/* Full Photo Modal */}
      {photoModalUrl && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-4">
          <div className="relative flex max-h-[95vh] max-w-6xl items-center justify-center">
            <button
              type="button"
              onClick={() =>
                setPhotoModalUrl("")
              }
              className="absolute right-2 top-2 z-10 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80"
            >
              <X size={22} />
            </button>

            <img
              src={photoModalUrl}
              alt="Community concern proof"
              className="max-h-[90vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}

/*
 * Summary Card
 */
function SummaryCard({
  label,
  value,
  icon,
  iconClass,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

/*
 * Status Badge
 */
function StatusBadge({
  status,
}: {
  status: ComplaintStatus;
}) {
  return (
    <span
      className={`inline-flex rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${statusStyles[status]}`}
    >
      {status}
    </span>
  );
}

/*
 * Information Box
 */
function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-semibold text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium leading-6 text-slate-700">
        {value}
      </p>
    </div>
  );
}

/*
 * Protected Admin Page
 */
export default function AdminComplaintsPage() {
  return (
    <AdminAuthGuard>
      <AdminComplaintsContent />
    </AdminAuthGuard>
  );
}