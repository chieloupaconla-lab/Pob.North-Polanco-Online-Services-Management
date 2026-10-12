"use client";

import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  FileImage,
  FileText,
  Filter,
  Loader2,
  MapPin,
  MessageSquare,
  Search,
  ShieldCheck,
  User,
  X,
} from "lucide-react";

import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { logActivity } from "@/lib/activityLog";
import { createAdminNotification } from "@/lib/notifications";
import { formatNameForDisplay } from "@/lib/nameUtils";
import { archiveRecord, archiveRecords, restoreRecord } from "@/lib/archiveService";

import AdminAuthGuard from "@/components/admin/AdminAuthGuard";
import AdminFeatureShell from "@/components/admin/AdminFeatureShell";
import { getStoredPurok } from "@/lib/purokConfig";
import BulkArchiveBar from "@/components/admin/BulkArchiveBar";
import { OFFICIAL_COMPLAINT_CATEGORIES } from "@/config/complaintCategories";

type ComplaintStatus =
  | "Pending"
  | "Under Review"
  | "For Action"
  | "In Progress"
  | "Resolved";

type SubmissionType =
  | "anonymous"
  | "named";

interface Complaint {
  id: string;

  submissionType:
    SubmissionType;

  fullName: string;

  email: string;

  purok: string;

  category: string;

  customConcern: string;

  description: string;

  locationOfConcern: string;

  incidentDate: string;

  evidenceUrl: string;

  evidenceUploadStatus: string;

  status: ComplaintStatus;

  adminNotes: string;

  assignedTo: string;

  submittedAt: string;

  createdAtValue: number;
  archived?: boolean;
}

const statusOptions: ComplaintStatus[] = [
  "Pending",
  "Under Review",
  "For Action",
  "In Progress",
  "Resolved",
];

const categoryOptions = [
  ...OFFICIAL_COMPLAINT_CATEGORIES,
  "Community Concern",
  "Damaged Public Facility",
  "Road or Drainage Problem",
  "Streetlight Problem",
  "Public Safety Concern",
  "Other",
];

function getStatusClasses(
  status: ComplaintStatus
) {
  switch (status) {
    case "Pending":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "Under Review":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "For Action":
      return "bg-orange-50 text-orange-700 border-orange-200";

    case "In Progress":
      return "bg-violet-50 text-violet-700 border-violet-200";

    case "Resolved":
      return "bg-green-50 text-green-700 border-green-200";

    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

function getEvidenceStatusClasses(
  status: string
) {
  switch (status) {
    case "Uploaded":
      return "bg-green-50 text-green-700 border-green-200";

    case "Uploading":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "Failed":
    case "Failed - Image Too Large":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-slate-50 text-slate-500 border-slate-200";
  }
}

const COMPLAINTS_PAGE_SIZE = 50;

function mapComplaintDocument(
  complaintDoc: QueryDocumentSnapshot
): Complaint {
  const data = complaintDoc.data();
  const createdAt = data.createdAt?.toDate
    ? data.createdAt.toDate()
    : null;

  const normalizedStatus: ComplaintStatus =
    statusOptions.includes(data.status)
      ? data.status
      : "Pending";

  const normalizedSubmissionType: SubmissionType =
    data.submissionType === "Provide My Name" ||
    data.submissionType === "named"
      ? "named"
      : "anonymous";

  const evidenceUrl =
    typeof data.evidenceUrl === "string"
      ? data.evidenceUrl
      : "";

  const evidenceUploadStatus =
    typeof data.evidenceUploadStatus === "string"
      ? data.evidenceUploadStatus
      : evidenceUrl
        ? "Uploaded"
        : "No Photo";

  return {
    id: complaintDoc.id,
    submissionType: normalizedSubmissionType,
    fullName: formatNameForDisplay(data.fullName || ""),
    email: data.email || "",
    purok: getStoredPurok(data),
    category: data.category || "Community Concern",
    customConcern:
      typeof data.customConcern === "string"
        ? data.customConcern
        : "",
    description: data.description || "",
    locationOfConcern: data.locationOfConcern || "",
    incidentDate: data.incidentDate || "",
    evidenceUrl,
    evidenceUploadStatus,
    status: normalizedStatus,
    adminNotes: data.adminNotes || "",
    assignedTo: data.assignedTo || "",
    submittedAt: createdAt
      ? createdAt.toLocaleString()
      : "Recently submitted",
    createdAtValue: createdAt ? createdAt.getTime() : 0,
    archived: data.archived === true,
  };
}

export default function AdminComplaintsPage() {
  return (
    <AdminAuthGuard>
      <AdminComplaintsContent />
    </AdminAuthGuard>
  );
}

function AdminComplaintsContent() {
  const [complaints, setComplaints] =
    useState<Complaint[]>([]);

  const [lastVisibleComplaint, setLastVisibleComplaint] =
    useState<QueryDocumentSnapshot | null>(null);
  const [hasMoreComplaints, setHasMoreComplaints] = useState(false);
  const [loadingMoreComplaints, setLoadingMoreComplaints] = useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [searchQuery, setSearchQuery] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | ComplaintStatus>(
      "All"
    );

  const [categoryFilter, setCategoryFilter] =
    useState("All");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [selectedComplaint, setSelectedComplaint] =
    useState<Complaint | null>(null);

  const [photoModalUrl, setPhotoModalUrl] =
    useState<string | null>(null);

  const [saving, setSaving] =
    useState(false);

  const [saveMessage, setSaveMessage] =
    useState("");

  const [saveError, setSaveError] =
    useState("");

  const [editStatus, setEditStatus] =
    useState<ComplaintStatus>("Pending");

  const [editNotes, setEditNotes] =
    useState("");

  const [editAssignedTo, setEditAssignedTo] =
    useState("");

  /*
   * ============================================================
   * LOAD COMPLAINTS
   * ============================================================
   */

  useEffect(() => {
    // Keep only the newest page live. Older pages are fetched on demand.
    // This avoids downloading the entire complaints collection on every page visit.
    const complaintsQuery = query(
      collection(db, "complaints"),
      orderBy("createdAt", "desc"),
      limit(COMPLAINTS_PAGE_SIZE)
    );

    const unsubscribe = onSnapshot(
      complaintsQuery,
      (snapshot) => {
        const newestPage = snapshot.docs.map(mapComplaintDocument);
        const newestIds = new Set(newestPage.map((item) => item.id));

        setLastVisibleComplaint(
          snapshot.docs.length > 0
            ? snapshot.docs[snapshot.docs.length - 1]
            : null
        );
        setHasMoreComplaints(snapshot.docs.length === COMPLAINTS_PAGE_SIZE);

        // Preserve older pages already loaded, while allowing the live first page
        // to overwrite stale copies of records that are also in the newest page.
        setComplaints((current) => {
          const merged = new Map<string, Complaint>();
          current.forEach((item) => {
            if (!newestIds.has(item.id)) merged.set(item.id, item);
          });
          newestPage.forEach((item) => merged.set(item.id, item));
          return Array.from(merged.values()).sort(
            (a, b) => b.createdAtValue - a.createdAtValue
          );
        });

        setLoading(false);
        setError("");
      },
      (snapshotError) => {
        console.error("Error loading complaints:", snapshotError);
        setError(
          "Unable to load community concerns. Please check Firebase permissions and quota status."
        );
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const loadMoreComplaints = async () => {
    if (!lastVisibleComplaint || !hasMoreComplaints || loadingMoreComplaints) {
      return;
    }

    setLoadingMoreComplaints(true);
    setError("");

    try {
      const olderPageQuery = query(
        collection(db, "complaints"),
        orderBy("createdAt", "desc"),
        startAfter(lastVisibleComplaint),
        limit(COMPLAINTS_PAGE_SIZE)
      );
      const olderPageSnapshot = await getDocs(olderPageQuery);
      const olderPage = olderPageSnapshot.docs.map(mapComplaintDocument);

      setComplaints((current) => {
        const merged = new Map(current.map((item) => [item.id, item]));
        olderPage.forEach((item) => merged.set(item.id, item));
        return Array.from(merged.values()).sort(
          (a, b) => b.createdAtValue - a.createdAtValue
        );
      });

      setLastVisibleComplaint(
        olderPageSnapshot.docs.length > 0
          ? olderPageSnapshot.docs[olderPageSnapshot.docs.length - 1]
          : lastVisibleComplaint
      );
      setHasMoreComplaints(
        olderPageSnapshot.docs.length === COMPLAINTS_PAGE_SIZE
      );
    } catch (loadError) {
      console.error("Unable to load older complaints:", loadError);
      setError(
        "Unable to load older complaints. Please try again when Firestore is available."
      );
    } finally {
      setLoadingMoreComplaints(false);
    }
  };

  /*
   * ============================================================
   * FILTERED COMPLAINTS
   * ============================================================
   */

  const filteredComplaints =
    useMemo(() => {
      const query =
        searchQuery
          .trim()
          .toLowerCase();

      return complaints.filter(
        (complaint) => {
           const matchesArchive = showArchived
             ? complaint.archived === true
             : complaint.archived !== true;
          const matchesSearch =
            !query ||
            complaint.fullName
              .toLowerCase()
              .includes(query) ||
            complaint.purok
              .toLowerCase()
              .includes(query) ||
            complaint.category
              .toLowerCase()
              .includes(query) ||
            complaint.customConcern
              .toLowerCase()
              .includes(query) ||
            complaint.description
              .toLowerCase()
              .includes(query) ||
            complaint.locationOfConcern
              .toLowerCase()
              .includes(query) ||
            complaint.id
              .toLowerCase()
              .includes(query);

          const matchesStatus =
            statusFilter === "All" ||
            complaint.status ===
              statusFilter;

          const matchesCategory =
            categoryFilter === "All" ||
            complaint.category ===
              categoryFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesCategory &&
            matchesArchive
          );
        }
      );
    }, [
      complaints,
      searchQuery,
      statusFilter,
      categoryFilter,
      showArchived,
    ]);

  const activeVisibleComplaints = showArchived ? [] : filteredComplaints;
  const toggleSelected = (id: string, checked: boolean) => setSelectedIds((current) => checked ? [...new Set([...current, id])] : current.filter((item) => item !== id));
  const selectAll = (checked: boolean) => setSelectedIds(checked ? activeVisibleComplaints.map((complaint) => complaint.id) : []);
  const archiveSelected = async () => {
    if (selectedIds.length === 0 || !window.confirm("Archive selected records?\n\nThese records will be removed from the active list but will remain safely stored and available in the Archive.")) return;
    const count = selectedIds.length;
    try {
      await archiveRecords("complaints", selectedIds);
      const archivedIds = new Set(selectedIds);
      setComplaints((current) =>
        current.map((item) =>
          archivedIds.has(item.id) ? { ...item, archived: true } : item
        )
      );
      const admin = auth.currentUser;
      await logActivity({ action: "COMPLAINTS_BULK_ARCHIVED", category: "Complaints", description: `${admin?.email || "Administrator"} archived ${count} Complaints.`, actorType: "admin", actorName: admin?.email || "Administrator", actorId: admin?.uid, metadata: { count, recordIds: selectedIds } });
      setSelectedIds([]);
      window.alert(`${count} records archived successfully.`);
    } catch (error) {
      console.error("Unable to archive selected complaints:", error);
      setError("Unable to archive the selected complaints.");
    }
  };

  /*
   * ============================================================
   * SUMMARY
   * ============================================================
   */

  const summary = useMemo(() => {
    const scopedComplaints = showArchived
      ? complaints.filter((complaint) => complaint.archived === true)
      : complaints.filter((complaint) => complaint.archived !== true);
    return {
       total: scopedComplaints.length,

       pending: scopedComplaints.filter(
        (item) =>
          item.status === "Pending"
      ).length,

       underReview: scopedComplaints.filter(
        (item) =>
          item.status ===
          "Under Review"
      ).length,

       inProgress: scopedComplaints.filter(
        (item) =>
          item.status ===
            "For Action" ||
          item.status ===
            "In Progress"
      ).length,

       resolved: scopedComplaints.filter(
        (item) =>
          item.status === "Resolved"
      ).length,

       withPhoto: scopedComplaints.filter(
        (item) =>
          Boolean(item.evidenceUrl)
      ).length,

       failedPhotos: scopedComplaints.filter(
        (item) =>
          item.evidenceUploadStatus ===
            "Failed" ||
          item.evidenceUploadStatus ===
            "Failed - Image Too Large"
      ).length,
    };
  }, [complaints, showArchived]);

  /*
   * ============================================================
   * OPEN COMPLAINT
   * ============================================================
   */

  const openComplaint = (
    complaint: Complaint
  ) => {
    setSelectedComplaint(
      complaint
    );

    setEditStatus(
      complaint.status
    );

    setEditNotes(
      complaint.adminNotes
    );

    setEditAssignedTo(
      complaint.assignedTo
    );

    setSaveMessage("");
    setSaveError("");
  };

  /*
   * ============================================================
   * SAVE ADMIN CHANGES
   * ============================================================
   */

  const saveChanges = async () => {
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

        adminNotes:
          editNotes.trim(),

        assignedTo:
          editAssignedTo.trim(),

        updatedAt:
          serverTimestamp(),
      };

      if (
        editStatus === "Resolved"
      ) {
        updateData.resolvedAt =
          serverTimestamp();
      } else {
        updateData.resolvedAt = null;
      }

      await updateDoc(
        complaintRef,
        updateData
      );

      // Keep loaded pages in sync immediately, including older pages
      // that are fetched with one-time pagination reads.
      setComplaints((current) =>
        current.map((item) =>
          item.id === selectedComplaint.id
            ? {
                ...item,
                status: editStatus,
                adminNotes: editNotes.trim(),
                assignedTo: editAssignedTo.trim(),
              }
            : item
        )
      );

      const admin = auth.currentUser;
      const statusChanged =
        selectedComplaint.status !==
        editStatus;
      const assignmentChanged =
        selectedComplaint.assignedTo !==
        editAssignedTo.trim();
      const notesChanged =
        selectedComplaint.adminNotes !==
        editNotes.trim();

      if (statusChanged || assignmentChanged || notesChanged) {
        await logActivity({
          action: statusChanged
            ? editStatus === "Resolved"
              ? "COMPLAINT_RESOLVED"
              : "COMPLAINT_STATUS_UPDATED"
            : assignmentChanged
              ? "COMPLAINT_ASSIGNED"
              : "COMPLAINT_INFORMATION_UPDATED",
          category: "Complaints",
          description: statusChanged
            ? `${admin?.email || "Administrator"} changed complaint status from ${selectedComplaint.status} to ${editStatus}.`
            : `${admin?.email || "Administrator"} updated a community concern.`,
          actorType: "admin",
          actorName: admin?.email || "Administrator",
          actorId: admin?.uid,
          referenceId: selectedComplaint.id,
          referenceType: "complaint",
          status: editStatus,
          metadata: {
            category: selectedComplaint.category,
            ...(statusChanged
              ? {
                  previousStatus: selectedComplaint.status,
                  newStatus: editStatus,
                }
              : {}),
            ...(assignmentChanged
              ? { assignedTo: editAssignedTo.trim() }
              : {}),
          },
        });
      }

      if (statusChanged) {
        await createAdminNotification({
          title:
            editStatus === "Resolved"
              ? "Complaint Resolved"
              : "Complaint Status Changed",
          message: `A community concern status changed from ${selectedComplaint.status} to ${editStatus}.`,
          type: "complaint",
          referenceId: selectedComplaint.id,
          referenceType: "complaint",
          actionUrl: "/admin/complaints",
          metadata: {
            previousStatus: selectedComplaint.status,
            newStatus: editStatus,
          },
        });
      }

      setSaveMessage("Changes saved successfully.");

      setSelectedComplaint(
        (previous) =>
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
    } catch (saveErrorValue) {
      console.error(
        "Error saving complaint:",
        saveErrorValue
      );

      setSaveError(
        "Unable to save changes. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * ============================================================
   * RESET FILTERS
   * ============================================================
   */

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
    setCategoryFilter("All");
  };

  const archiveSelectedComplaint = async () => {
    if (!selectedComplaint) return;
    if (!window.confirm("Are you sure you want to archive this record?")) return;

    try {
      await archiveRecord("complaints", selectedComplaint.id);
      setComplaints((current) =>
        current.map((item) =>
          item.id === selectedComplaint.id
            ? { ...item, archived: true }
            : item
        )
      );
      await logActivity({
        action: "COMPLAINT_ARCHIVED",
        category: "Complaints",
        description: `${auth.currentUser?.email || "Administrator"} archived complaint ${selectedComplaint.id}.`,
        actorType: "admin",
        actorName: auth.currentUser?.email || "Administrator",
        actorId: auth.currentUser?.uid,
        referenceId: selectedComplaint.id,
        referenceType: "complaint",
        status: selectedComplaint.status,
      });
      window.alert("Record archived successfully.");
      setSelectedComplaint(null);
    } catch (error) {
      console.error("Unable to archive complaint:", error);
      setSaveError("Unable to archive this complaint.");
    }
  };

  const restoreSelectedComplaint = async () => {
    if (!selectedComplaint) return;
    if (!window.confirm("Restore this record to active complaints?")) return;

    try {
      await restoreRecord("complaints", selectedComplaint.id);
      setComplaints((current) =>
        current.map((item) =>
          item.id === selectedComplaint.id
            ? { ...item, archived: false }
            : item
        )
      );
      await logActivity({
        action: "COMPLAINT_RESTORED",
        category: "Complaints",
        description: `${auth.currentUser?.email || "Administrator"} restored complaint ${selectedComplaint.id}.`,
        actorType: "admin",
        actorName: auth.currentUser?.email || "Administrator",
        actorId: auth.currentUser?.uid,
        referenceId: selectedComplaint.id,
        referenceType: "complaint",
        status: selectedComplaint.status,
      });
      window.alert("Record restored successfully.");
      setSelectedComplaint(null);
    } catch (error) {
      console.error("Unable to restore complaint:", error);
      setSaveError("Unable to restore this complaint.");
    }
  };

  return (
    <AdminFeatureShell
      title="Complaints"
      description="Manage and respond to complaints and community concerns submitted by residents."
    >
    <div className="min-h-screen bg-slate-50">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="hidden">

        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">

          <div className="flex min-w-0 items-center gap-3">

            <a
              href="/admin"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
              title="Back to Admin Dashboard"
            >
              <ArrowLeft size={19} />
            </a>

            <div className="min-w-0">

              <div className="flex items-center gap-2">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <AlertCircle size={19} />
                </div>

                <div className="min-w-0">

                  <h1 className="truncate text-lg font-bold text-slate-900 sm:text-xl">
                    Community Concerns
                  </h1>

                  <p className="hidden text-xs text-slate-500 sm:block">
                    Review and manage resident
                    community concerns
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

      </header>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">

        {/* ====================================================
            PAGE INTRO
        ==================================================== */}

        <div className="mb-6">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <p className="text-sm font-semibold text-violet-600">
                Barangay Poblacion North
              </p>

              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Community Concern Management
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Review resident-submitted concerns,
                inspect photo evidence, update
                processing status, assign personnel,
                and add administrative notes.
              </p>

            </div>

          </div>

        </div>

        {/* ====================================================
            SUMMARY CARDS
        ==================================================== */}

        <div className="mb-5 flex w-full flex-wrap rounded-xl border border-slate-200 bg-white p-1 sm:w-fit">
          <button type="button" onClick={() => setShowArchived(false)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${!showArchived ? "bg-violet-50 text-violet-700" : "text-slate-500"}`}>Active Complaints</button>
          <button type="button" onClick={() => setShowArchived(true)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${showArchived ? "bg-violet-50 text-violet-700" : "text-slate-500"}`}>Archived Complaints</button>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">

          <SummaryCard
            label="Total"
            value={summary.total}
            icon={<FileText size={18} />}
            iconClass="bg-slate-100 text-slate-700"
          />

          <SummaryCard
            label="Pending"
            value={summary.pending}
            icon={<Clock size={18} />}
            iconClass="bg-amber-100 text-amber-700"
          />

          <SummaryCard
            label="Under Review"
            value={summary.underReview}
            icon={<Eye size={18} />}
            iconClass="bg-blue-100 text-blue-700"
          />

          <SummaryCard
            label="For Action"
            value={summary.inProgress}
            icon={<AlertCircle size={18} />}
            iconClass="bg-violet-100 text-violet-700"
          />

          <SummaryCard
            label="Resolved"
            value={summary.resolved}
            icon={<CheckCircle2 size={18} />}
            iconClass="bg-green-100 text-green-700"
          />

          <SummaryCard
            label="With Photo"
            value={summary.withPhoto}
            icon={<FileImage size={18} />}
            iconClass="bg-purple-100 text-purple-700"
          />

        </div>

        {/* ====================================================
            PHOTO WARNING
        ==================================================== */}

        {summary.failedPhotos > 0 && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">

            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div>

              <p className="text-sm font-bold text-red-800">
                {summary.failedPhotos} photo upload
                {summary.failedPhotos !== 1
                  ? "s"
                  : ""}{" "}
                failed
              </p>

              <p className="mt-1 text-xs leading-5 text-red-700">
                These complaints were submitted,
                but their supporting photo was not
                successfully uploaded to Firebase
                Storage.
              </p>

            </div>

          </div>
        )}

        {/* ====================================================
            FILTERS
        ==================================================== */}

        {!showArchived && <BulkArchiveBar visibleCount={activeVisibleComplaints.length} selectedCount={selectedIds.length} allSelected={activeVisibleComplaints.length > 0 && activeVisibleComplaints.every((complaint) => selectedIds.includes(complaint.id))} onSelectAll={selectAll} onArchive={() => void archiveSelected()} />}

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">

            <div className="flex-1">

              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Search
              </label>

              <div className="relative">

                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) =>
                    setSearchQuery(
                      event.target.value
                    )
                  }
                  placeholder="Search name, location, category, description..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
                />

              </div>

            </div>

            <div className="w-full lg:w-52">

              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Status
              </label>

              <div className="relative">

                <Filter
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target
                        .value as
                        | "All"
                        | ComplaintStatus
                    )
                  }
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-9 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
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

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

              </div>

            </div>

            <div className="w-full lg:w-56">

              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Category
              </label>

              <div className="relative">

                <select
                  value={categoryFilter}
                  onChange={(event) =>
                    setCategoryFilter(
                      event.target.value
                    )
                  }
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-9 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
                >
                  <option value="All">
                    All Categories
                  </option>

                  {categoryOptions.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    )
                  )}
                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

              </div>

            </div>

          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">

            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-bold text-slate-700">
                {filteredComplaints.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-slate-700">
                {complaints.length}
              </span>{" "}
              concerns
            </p>

            <div className="hidden items-center gap-2 text-xs text-slate-400 sm:flex">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Live updates enabled
            </div>

          </div>

        </section>

        {/* ====================================================
            ERROR
        ==================================================== */}

        {error && (
          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">

            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <div>
              <p className="text-sm font-bold text-red-800">
                Error
              </p>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>
            </div>

          </div>
        )}

        {/* ====================================================
            LOADING
        ==================================================== */}

        {loading ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">

            <Loader2
              size={32}
              className="mx-auto animate-spin text-violet-600"
            />

            <p className="mt-4 text-sm font-semibold text-slate-700">
              Loading community concerns...
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Connecting to the barangay records.
            </p>

          </div>
        ) : filteredComplaints.length ===
          0 ? (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <MessageSquare size={28} />
            </div>

            <h3 className="mt-5 text-lg font-bold text-slate-800">
              No community concerns found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              There are no complaints matching
              your current search and filter
              settings.
            </p>

            <button
              type="button"
              onClick={resetFilters}
              className="mt-5 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Clear Filters
            </button>

          </div>
        ) : (
          <>
            {/* ==================================================
                DESKTOP TABLE
            ================================================== */}

            <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm xl:block">

              <div className="w-full">

                <table className="w-full min-w-[980px] table-fixed">
                  <colgroup>
                    <col className="w-[4%]" />
                    <col className="w-[21%]" />
                    <col className="w-[15%]" />
                    <col className="w-[12%]" />
                    <col className="w-[12%]" />
                    <col className="w-[11%]" />
                    <col className="w-[10%]" />
                    <col className="w-[15%]" />
                  </colgroup>

                  <thead className="border-b border-slate-200 bg-slate-50">

                    <tr>
                      <th className="px-2 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400"><span className="sr-only">Select</span></th>

                      <th className="px-2 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Concern
                      </th>

                      <th className="px-2 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Resident
                      </th>

                      <th className="px-2 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Location
                      </th>

                      <th className="px-2 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Evidence
                      </th>

                      <th className="px-2 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Status
                      </th>

                      <th className="px-2 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Submitted
                      </th>

                      <th className="px-2 py-3 text-right text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        Action
                      </th>

                    </tr>

                  </thead>

                  <tbody className="divide-y divide-slate-100">

                    {filteredComplaints.map(
                      (complaint) => (
                        <tr
                          key={
                            complaint.id
                          }
                          className="align-top transition hover:bg-slate-50/70"
                        >
                          <td className="px-2 py-4">{!showArchived && <input type="checkbox" checked={selectedIds.includes(complaint.id)} onChange={(event) => toggleSelected(complaint.id, event.target.checked)} aria-label={`Select complaint ${complaint.id}`} className="h-4 w-4 accent-violet-600" />}</td>

                          <td className="min-w-0 px-2 py-4">

                            <div className="min-w-0">

                              <p className="break-words text-sm font-semibold leading-5 text-slate-800">
                                {
                                  complaint.category
                                }
                              </p>

                              {complaint.category === "Others" && complaint.customConcern && (
                                <p className="mt-1 break-words text-xs font-semibold text-violet-700">
                                  {complaint.customConcern}
                                </p>
                              )}

                              <p className="mt-1 break-words text-xs leading-5 text-slate-500">
                                {
                                  complaint.description
                                }
                              </p>

                              <p className="mt-2 break-all font-mono text-[10px] leading-4 text-slate-400">
                                ID:{" "}
                                {
                                  complaint.id
                                }
                              </p>

                            </div>

                          </td>

                          <td className="min-w-0 px-2 py-4">

                            {complaint.submissionType ===
                            "named" ? (
                              <div>

                                <div className="flex items-center gap-2">

                                  <User
                                    size={15}
                                    className="text-violet-500"
                                  />

                                  <p className="text-sm font-semibold text-slate-800">
                                    {complaint.fullName ||
                                      "Unnamed"}
                                  </p>

                                </div>

                                 {complaint.purok && (
                                  <p className="mt-1 break-words text-xs text-slate-500">
                                    {
                                       complaint.purok
                                    }
                                  </p>
                                )}

                              </div>
                            ) : (
                              <div>

                                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                  <ShieldCheck size={12} />
                                  Anonymous
                                </span>

                              </div>
                            )}

                          </td>

                          <td className="min-w-0 px-2 py-4">

                            <div className="flex min-w-0 items-start gap-1.5">

                              <MapPin
                                size={15}
                                className="mt-0.5 shrink-0 text-violet-500"
                              />

                              <span className="break-words text-xs leading-5 text-slate-600">
                                {
                                  complaint.locationOfConcern ||
                                  "Not provided"
                                }
                              </span>

                            </div>

                          </td>

                          {/* ====================================
                              PHOTO EVIDENCE
                          ==================================== */}

                          <td className="min-w-0 px-2 py-4">

                            {complaint.evidenceUrl ? (
                              <div className="space-y-2">

                                <button
                                  type="button"
                                  onClick={() =>
                                    setPhotoModalUrl(
                                      complaint.evidenceUrl
                                    )
                                  }
                                  className="inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-lg border border-violet-200 bg-violet-50 px-2 py-2 text-[11px] font-semibold text-violet-700 transition hover:bg-violet-100"
                                >
                                  <FileImage
                                    size={15}
                                  />
                                  View Photo
                                </button>

                                <p className="text-[10px] font-medium text-green-600">
                                  Photo uploaded
                                </p>

                              </div>
                            ) : complaint.evidenceUploadStatus ===
                              "Uploading" ? (
                              <span className="inline-flex items-center gap-2 text-xs font-medium text-blue-600">
                                <Loader2
                                  size={14}
                                  className="animate-spin"
                                />
                                Uploading...
                              </span>
                            ) : complaint.evidenceUploadStatus ===
                              "Failed" ||
                              complaint.evidenceUploadStatus ===
                                "Failed - Image Too Large" ? (
                              <div>

                                <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                                  <AlertCircle size={12} />
                                  Upload Failed
                                </span>

                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">
                                No photo
                              </span>
                            )}

                          </td>

                          <td className="min-w-0 px-2 py-4">

                            <span
                              className={`inline-flex max-w-full rounded-full border px-2 py-1 text-[11px] font-bold leading-4 ${getStatusClasses(
                                complaint.status
                              )}`}
                            >
                              {
                                complaint.status
                              }
                            </span>

                          </td>

                          <td className="min-w-0 px-2 py-4">

                            <p className="break-words text-[11px] leading-4 text-slate-500" title={complaint.submittedAt}>
                              {
                                complaint.submittedAt
                              }
                            </p>

                          </td>

                          <td className="px-2 py-4 text-right">

                            <button
                              type="button"
                              onClick={() =>
                                openComplaint(
                                  complaint
                                )
                              }
                              className="inline-flex max-w-full items-center justify-center gap-1 whitespace-nowrap rounded-xl bg-violet-600 px-2 py-2.5 text-[11px] font-bold text-white transition hover:bg-violet-700"
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

            {/* ==================================================
                MOBILE CARDS
            ================================================== */}

            <div className="mt-6 space-y-4 xl:hidden">

              {filteredComplaints.map(
                (complaint) => (
                  <article
                    key={complaint.id}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    {!showArchived && <input type="checkbox" checked={selectedIds.includes(complaint.id)} onChange={(event) => toggleSelected(complaint.id, event.target.checked)} aria-label={`Select complaint ${complaint.id}`} className="m-5 h-4 w-4 accent-violet-600" />}

                    <div className="border-b border-slate-100 p-5">

                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0">

                          <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
                            {
                              complaint.category
                            }
                          </p>

                          {complaint.category === "Others" && complaint.customConcern && (
                            <p className="mt-1 break-words text-xs font-semibold text-violet-700">
                              {complaint.customConcern}
                            </p>
                          )}

                          <h3 className="mt-1 break-words font-bold text-slate-900">
                            {
                              complaint.description
                            }
                          </h3>

                        </div>

                        <span
                          className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusClasses(
                            complaint.status
                          )}`}
                        >
                          {
                            complaint.status
                          }
                        </span>

                      </div>

                      <p className="mt-3 break-all font-mono text-[10px] text-slate-400">
                        ID:{" "}
                        {
                          complaint.id
                        }
                      </p>

                    </div>

                    <div className="space-y-4 p-5">

                      <div>

                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Resident
                        </p>

                        {complaint.submissionType ===
                        "named" ? (
                          <div className="mt-1">

                            <p className="text-sm font-semibold text-slate-800">
                              {
                                complaint.fullName ||
                                "Unnamed"
                              }
                            </p>

                             {complaint.purok && (
                              <p className="text-xs text-slate-500">
                                {
                                   complaint.purok
                                }
                              </p>
                            )}

                          </div>
                        ) : (
                          <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            <ShieldCheck size={12} />
                            Anonymous
                          </span>
                        )}

                      </div>

                      <div>

                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Location
                        </p>

                        <div className="mt-1 flex items-start gap-2">

                          <MapPin
                            size={14}
                            className="mt-0.5 shrink-0 text-violet-500"
                          />

                          <p className="break-words text-sm text-slate-600">
                            {
                              complaint.locationOfConcern ||
                              "Not provided"
                            }
                          </p>

                        </div>

                      </div>

                      <div>

                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Photo Evidence
                        </p>

                        {complaint.evidenceUrl ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPhotoModalUrl(
                                complaint.evidenceUrl
                              )
                            }
                            className="mt-2 inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700"
                          >
                            <FileImage size={15} />
                            View Photo
                          </button>
                        ) : complaint.evidenceUploadStatus ===
                          "Uploading" ? (
                          <p className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-blue-600">
                            <Loader2
                              size={14}
                              className="animate-spin"
                            />
                            Photo uploading...
                          </p>
                        ) : complaint.evidenceUploadStatus ===
                          "Failed" ||
                          complaint.evidenceUploadStatus ===
                            "Failed - Image Too Large" ? (
                          <p className="mt-2 text-xs font-medium text-red-500">
                            Photo upload failed
                          </p>
                        ) : (
                          <p className="mt-2 text-xs text-slate-400">
                            No photo provided
                          </p>
                        )}

                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-4">

                        <p className="text-xs text-slate-400">
                          {
                            complaint.submittedAt
                          }
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            openComplaint(
                              complaint
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white"
                        >
                          <Eye size={15} />
                          Details
                        </button>

                      </div>

                    </div>

                  </article>
                )
              )}

            </div>

            {hasMoreComplaints && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => void loadMoreComplaints()}
                  disabled={loadingMoreComplaints}
                  className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-5 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingMoreComplaints && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  {loadingMoreComplaints ? "Loading older complaints..." : "Load More Complaints"}
                </button>
              </div>
            )}
          </>
        )}

      </main>

      {/* ======================================================
          COMPLAINT DETAIL MODAL
      ====================================================== */}

      {selectedComplaint && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">

          <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

            {/* Modal Header */}

            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">

              <div className="min-w-0">

                <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
                  Community Concern
                </p>

                <h2 className="mt-1 truncate text-lg font-bold text-slate-900 sm:text-xl">
                  {
                    selectedComplaint.category
                  }
                </h2>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedComplaint(
                    null
                  )
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              >
                <X size={19} />
              </button>

            </div>

            {/* Modal Content */}

            <div className="overflow-y-auto">

              <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2">

                {/* ==================================================
                    LEFT
                ================================================== */}

                <div className="space-y-6">

                  {/* Resident */}

                  <section>

                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Resident Information
                    </h3>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

                      <div className="flex items-start gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                          {selectedComplaint.submissionType ===
                          "named" ? (
                            <User size={18} />
                          ) : (
                            <ShieldCheck size={18} />
                          )}
                        </div>

                        <div className="min-w-0">

                          <p className="text-sm font-bold text-slate-800">
                            {selectedComplaint.submissionType ===
                            "named"
                              ? selectedComplaint.fullName ||
                                "Unnamed"
                              : "Anonymous Resident"}
                          </p>

                          {selectedComplaint.submissionType ===
                            "named" &&
                           selectedComplaint.purok && (
                              <p className="mt-1 text-xs text-slate-500">
                                {
                                  selectedComplaint.purok
                                }
                              </p>
                            )}

                          <span className="mt-2 inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-500">
                            {selectedComplaint.submissionType ===
                            "named"
                              ? "Named Submission"
                              : "Anonymous Submission"}
                          </span>

                        </div>

                      </div>

                    </div>

                  </section>

                  {/* Concern */}

                  <section>

                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Concern Details
                    </h3>

                    <div className="space-y-4">

                      <div>

                        <p className="text-xs font-semibold text-slate-400">
                          Category
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {
                            selectedComplaint.category
                          }
                        </p>

                        {selectedComplaint.category === "Others" && selectedComplaint.customConcern && (
                          <p className="mt-2 break-words rounded-xl bg-violet-50 p-3 text-sm font-semibold text-violet-800">
                            Specific concern: {selectedComplaint.customConcern}
                          </p>
                        )}

                      </div>

                      <div>

                        <p className="text-xs font-semibold text-slate-400">
                          Description
                        </p>

                        <div className="mt-1 rounded-xl bg-slate-50 p-4">

                          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                            {
                              selectedComplaint.description
                            }
                          </p>

                        </div>

                      </div>

                      <div>

                        <p className="text-xs font-semibold text-slate-400">
                          Location of Concern
                        </p>

                        <div className="mt-1 flex items-start gap-2">

                          <MapPin
                            size={16}
                            className="mt-0.5 shrink-0 text-violet-500"
                          />

                          <p className="text-sm leading-6 text-slate-700">
                            {
                              selectedComplaint.locationOfConcern ||
                              "Not provided"
                            }
                          </p>

                        </div>

                      </div>

                      <div>

                        <p className="text-xs font-semibold text-slate-400">
                          Incident Date
                        </p>

                        <p className="mt-1 text-sm text-slate-700">
                          {
                            selectedComplaint.incidentDate ||
                            "Not provided"
                          }
                        </p>

                      </div>

                      <div>

                        <p className="text-xs font-semibold text-slate-400">
                          Submitted
                        </p>

                        <p className="mt-1 text-sm text-slate-700">
                          {
                            selectedComplaint.submittedAt
                          }
                        </p>

                      </div>

                    </div>

                  </section>

                  {/* ==================================================
                      PHOTO EVIDENCE
                  ================================================== */}

                  <section>

                    <div className="mb-3 flex items-center justify-between gap-3">

                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Photo of Proof / Supporting Evidence
                      </h3>

                      {selectedComplaint.evidenceUploadStatus && (
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${getEvidenceStatusClasses(
                            selectedComplaint.evidenceUploadStatus
                          )}`}
                        >
                          {
                            selectedComplaint.evidenceUploadStatus
                          }
                        </span>
                      )}

                    </div>

                    {selectedComplaint.evidenceUrl ? (
                      <div className="overflow-hidden rounded-2xl border border-violet-100 bg-violet-50">

                        <div className="bg-slate-100 p-3">

                          <img
                            src={
                              selectedComplaint.evidenceUrl
                            }
                            alt="Community concern supporting evidence"
                            className="max-h-[420px] w-full rounded-xl object-contain"
                          />

                        </div>

                        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-violet-600">
                              <FileImage size={19} />
                            </div>

                            <div>

                              <p className="text-sm font-semibold text-slate-800">
                                Supporting photo attached
                              </p>

                              <p className="text-xs text-slate-500">
                                Resident-provided
                                evidence
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
                    ) : selectedComplaint.evidenceUploadStatus ===
                      "Uploading" ? (
                      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-8 text-center">

                        <Loader2
                          size={30}
                          className="mx-auto animate-spin text-blue-600"
                        />

                        <p className="mt-3 text-sm font-semibold text-blue-700">
                          Photo is still uploading
                        </p>

                        <p className="mt-1 text-xs leading-5 text-blue-600">
                          The resident submitted a
                          photo and it is still being
                          uploaded.
                        </p>

                      </div>
                    ) : selectedComplaint.evidenceUploadStatus ===
                        "Failed" ||
                      selectedComplaint.evidenceUploadStatus ===
                        "Failed - Image Too Large" ? (
                      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">

                        <AlertCircle
                          size={30}
                          className="mx-auto text-red-500"
                        />

                        <p className="mt-3 text-sm font-semibold text-red-700">
                          Photo upload failed
                        </p>

                        <p className="mt-1 text-xs leading-5 text-red-600">
                          The complaint was submitted,
                          but the supporting photo was
                          not successfully uploaded.
                        </p>

                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">

                        <FileImage
                          size={28}
                          className="mx-auto text-slate-300"
                        />

                        <p className="mt-3 text-sm font-medium text-slate-500">
                          No supporting photo was
                          attached.
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          The resident did not provide
                          photo evidence.
                        </p>

                      </div>
                    )}

                  </section>

                </div>

                {/* ==================================================
                    RIGHT
                ================================================== */}

                <div className="space-y-6">

                  {/* Update */}

                  <section>

                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Process Complaint
                    </h3>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

                      <div>

                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Status
                        </label>

                        <select
                          value={editStatus}
                          onChange={(event) =>
                            setEditStatus(
                              event.target
                                .value as ComplaintStatus
                            )
                          }
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
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

                      <div className="mt-4">

                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Assigned Personnel
                        </label>

                        <input
                          type="text"
                          value={
                            editAssignedTo
                          }
                          onChange={(event) =>
                            setEditAssignedTo(
                              event.target
                                .value
                            )
                          }
                          placeholder="Enter personnel name"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
                        />

                      </div>

                      <div className="mt-4">

                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Admin Notes
                        </label>

                        <textarea
                          value={editNotes}
                          onChange={(event) =>
                            setEditNotes(
                              event.target.value
                            )
                          }
                          rows={7}
                          placeholder="Add internal notes about this concern..."
                          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
                        />

                      </div>

                      {saveMessage && (
                        <div className="mt-4 flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-xs font-medium text-green-700">

                          <CheckCircle2
                            size={16}
                            className="mt-0.5 shrink-0"
                          />

                          {saveMessage}

                        </div>
                      )}

                      {saveError && (
                        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">

                          <AlertCircle
                            size={16}
                            className="mt-0.5 shrink-0"
                          />

                          {saveError}

                        </div>
                      )}

                      <button
                        type="button"
                        onClick={saveChanges}
                        disabled={saving}
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving ? (
                          <>
                            <Loader2
                              size={17}
                              className="animate-spin"
                            />
                            Saving Changes...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={17} />
                            Save Changes
                          </>
                        )}
                      </button>

                    </div>

                  </section>

                  {/* Status Guide */}

                  <section>

                    <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                      Status Guide
                    </h3>

                    <div className="space-y-2">

                      {statusOptions.map(
                        (status) => (
                          <div
                            key={status}
                            className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3"
                          >

                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                status ===
                                "Pending"
                                  ? "bg-amber-400"
                                  : status ===
                                    "Under Review"
                                  ? "bg-blue-500"
                                  : status ===
                                    "For Action"
                                  ? "bg-orange-500"
                                  : status ===
                                    "In Progress"
                                  ? "bg-violet-500"
                                  : "bg-green-500"
                              }`}
                            />

                            <div>

                              <p className="text-xs font-bold text-slate-700">
                                {status}
                              </p>

                              <p className="text-[11px] text-slate-400">
                                {status ===
                                "Pending"
                                  ? "Newly submitted concern"
                                  : status ===
                                    "Under Review"
                                  ? "Being checked by barangay personnel"
                                  : status ===
                                    "For Action"
                                  ? "Requires appropriate action"
                                  : status ===
                                    "In Progress"
                                  ? "Action is currently ongoing"
                                  : "Concern has been resolved"}
                              </p>

                            </div>

                          </div>
                        )
                      )}

                    </div>

                  </section>

                  {/* Record ID */}

                  <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Complaint Record ID
                    </p>

                    <p className="mt-2 break-all font-mono text-xs text-slate-600">
                      {
                        selectedComplaint.id
                      }
                    </p>

                  </section>

                </div>

              </div>

            </div>

            {/* Modal Footer */}

            <div className="flex shrink-0 justify-end border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">

              <button
                type="button"
                onClick={() =>
                  setSelectedComplaint(
                    null
                  )
                }
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => void (selectedComplaint.archived ? restoreSelectedComplaint() : archiveSelectedComplaint())}
                disabled={saving}
                className="rounded-xl border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
              >
                {selectedComplaint.archived ? "Restore" : "Archive"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ======================================================
          FULL PHOTO MODAL
      ====================================================== */}

      {photoModalUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() =>
            setPhotoModalUrl(null)
          }
        >

          <div
            className="relative flex max-h-[95vh] max-w-7xl items-center justify-center"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              onClick={() =>
                setPhotoModalUrl(null)
              }
              className="absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
              aria-label="Close photo"
            >
              <X size={20} />
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
    </AdminFeatureShell>
  );
}

/*
 * ============================================================
 * SUMMARY CARD
 * ============================================================
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

      <div className="flex items-center justify-between gap-3">

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>

      </div>

      <p className="mt-4 text-2xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs font-medium text-slate-500">
        {label}
      </p>

    </div>
  );
}
