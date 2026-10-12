

"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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

  type DocumentData,

  type QueryDocumentSnapshot,

} from "firebase/firestore";

import { db } from "@/lib/firebase";

import { logActivity } from "@/lib/activityLog";

import { createAdminNotification } from "@/lib/notifications";

import { formatNameForDisplay } from "@/lib/nameUtils";

import { archiveRecord, archiveRecords, restoreRecord } from "@/lib/archiveService";

import AdminAuthGuard from "@/components/AdminAuthGuard";

import AdminFeatureShell from "@/components/admin/AdminFeatureShell";

import BulkArchiveBar from "@/components/admin/BulkArchiveBar";

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

import { getStoredPurok } from "@/lib/purokConfig";

import { DOCUMENT_TYPES } from "@/config/documentTypes";

type DocumentStatus =

  | "Pending"

  | "Under Review"

  | "Approved"

  | "Rejected"

  | "Completed";

interface DocumentRequest {

  id: string;

  fullName: string;

  email: string;

  purok: string;

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

  archived?: boolean;

}

const statuses: DocumentStatus[] = [

  "Pending",

  "Under Review",

  "Approved",

  "Rejected",

  "Completed",

];

export default function AdminDocumentsPage() {

  const router = useRouter();

  const [requests, setRequests] = useState<DocumentRequest[]>([]);

  const [loading, setLoading] = useState(true);

  const [loadingMore, setLoadingMore] = useState(false);

  const [hasMore, setHasMore] = useState(false);

  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  const firstPageIds = useRef<Set<string>>(new Set());

  const initialSnapshotReceived = useRef(false);

  const endReached = useRef(false);

  const PAGE_SIZE = 50;

  const [searchTerm, setSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");

  const [documentFilter, setDocumentFilter] = useState("All");

  const [showArchived, setShowArchived] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

    let active = true;

    const requestsQuery = query(

      collection(db, "documents"),

      orderBy("createdAt", "desc"),

      limit(PAGE_SIZE)

    );

    const unsubscribe = onSnapshot(

      requestsQuery,

      (snapshot) => {

        if (!active) return;

        const data: DocumentRequest[] = snapshot.docs.map((document) => {

          const value = document.data();

          return {

            id: document.id,

            fullName: formatNameForDisplay(value.fullName || ""),

            email: value.email || "",

            purok: getStoredPurok(value),

            documentType: value.documentType || "",

            purpose: value.purpose || "",

            status: value.status || "Pending",

            adminNotes: value.adminNotes || "",

            createdAt: value.createdAt,

            updatedAt: value.updatedAt,

            completedAt: value.completedAt || null,

            archived: value.archived === true,

          };

        });

        const currentFirstPageIds = new Set(snapshot.docs.map((document) => document.id));

        setRequests((current) => {

          // Keep older pages already loaded, while replacing the live first page.

          const olderRecords = current.filter(

            (request) => !firstPageIds.current.has(request.id) && !currentFirstPageIds.has(request.id)

          );

          const combined = new Map<string, DocumentRequest>();

          for (const request of [...olderRecords, ...data]) combined.set(request.id, request);

          return [...combined.values()].sort((a, b) => {

            const aSeconds = a.createdAt?.seconds ?? 0;

            const bSeconds = b.createdAt?.seconds ?? 0;

            return bSeconds - aSeconds;

          });

        });

        firstPageIds.current = currentFirstPageIds;

        if (!initialSnapshotReceived.current) {

          setLastVisible(snapshot.docs[snapshot.docs.length - 1] ?? null);

          initialSnapshotReceived.current = true;

        }

        setHasMore(!endReached.current && snapshot.docs.length === PAGE_SIZE);

        setLoading(false);

      },

      (error) => {

        if (!active) return;

        console.error("Document request listener error:", error);

        setErrorMessage("Unable to load document requests. Check the Firestore quota or your connection, then try again.");

        setLoading(false);

      }

    );

    return () => {

      active = false;

      unsubscribe();

    };

  }, []);

  const loadMoreRequests = async () => {

    if (!lastVisible || loadingMore || !hasMore) return;

    setLoadingMore(true);

    setErrorMessage("");

    try {

      const nextQuery = query(

        collection(db, "documents"),

        orderBy("createdAt", "desc"),

        startAfter(lastVisible),

        limit(PAGE_SIZE)

      );

      const snapshot = await getDocs(nextQuery);

      const moreData: DocumentRequest[] = snapshot.docs.map((document) => {

        const value = document.data();

        return {

          id: document.id,

          fullName: formatNameForDisplay(value.fullName || ""),

          email: value.email || "",

          purok: getStoredPurok(value),

          documentType: value.documentType || "",

          purpose: value.purpose || "",

          status: value.status || "Pending",

          adminNotes: value.adminNotes || "",

          createdAt: value.createdAt,

          updatedAt: value.updatedAt,

          completedAt: value.completedAt || null,

          archived: value.archived === true,

        };

      });

      setRequests((current) => {

        const combined = new Map<string, DocumentRequest>(current.map((request) => [request.id, request] as const));

        for (const request of moreData) combined.set(request.id, request);

        return [...combined.values()].sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));

      });

      setLastVisible(snapshot.docs[snapshot.docs.length - 1] ?? lastVisible);

      endReached.current = snapshot.docs.length < PAGE_SIZE;

      setHasMore(snapshot.docs.length === PAGE_SIZE);

    } catch (error) {

      console.error("Unable to load more document requests:", error);

      setErrorMessage("Unable to load more requests. Please try again later.");

    } finally {

      setLoadingMore(false);

    }

  };

  const filteredRequests = useMemo(() => {

    const search = searchTerm.trim().toLowerCase();

    return requests.filter((request) => {

      const matchesArchive = showArchived

        ? request.archived === true

        : request.archived !== true;

      const matchesSearch =

        !search ||

        request.fullName.toLowerCase().includes(search) ||

        request.email.toLowerCase().includes(search) ||

        request.purok.toLowerCase().includes(search) ||

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

        matchesDocument &&

        matchesArchive

      );

    });

  }, [

    requests,

    searchTerm,

    statusFilter,

    documentFilter,

    showArchived,

  ]);

  const activeVisibleRequests = showArchived ? [] : filteredRequests;

  const toggleSelected = (id: string, checked: boolean) =>

    setSelectedIds((current) => checked ? [...new Set([...current, id])] : current.filter((item) => item !== id));

  const selectAll = (checked: boolean) => setSelectedIds(checked ? activeVisibleRequests.map((request) => request.id) : []);

  const archiveSelected = async () => {

    if (selectedIds.length === 0 || !window.confirm("Archive selected records?\n\nThese records will be removed from the active list but will remain safely stored and available in the Archive.")) return;

    const count = selectedIds.length;

    try {

      await archiveRecords("documents", selectedIds);

      const admin = auth.currentUser;

      await logActivity({ action: "DOCUMENTS_BULK_ARCHIVED", category: "Documents", description: `${admin?.email || "Administrator"} archived ${count} Document Requests.`, actorType: "admin", actorName: admin?.email || "Administrator", actorId: admin?.uid, metadata: { count, recordIds: selectedIds } });

      setSelectedIds([]);

      window.alert(`${count} records archived successfully.`);

    } catch (error) {

      console.error("Unable to archive selected document requests:", error);

      setErrorMessage("Unable to archive the selected requests.");

    }

  };

  const countStatus = (status: DocumentStatus) => {

    return requests.filter(

      (request) =>

        (showArchived ? request.archived === true : request.archived !== true) &&

        request.status === status

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

  const archiveSelectedRequest = async () => {

    if (!selectedRequest) return;

    if (!window.confirm("Are you sure you want to archive this record?")) return;

    try {

      await archiveRecord("documents", selectedRequest.id);

      await logActivity({

        action: "DOCUMENT_ARCHIVED",

        category: "Documents",

        description: `${auth.currentUser?.email || "Administrator"} archived document request ${selectedRequest.id}.`,

        actorType: "admin",

        actorName: auth.currentUser?.email || "Administrator",

        actorId: auth.currentUser?.uid,

        referenceId: selectedRequest.id,

        referenceType: "document",

        status: selectedRequest.status,

      });

      window.alert("Record archived successfully.");

      closeRequest();

    } catch (error) {

      console.error("Unable to archive document request:", error);

      setErrorMessage("Unable to archive this request.");

    }

  };

  const restoreSelectedRequest = async () => {

    if (!selectedRequest) return;

    if (!window.confirm("Restore this record to active requests?")) return;

    try {

      await restoreRecord("documents", selectedRequest.id);

      await logActivity({

        action: "DOCUMENT_RESTORED",

        category: "Documents",

        description: `${auth.currentUser?.email || "Administrator"} restored document request ${selectedRequest.id}.`,

        actorType: "admin",

        actorName: auth.currentUser?.email || "Administrator",

        actorId: auth.currentUser?.uid,

        referenceId: selectedRequest.id,

        referenceType: "document",

        status: selectedRequest.status,

      });

      window.alert("Record restored successfully.");

      closeRequest();

    } catch (error) {

      console.error("Unable to restore document request:", error);

      setErrorMessage("Unable to restore this request.");

    }

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

    const oldStatus = selectedRequest.status;

    const newStatus = editStatus;
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

        status: newStatus,

        adminNotes: editNotes.trim(),

        updatedAt: serverTimestamp(),

      };

      if (newStatus === "Completed") {

        updateData.completedAt =

          serverTimestamp();

      } else {

        updateData.completedAt = null;

      }

      // ----------------------------------------

      // 1. UPDATE DOCUMENT REQUEST

      // ----------------------------------------

      await updateDoc(requestRef, updateData);

      const admin = auth.currentUser;

      if (

        oldStatus !== newStatus ||

        selectedRequest.adminNotes !== editNotes.trim()

      ) {

        const statusAction =

          oldStatus !== newStatus

            ? newStatus === "Approved"

              ? "DOCUMENT_APPROVED"

              : newStatus === "Rejected"

                ? "DOCUMENT_REJECTED"

                : newStatus === "Completed"

                  ? "DOCUMENT_COMPLETED"

                  : "DOCUMENT_STATUS_UPDATED"

            : "DOCUMENT_INFORMATION_UPDATED";

        await logActivity({

          action: statusAction,

          category: "Documents",

          description:

            oldStatus !== newStatus

              ? `${admin?.email || "Administrator"} changed the ${selectedRequest.documentType} request status from ${oldStatus} to ${newStatus}.`

              : `${admin?.email || "Administrator"} updated the ${selectedRequest.documentType} request information.`,

          actorType: "admin",

          actorName: admin?.email || "Administrator",

          actorId: admin?.uid,

          referenceId: selectedRequest.id,

          referenceType: "document",

          status: newStatus,

          metadata: {

            documentType: selectedRequest.documentType,

            ...(oldStatus !== newStatus

              ? {

                  previousStatus: oldStatus,

                  newStatus,

                }

              : {}),

          },

        });

      }

      if (oldStatus !== newStatus) {

        await createAdminNotification({

          title: "Document Status Changed",

          message: `${selectedRequest.documentType} request status changed from ${oldStatus} to ${newStatus}.`,

          type: "document",

          referenceId: selectedRequest.id,

          referenceType: "document",

          actionUrl: "/admin/documents",

          metadata: {

            previousStatus: oldStatus,

            newStatus,

          },

        });

      }

      // ----------------------------------------

      // 3. UPDATE THE MODAL UI

      // ----------------------------------------

      setSaveMessage("Document request status updated successfully.");

      setSelectedRequest((previous) =>

        previous

          ? {

              ...previous,

              status: newStatus,

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

    const admin = auth.currentUser;

    await logActivity({

      action: "ADMIN_LOGOUT",

      category: "Admin",

      description: `${admin?.email || "Administrator"} signed out of the admin portal.`,

      actorType: "admin",

      actorName: admin?.email || "Administrator",

      actorId: admin?.uid,

      referenceType: "system",

    });

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

      <AdminFeatureShell

        title="Document Requests"

        description="Manage and review resident requests for barangay documents."

      >

        <div className="min-h-screen bg-slate-50">

        {/* Mobile Header */}

        <div className="hidden">

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

            hidden

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

                  Complaints

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

              <div className="hidden">

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

              <div className="mb-5 flex rounded-xl border border-slate-200 bg-white p-1 sm:w-fit">

                <button type="button" onClick={() => setShowArchived(false)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${!showArchived ? "bg-violet-50 text-violet-700" : "text-slate-500"}`}>Active Requests</button>

                <button type="button" onClick={() => setShowArchived(true)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${showArchived ? "bg-violet-50 text-violet-700" : "text-slate-500"}`}>Archived Requests</button>

              </div>

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

                    {DOCUMENT_TYPES.map((type) => (

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

              {!showArchived && <BulkArchiveBar visibleCount={activeVisibleRequests.length} selectedCount={selectedIds.length} allSelected={activeVisibleRequests.length > 0 && activeVisibleRequests.every((request) => selectedIds.includes(request.id))} onSelectAll={selectAll} onArchive={() => void archiveSelected()} />}

              <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">

                <span>Loaded {requests.length} document request(s). Search and status counts apply to loaded records.</span>

                {hasMore && (

                  <button

                    type="button"

                    onClick={() => void loadMoreRequests()}

                    disabled={loadingMore || loading}

                    className="rounded-xl border border-violet-200 bg-white px-4 py-2 font-semibold text-violet-700 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"

                  >

                    {loadingMore ? "Loading…" : "Load more requests"}

                  </button>

                )}

              </div>

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

                      No document requests yet.

                    </p>

                    <p className="mt-1 text-sm text-slate-500">

                      New resident requests will appear here.

                    </p>

                  </div>

                ) : (

                  <>

                    {/* Desktop */}

                    <div className="hidden overflow-x-auto xl:block">

                      <table className="w-full min-w-[900px]">

                        <thead className="border-b border-slate-100 bg-slate-50">

                          <tr>

                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">

                              <span className="sr-only">Select</span>

                            </th>

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

                            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Submitted</th>

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

                                <td className="px-6 py-5">{!showArchived && <input type="checkbox" checked={selectedIds.includes(request.id)} onChange={(event) => toggleSelected(request.id, event.target.checked)} aria-label={`Select ${request.fullName}`} className="h-4 w-4 accent-violet-600" />}</td>

                                <td className="px-6 py-5">

                                  <p className="font-semibold text-slate-900">

                                    {request.fullName}

                                  </p>

                                  <p className="mt-1 text-xs text-slate-500">

                                     {request.purok}

                                  </p>

                                  {request.email && (

                                    <p className="mt-1 text-xs text-slate-400">

                                      {request.email}

                                    </p>

                                  )}

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

                                <td className="px-6 py-5 text-sm text-slate-500">{formatDate(request.createdAt)}</td>

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

                    <div className="divide-y divide-slate-100 xl:hidden">

                      {filteredRequests.map(

                        (request) => (

                          <div

                            key={request.id}

                            className="p-5"

                          >

                            {!showArchived && <input type="checkbox" checked={selectedIds.includes(request.id)} onChange={(event) => toggleSelected(request.id, event.target.checked)} aria-label={`Select ${request.fullName}`} className="mb-3 h-4 w-4 accent-violet-600" />}

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

                               {request.purok}

                            </p>

                            {request.email && (

                              <p className="mt-1 text-xs text-slate-400">

                                {request.email}

                              </p>

                            )}

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

                       {selectedRequest.purok}

                    </p>

                    {selectedRequest.email && (

                      <p className="mt-1 text-sm text-slate-500">

                        {selectedRequest.email}

                      </p>

                    )}

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

                    onClick={() => void (selectedRequest.archived ? restoreSelectedRequest() : archiveSelectedRequest())}

                    disabled={isSaving}

                    className="rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"

                  >

                    {selectedRequest.archived ? "Restore" : "Archive"}

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

      </AdminFeatureShell>

    </AdminAuthGuard>

  );

}
