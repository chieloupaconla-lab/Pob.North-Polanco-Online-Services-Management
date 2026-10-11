"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, Timestamp } from "firebase/firestore";
import { Archive, Eye, Loader2, RotateCcw, Search } from "lucide-react";
import { useRouter } from "next/navigation";

import { db } from "@/lib/firebase";
import { restoreRecord, type ArchiveSource } from "@/lib/archiveService";
import { logActivity } from "@/lib/activityLog";
import { formatNameForDisplay } from "@/lib/nameUtils";
import AdminAuthGuard from "@/components/AdminAuthGuard";
import AdminFeatureShell from "@/components/admin/AdminFeatureShell";

type ArchiveFilter = "All" | ArchiveSource;

type ArchivedRecord = {
  id: string;
  source: ArchiveSource;
  typeLabel: string;
  recordLabel: string;
  status: string;
  archivedBy: string;
  archivedAt: Timestamp | null;
};

function toArchivedRecord(
  source: ArchiveSource,
  id: string,
  data: Record<string, unknown>
): ArchivedRecord | null {
  if (data.archived !== true) return null;

  const archivedBy = data.archivedBy;
  const archivedByName =
    typeof archivedBy === "object" && archivedBy !== null
      ? String((archivedBy as { name?: unknown }).name || "Administrator")
      : String(archivedBy || "Administrator");

  const archivedAt =
    data.archivedAt instanceof Timestamp ? data.archivedAt : null;

  if (source === "documents") {
    return {
      id,
      source,
      typeLabel: "Document Request",
      recordLabel: `${String(data.documentType || "Document Request")} - ${formatNameForDisplay(String(data.fullName || "Resident"))}`,
      status: String(data.status || "Pending"),
      archivedBy: archivedByName,
      archivedAt,
    };
  }

  if (source === "complaints") {
    return {
      id,
      source,
      typeLabel: "Complaint",
      recordLabel: `${String(data.category || "Complaint")} - ${formatNameForDisplay(String(data.fullName || "Anonymous Resident"))}`,
      status: String(data.status || "Pending"),
      archivedBy: archivedByName,
      archivedAt,
    };
  }

  if (source === "equipmentInventory") {
    return {
      id,
      source,
      typeLabel: "Equipment",
      recordLabel: `${String(data.name || "Equipment")} - ${String(data.category || "Uncategorized")}`,
      status: String(data.status || "Unavailable"),
      archivedBy: archivedByName,
      archivedAt,
    };
  }

  if (source === "residents") {
    return {
      id,
      source,
      typeLabel: "Resident",
      recordLabel: String(data.fullName || "Resident"),
      status: data.active === true ? "Verified Resident" : "Inactive",
      archivedBy: archivedByName,
      archivedAt,
    };
  }

  return {
    id,
    source,
    typeLabel: "Asset Borrowing",
      recordLabel: `${String(data.assetName || "Asset Request")} - ${formatNameForDisplay(String(data.borrowerName || "Resident"))}`,
    status: String(data.status || "Pending"),
    archivedBy: archivedByName,
    archivedAt,
  };
}

function formatArchivedDate(timestamp: Timestamp | null) {
  return timestamp
    ? timestamp.toDate().toLocaleString("en-PH", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Processing";
}

export default function AdminArchivePage() {
  const router = useRouter();
  const [records, setRecords] = useState<ArchivedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ArchiveFilter>("All");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const sources: ArchiveSource[] = [
      "documents",
      "complaints",
      "assets",
      "residents",
      "equipmentInventory",
    ];
    const snapshots = new Map<string, ArchivedRecord[]>();

    const unsubscribers = sources.map((source) =>
      onSnapshot(collection(db, source), (snapshot) => {
        snapshots.set(
          source,
          snapshot.docs
            .map((item) =>
              toArchivedRecord(source, item.id, item.data())
            )
            .filter((item): item is ArchivedRecord => item !== null)
        );

        setRecords(
          Array.from(snapshots.values())
            .flat()
            .sort(
              (a, b) =>
                (b.archivedAt?.toMillis() || 0) -
                (a.archivedAt?.toMillis() || 0)
            )
        );
        setLoading(false);
      }, (error) => {
        console.error(`Unable to load archived ${source}:`, error);
        setLoading(false);
      })
    );

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  const filteredRecords = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesType = filter === "All" || record.source === filter;
      const matchesSearch =
        !searchValue ||
        `${record.typeLabel} ${record.recordLabel} ${record.status} ${record.archivedBy}`
          .toLowerCase()
          .includes(searchValue);

      return matchesType && matchesSearch;
    });
  }, [filter, records, search]);

  const restore = async (record: ArchivedRecord) => {
    if (!window.confirm("Are you sure you want to restore this record?")) {
      return;
    }

    try {
      await restoreRecord(record.source, record.id);
      await logActivity({
        action: "RECORD_RESTORED",
        category:
          record.source === "documents"
            ? "Documents"
            : record.source === "complaints"
              ? "Complaints"
              : record.source === "residents"
                ? "Residents"
              : "Equipment",
        description: `Administrator restored ${record.typeLabel} ${record.id}.`,
        actorType: "admin",
        referenceId: record.id,
        referenceType:
          record.source === "documents"
            ? "document"
            : record.source === "complaints"
              ? "complaint"
              : record.source === "residents"
                ? "system"
              : "asset",
        status: record.status,
      });
      setMessage("Record restored successfully.");
      window.setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Unable to restore archived record:", error);
      setMessage("Unable to restore this record.");
    }
  };

  return (
    <AdminAuthGuard>
      <AdminFeatureShell
        title="Archive"
        description="View and manage archived document requests, complaints, asset borrowing, equipment, and residents."
      >
        <div className="space-y-6">
          {message && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
              {message}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Total Archived", records.length],
              ["Document Requests", records.filter((item) => item.source === "documents").length],
               ["Complaints", records.filter((item) => item.source === "complaints").length],
               ["Asset Borrowing", records.filter((item) => item.source === "assets").length],
               ["Residents", records.filter((item) => item.source === "residents").length],
               ["Equipment", records.filter((item) => item.source === "equipmentInventory").length],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
              </div>
            ))}
          </div>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[#17213A]">Archived Records</h2>
                <p className="mt-1 text-xs text-slate-500">Archived records remain available for review and restoration.</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search archive..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-violet-500 sm:w-64"
                  />
                </div>
                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value as ArchiveFilter)}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-violet-500"
                >
                  <option value="All">All</option>
                  <option value="documents">Document Requests</option>
                  <option value="complaints">Complaints</option>
                   <option value="assets">Asset Borrowing</option>
                   <option value="residents">Residents</option>
                   <option value="equipmentInventory">Equipment</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="mx-auto h-7 w-7 animate-spin text-violet-600" />
                <p className="mt-3 text-sm text-slate-500">Loading archived records...</p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="p-12 text-center">
                <Archive className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-4 font-semibold text-slate-700">No archived records found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead className="border-b border-slate-100 bg-slate-50">
                    <tr>
                      {['Type', 'Record', 'Status', 'Archived By', 'Archived Date', 'Actions'].map((heading) => (
                        <th key={heading} className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">{heading}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.map((record) => (
                      <tr key={`${record.source}-${record.id}`} className="hover:bg-slate-50">
                        <td className="px-5 py-4 text-sm font-semibold text-violet-700">{record.typeLabel}</td>
                        <td className="px-5 py-4 text-sm text-slate-700">{record.recordLabel}</td>
                        <td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{record.status}</span></td>
                        <td className="px-5 py-4 text-sm text-slate-600">{record.archivedBy}</td>
                        <td className="px-5 py-4 text-sm text-slate-500">{formatArchivedDate(record.archivedAt)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => router.push(record.source === "documents" ? "/admin/documents" : record.source === "complaints" ? "/admin/complaints" : record.source === "assets" ? "/admin/assets" : record.source === "residents" ? "/admin/residents" : "/admin/inventory")} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                              <Eye className="h-3.5 w-3.5" /> View
                            </button>
                            <button type="button" onClick={() => void restore(record)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-50">
                              <RotateCcw className="h-3.5 w-3.5" /> Restore
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </AdminFeatureShell>
    </AdminAuthGuard>
  );
}
