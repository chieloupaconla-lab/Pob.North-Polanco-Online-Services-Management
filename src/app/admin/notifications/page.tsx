"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  Check,
  FileText,
  History,
  Loader2,
  Package,
  RefreshCw,
  Search,
  Upload,
  X,
} from "lucide-react";
import {
  collection,
  doc,
  DocumentSnapshot,
  getDocs,
  limit,
  orderBy,
  QueryConstraint,
  query,
  startAfter,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import AdminAuthGuard from "@/components/admin/AdminAuthGuard";
import { auth, db } from "@/lib/firebase";
import type { AdminNotificationType } from "@/lib/notifications";

type DateFilter = "All" | "Today" | "7" | "30";
type CategoryFilter = "All" | AdminNotificationType;

type NotificationRecord = {
  id: string;
  title: string;
  message: string;
  type: AdminNotificationType;
  referenceId?: string;
  referenceType?: string;
  actionUrl?: string;
  read: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Timestamp | null;
};

const PAGE_SIZE = 25;

function toNotificationRecord(
  snapshot: DocumentSnapshot
): NotificationRecord {
  const data = snapshot.data() || {};

  return {
    id: snapshot.id,
    title: String(data.title || "Notification"),
    message: String(data.message || ""),
    type: (data.type || "system") as AdminNotificationType,
    referenceId:
      typeof data.referenceId === "string"
        ? data.referenceId
        : undefined,
    referenceType:
      typeof data.referenceType === "string"
        ? data.referenceType
        : undefined,
    actionUrl:
      typeof data.actionUrl === "string"
        ? data.actionUrl
        : undefined,
    read: data.read === true,
    metadata:
      data.metadata && typeof data.metadata === "object"
        ? (data.metadata as Record<string, unknown>)
        : undefined,
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

function relativeTime(timestamp: Timestamp | null) {
  if (!timestamp) return "Processing time";

  const minutes = Math.floor(
    (Date.now() - timestamp.toMillis()) / 60000
  );

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
}

function getIcon(type: AdminNotificationType) {
  switch (type) {
    case "document":
      return FileText;
    case "complaint":
      return AlertTriangle;
    case "equipment":
      return Package;
    case "proof":
      return Upload;
    default:
      return History;
  }
}

function getTypeClasses(type: AdminNotificationType) {
  switch (type) {
    case "document":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "complaint":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "equipment":
      return "bg-violet-50 text-violet-700 border-violet-200";
    case "proof":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function inDateRange(
  timestamp: Timestamp | null,
  filter: DateFilter
) {
  if (filter === "All") return true;
  if (!timestamp) return false;

  const date = timestamp.toDate();
  if (filter === "Today") {
    return date.toDateString() === new Date().toDateString();
  }

  return date.getTime() >=
    Date.now() - Number(filter) * 24 * 60 * 60 * 1000;
}

function AdminNotificationsContent() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [lastDocument, setLastDocument] =
    useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [readFilter, setReadFilter] = useState<"All" | "Unread">("All");
  const [dateFilter, setDateFilter] = useState<DateFilter>("All");
  const [selected, setSelected] = useState<NotificationRecord | null>(null);

  const loadNotifications = async (append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    setError("");

    try {
      const constraints: QueryConstraint[] = [
        where("recipientType", "==", "admin"),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE),
      ];

      if (append && lastDocument) {
        constraints.unshift(startAfter(lastDocument));
      }

      const snapshot = await getDocs(
        query(collection(db, "notifications"), ...constraints)
      );

      const next = snapshot.docs.map(toNotificationRecord);

      setNotifications((previous) =>
        append ? [...previous, ...next] : next
      );
      setLastDocument(
        snapshot.docs[snapshot.docs.length - 1] || null
      );
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } catch (loadError) {
      console.error("Admin notification load error:", loadError);
      setError("Unable to load notifications.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) return;

      void user
        .getIdToken()
        .then(() => loadNotifications(false))
        .catch((authError) => {
          console.error(
            "Admin notification auth initialization error:",
            authError
          );
          setError("Unable to verify the administrator session.");
          setLoading(false);
        });
    });

    return () => unsubscribe();
    // Load the first page once after auth is ready.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredNotifications = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return notifications.filter((notification) => {
      const searchable = [
        notification.title,
        notification.message,
        notification.referenceId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!searchValue || searchable.includes(searchValue)) &&
        (category === "All" || notification.type === category) &&
        (readFilter === "All" || !notification.read) &&
        inDateRange(notification.createdAt, dateFilter)
      );
    });
  }, [notifications, search, category, readFilter, dateFilter]);

  const markAsRead = async (notification: NotificationRecord) => {
    if (notification.read) return;

    await updateDoc(
      doc(db, "notifications", notification.id),
      { read: true }
    ).catch((markError) =>
      console.error("Unable to mark notification read:", markError)
    );

    setNotifications((previous) =>
      previous.map((item) =>
        item.id === notification.id
          ? { ...item, read: true }
          : item
      )
    );
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(
      (notification) => !notification.read
    );

    if (unread.length === 0) return;

    const batch = writeBatch(db);
    unread.forEach((notification) => {
      batch.update(
        doc(db, "notifications", notification.id),
        { read: true }
      );
    });

    await batch.commit();
    setNotifications((previous) =>
      previous.map((item) => ({ ...item, read: true }))
    );
  };

  const openNotification = async (notification: NotificationRecord) => {
    await markAsRead(notification);

    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      return;
    }

    setSelected(notification);
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-violet-600">Administration</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Admin Notifications
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Review new submissions, status changes, returns, proof photos, and other actions requiring administrator attention.
          </p>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative xl:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title, message, or reference..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
              />
            </div>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as CategoryFilter)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-violet-400"
            >
              <option value="All">All Categories</option>
              <option value="document">Documents</option>
              <option value="complaint">Complaints</option>
              <option value="equipment">Equipment</option>
              <option value="proof">Proof</option>
              <option value="system">System</option>
            </select>
            <select
              value={readFilter}
              onChange={(event) => setReadFilter(event.target.value as "All" | "Unread")}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none focus:border-violet-400"
            >
              <option value="All">All Notifications</option>
              <option value="Unread">Unread</option>
            </select>
          </div>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <select
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value as DateFilter)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-violet-400 sm:w-48"
            >
              <option value="All">All Time</option>
              <option value="Today">Today</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
            </select>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void markAllAsRead()}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                <Check className="h-4 w-4" />
                Mark All as Read
              </button>
              <button
                type="button"
                onClick={() => void loadNotifications(false)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </section>

        {error && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <span>{error}</span>
            <button type="button" onClick={() => void loadNotifications(false)} className="font-semibold underline">
              Retry
            </button>
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-72 items-center justify-center">
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-violet-600" />
                <p className="mt-3 text-sm text-slate-500">Loading notifications...</p>
              </div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Bell className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-4 font-semibold text-slate-700">No notifications</p>
              <p className="mx-auto mt-1 max-w-lg text-sm text-slate-500">
                You&apos;re all caught up. New document requests, complaints, equipment requests, returns, and proof uploads will appear here.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto xl:block">
                <table className="w-full min-w-[900px] text-left">
                  <thead className="border-b border-slate-100 bg-slate-50">
                    <tr>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Notification</th>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Category</th>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Reference</th>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Date / Time</th>
                      <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredNotifications.map((notification) => {
                      const Icon = getIcon(notification.type);
                      return (
                        <tr key={notification.id} onClick={() => void openNotification(notification)} className={`cursor-pointer transition hover:bg-slate-50 ${notification.read ? "" : "bg-indigo-50/30"}`}>
                          <td className="max-w-xl px-5 py-4">
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${getTypeClasses(notification.type)}`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800">{notification.title}</p>
                                <p className="mt-1 text-xs leading-5 text-slate-500">{notification.message}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4"><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${getTypeClasses(notification.type)}`}>{notification.type}</span></td>
                          <td className="px-5 py-4 font-mono text-xs text-slate-500">{notification.referenceId || "—"}</td>
                          <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{formatDate(notification.createdAt)}</td>
                          <td className="px-5 py-4 text-xs font-semibold text-slate-600">{notification.read ? "Read" : "Unread"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 xl:hidden">
                {filteredNotifications.map((notification) => {
                  const Icon = getIcon(notification.type);
                  return (
                    <button key={notification.id} type="button" onClick={() => void openNotification(notification)} className={`block w-full p-4 text-left transition hover:bg-slate-50 ${notification.read ? "" : "bg-indigo-50/30"}`}>
                      <div className="flex items-start gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${getTypeClasses(notification.type)}`}><Icon className="h-4 w-4" /></div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3"><p className="text-sm font-bold text-slate-800">{notification.title}</p>{!notification.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />}</div>
                          <p className="mt-1 text-xs leading-5 text-slate-500">{notification.message}</p>
                          <p className="mt-2 text-[11px] text-slate-400">{notification.type} · {notification.referenceId || "No reference"} · {relativeTime(notification.createdAt)}</p>
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
            <button type="button" onClick={() => void loadNotifications(true)} disabled={loadingMore} className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60">
              {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
              {loadingMore ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onClick={() => setSelected(null)}>
          <div className="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div><p className="text-xs font-bold uppercase tracking-wider text-violet-600">Notification Details</p><h2 className="mt-1 text-lg font-bold text-slate-900">{selected.title}</h2></div>
              <button type="button" onClick={() => setSelected(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Close notification details"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4 p-5">
              <p className="text-sm leading-6 text-slate-700">{selected.message}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Detail label="Category" value={selected.type} />
                <Detail label="Reference ID" value={selected.referenceId || "—"} mono />
                <Detail label="Reference Type" value={selected.referenceType || "—"} />
                <Detail label="Date / Time" value={formatDate(selected.createdAt)} />
              </div>
              {selected.metadata && Object.keys(selected.metadata).length > 0 && <pre className="max-h-48 overflow-auto rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">{JSON.stringify(selected.metadata, null, 2)}</pre>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p><p className={`mt-1 break-words text-sm text-slate-700 ${mono ? "font-mono text-xs" : ""}`}>{value}</p></div>;
}

export default function AdminNotificationsPage() {
  return (
    <AdminAuthGuard>
      <AdminNotificationsContent />
    </AdminAuthGuard>
  );
}
