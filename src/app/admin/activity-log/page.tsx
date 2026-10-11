"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  FileText,
  History,
  Loader2,
  Package,
  RefreshCw,
  Search,
  Shield,
  Upload,
  X,
} from "lucide-react";
import {
  collection,
  DocumentSnapshot,
  getDocs,
  limit,
  orderBy,
  QueryConstraint,
  query,
  startAfter,
  Timestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import AdminAuthGuard from "@/components/admin/AdminAuthGuard";
import { auth, db } from "@/lib/firebase";
import type {
  ActivityActorType,
  ActivityCategory,
} from "@/lib/activityLog";

type DateFilter = "All" | "Today" | "7" | "30";

type ActivityRecord = {
  id: string;
  action: string;
  category: ActivityCategory;
  description: string;
  actorType: ActivityActorType;
  actorName?: string;
  actorId?: string;
  referenceId?: string;
  referenceType?: string;
  status?: string;
  metadata?: Record<string, unknown>;
  createdAt: Timestamp | null;
};

const PAGE_SIZE = 25;

const categoryOptions: Array<"All" | ActivityCategory> = [
  "All",
  "Documents",
  "Complaints",
  "Equipment",
  "Residents",
  "Admin",
  "System",
];

function toActivityRecord(
  snapshot: DocumentSnapshot
): ActivityRecord {
  const data = snapshot.data() || {};
  const rawMetadata =
    data.metadata && typeof data.metadata === "object"
      ? (data.metadata as Record<string, unknown>)
      : undefined;
  const isAnonymousComplaint =
    data.category === "Complaints" &&
    (rawMetadata?.submissionType === "Anonymous" ||
      String(data.description || "")
        .toLowerCase()
        .includes("anonymous"));

  return {
    id: snapshot.id,
    action: String(data.action || "Activity"),
    category: (data.category || "System") as ActivityCategory,
    description: String(data.description || "No description available."),
    actorType: (data.actorType || "system") as ActivityActorType,
    actorName: isAnonymousComplaint
      ? "Anonymous Resident"
      : typeof data.actorName === "string"
        ? data.actorName
        : undefined,
    actorId: isAnonymousComplaint
      ? undefined
      : typeof data.actorId === "string"
        ? data.actorId
        : undefined,
    referenceId:
      typeof data.referenceId === "string"
        ? data.referenceId
        : undefined,
    referenceType:
      typeof data.referenceType === "string"
        ? data.referenceType
        : undefined,
    status:
      typeof data.status === "string"
        ? data.status
        : undefined,
    metadata: isAnonymousComplaint
      ? rawMetadata?.category
        ? { category: rawMetadata.category }
        : undefined
      : rawMetadata,
    createdAt:
      data.createdAt instanceof Timestamp
        ? data.createdAt
        : null,
  };
}

function formatDate(timestamp: Timestamp | null) {
  if (!timestamp) return "Processing time";

  return timestamp.toDate().toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getIcon(activity: ActivityRecord) {
  if (activity.action.toLowerCase().includes("photo")) {
    return Upload;
  }

  switch (activity.category) {
    case "Documents":
      return FileText;
    case "Complaints":
      return AlertTriangle;
    case "Equipment":
      return Package;
    case "Admin":
      return Shield;
    default:
      return History;
  }
}

function getCategoryClasses(category: string) {
  switch (category) {
    case "Documents":
      return "bg-violet-50 text-violet-700 border-violet-200";
    case "Complaints":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "Equipment":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Admin":
      return "bg-slate-100 text-slate-700 border-slate-200";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

function isInDateRange(
  timestamp: Timestamp | null,
  filter: DateFilter
) {
  if (filter === "All") return true;
  if (!timestamp) return false;

  const now = new Date();
  const date = timestamp.toDate();

  if (filter === "Today") {
    return date.toDateString() === now.toDateString();
  }

  const days = Number(filter);
  return date.getTime() >=
    Date.now() - days * 24 * 60 * 60 * 1000;
}

function ActivityLogContent() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [lastDocument, setLastDocument] =
    useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"All" | ActivityCategory>("All");
  const [actorType, setActorType] = useState<"All" | ActivityActorType>("All");
  const [status, setStatus] = useState("All");
  const [dateFilter, setDateFilter] = useState<DateFilter>("All");
  const [selected, setSelected] = useState<ActivityRecord | null>(null);

  const loadActivities = async (append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    setError("");

    try {
      const constraints: QueryConstraint[] = [
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE),
      ];

      if (append && lastDocument) {
        constraints.unshift(startAfter(lastDocument));
      }

      const snapshot = await getDocs(
        query(collection(db, "activityLogs"), ...constraints)
      );
      const nextActivities = snapshot.docs.map(toActivityRecord);

      setActivities((previous) =>
        append ? [...previous, ...nextActivities] : nextActivities
      );
      setLastDocument(
        snapshot.docs[snapshot.docs.length - 1] || null
      );
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (loadError) {
      console.error("Activity log load error:", loadError);

      const errorCode =
        loadError &&
        typeof loadError === "object" &&
        "code" in loadError
          ? String(loadError.code)
          : "";

      setError(
        errorCode === "permission-denied"
          ? "Unable to load the activity log. Firestore rules must allow authenticated administrators to read activityLogs."
          : "Unable to load the activity log. Please try again."
      );
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) return;

      // Ensure the restored Firebase session has a current ID token before
      // Firestore evaluates the authenticated read rule.
      void user
        .getIdToken()
        .then(() => loadActivities(false))
        .catch((authError) => {
          console.error(
            "Activity log auth initialization error:",
            authError
          );
          setError("Unable to verify the administrator session.");
          setLoading(false);
        });
    });

    return () => {
      unsubscribe();
    };
    // The initial activity page should load once after auth is ready.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredActivities = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return activities.filter((activity) => {
      const searchable = [
        activity.actorName,
        activity.description,
        activity.referenceId,
        activity.action,
        activity.category,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!searchValue || searchable.includes(searchValue)) &&
        (category === "All" || activity.category === category) &&
        (actorType === "All" || activity.actorType === actorType) &&
        (status === "All" || activity.status === status) &&
        isInDateRange(activity.createdAt, dateFilter)
      );
    });
  }, [activities, search, category, actorType, status, dateFilter]);

  const statuses = Array.from(
    new Set(
      activities
        .map((activity) => activity.status)
        .filter((value): value is string => Boolean(value))
    )
  );

  return (
    <>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-violet-600">
            Administration
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Activity Log
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Monitor important activities and changes made throughout the barangay service system.
          </p>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="relative xl:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search activity, actor, or reference..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
              />
            </div>

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as "All" | ActivityCategory)
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-violet-400"
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "All" ? "All Categories" : option}
                </option>
              ))}
            </select>

            <select
              value={actorType}
              onChange={(event) =>
                setActorType(event.target.value as "All" | ActivityActorType)
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-violet-400"
            >
              <option value="All">All Actors</option>
              <option value="resident">Resident</option>
              <option value="admin">Admin</option>
              <option value="system">System</option>
            </select>

            <select
              value={dateFilter}
              onChange={(event) =>
                setDateFilter(event.target.value as DateFilter)
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-violet-400"
            >
              <option value="All">All Time</option>
              <option value="Today">Today</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
            </select>
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-violet-400 sm:w-52"
            >
              <option value="All">All Statuses</option>
              {statuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => void loadActivities(false)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-72 items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-violet-600" />
                <p className="mt-3 text-sm text-slate-500">Loading activity...</p>
              </div>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <History className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-4 font-semibold text-slate-700">
                {activities.length === 0
                  ? "No activity yet"
                  : "No matching activity found"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {activities.length === 0
                  ? "System activities will appear here as residents and administrators interact with the portal."
                  : "Try adjusting your search or filters."}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-left">
                  <thead className="border-b border-slate-100 bg-slate-50">
                    <tr>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Activity</th>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Actor</th>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Reference</th>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Status</th>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Date / Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredActivities.map((activity) => {
                      const Icon = getIcon(activity);
                      return (
                        <tr
                          key={activity.id}
                          onClick={() => setSelected(activity)}
                          className="cursor-pointer transition hover:bg-slate-50"
                        >
                          <td className="max-w-xl px-5 py-4">
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${getCategoryClasses(activity.category)}`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-bold text-slate-800">{activity.action}</p>
                                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${getCategoryClasses(activity.category)}`}>{activity.category}</span>
                                </div>
                                <p className="mt-1 text-xs leading-5 text-slate-500">{activity.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm text-slate-600">
                              {activity.actorName || activity.actorType}
                            </p>
                            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              {activity.actorType}
                            </p>
                          </td>
                          <td className="px-5 py-4 font-mono text-xs text-slate-500">{activity.referenceId || "—"}</td>
                          <td className="px-5 py-4 text-xs font-semibold text-slate-600">{activity.status || "—"}</td>
                          <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{formatDate(activity.createdAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 lg:hidden">
                {filteredActivities.map((activity) => {
                  const Icon = getIcon(activity);
                  return (
                    <button
                      key={activity.id}
                      type="button"
                      onClick={() => setSelected(activity)}
                      className="block w-full p-4 text-left transition hover:bg-slate-50"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${getCategoryClasses(activity.category)}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-bold text-slate-800">{activity.action}</p>
                            {activity.status && <span className="shrink-0 text-xs font-semibold text-slate-500">{activity.status}</span>}
                          </div>
                          <p className="mt-1 text-xs leading-5 text-slate-500">{activity.description}</p>
                          <p className="mt-2 text-[11px] text-slate-400">
                            {activity.actorName || activity.actorType} · {activity.actorType} · {formatDate(activity.createdAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {hasMore && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => void loadActivities(true)}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
            >
              {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
              {loadingMore ? "Loading..." : "Load More Activities"}
            </button>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onClick={() => setSelected(null)}>
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-violet-600">Activity Details</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">{selected.action}</h2>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Close activity details">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <p className="text-sm leading-6 text-slate-700">{selected.description}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Detail label="Category" value={selected.category} />
                <Detail label="Actor" value={selected.actorName || selected.actorType} />
                <Detail label="Actor Type" value={selected.actorType} />
                <Detail label="Date / Time" value={formatDate(selected.createdAt)} />
                <Detail label="Reference ID" value={selected.referenceId || "—"} mono />
                <Detail label="Status" value={selected.status || "—"} />
              </div>
              {selected.metadata && Object.keys(selected.metadata).length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Additional Details</p>
                  <pre className="mt-2 max-h-48 overflow-auto rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">{JSON.stringify(selected.metadata, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 break-words text-sm text-slate-700 ${mono ? "font-mono text-xs" : ""}`}>{value}</p>
    </div>
  );
}

export default function ActivityLogPage() {
  return (
    <AdminAuthGuard>
      <ActivityLogContent />
    </AdminAuthGuard>
  );
}
