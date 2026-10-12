"use client";



import { useEffect, useMemo, useState } from "react";

import {

  addDoc,

  collection,

  doc,

  getDocs,

  onSnapshot,

  orderBy,

  query,

  serverTimestamp,

  updateDoc,
  where,

} from "firebase/firestore";

import { CheckCircle2, Edit3, Loader2, Plus, Search, Users } from "lucide-react";

import { auth, db } from "@/lib/firebase";

import { archiveRecords, restoreRecord } from "@/lib/archiveService";

import { logActivity } from "@/lib/activityLog";

import { OFFICIAL_PUROKS, isOfficialPurok, normalizePurokForSearch } from "@/lib/purokConfig";

import {

  formatResidentNameForDisplay,

  formatResidentNameForStorage,

  getResidentVerificationFields,

  isDuplicateResidentName,

  normalizeResidentNameForDuplicateCheck,

} from "@/lib/residentVerification";

import AdminAuthGuard from "@/components/admin/AdminAuthGuard";

import AdminFeatureShell from "@/components/admin/AdminFeatureShell";

import BulkArchiveBar from "@/components/admin/BulkArchiveBar";

import BulkResidentImport from "@/components/admin/BulkResidentImport";



type Resident = {

  id: string;

  fullName: string;

  fullNameNormalized: string;

  purok: string;

  purokStreet: string;

  active: boolean;

  archived: boolean;

  createdAt?: { seconds: number };

};



function formatDate(timestamp?: Resident["createdAt"]) {

  return timestamp?.seconds

    ? new Date(timestamp.seconds * 1000).toLocaleDateString("en-PH", { dateStyle: "medium" })

    : "Processing";

}







function reportResidentFirestoreError(

  operation: string,

  error: unknown

): void {

  if (process.env.NODE_ENV !== "development") {

    return;

  }



  let errorName: string | null = null;

  let errorMessage = "Unknown error";

  let errorCode: string | null = null;



  if (error instanceof Error) {

    errorName = error.name;

    errorMessage = error.message;

  } else if (typeof error === "object" && error !== null) {

    const value = error as {

      name?: unknown;

      message?: unknown;

      code?: unknown;

    };



    errorName =

      typeof value.name === "string" ? value.name : null;



    errorMessage =

      typeof value.message === "string"

        ? value.message

        : "An unknown Firestore error occurred.";



    errorCode =

      typeof value.code === "string" ? value.code : null;

  } else {

    errorMessage = String(error);

  }



  console.error(

    "Resident Registry Firestore operation failed.",

    {

      operation,

      collection: "residents",

      authenticated: Boolean(auth.currentUser),

      errorName,

      errorMessage,

      errorCode,

    }

  );

}







function AdminResidentsContent() {

  const [residents, setResidents] = useState<Resident[]>([]);

  const [showArchived, setShowArchived] = useState(false);

  const [purokFilter, setPurokFilter] = useState("All Puroks");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [migrating, setMigrating] = useState(false);

  const [verificationReady, setVerificationReady] = useState<boolean | null>(null);

  const [verificationMigrationStatus, setVerificationMigrationStatus] = useState("not-started");

  const [invalidVerificationResidents, setInvalidVerificationResidents] = useState<Array<{ id: string; problems: string[] }>>([]);

  const [diagnosingVerification, setDiagnosingVerification] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  const [formOpen, setFormOpen] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");

  const [editingFullName, setEditingFullName] = useState("");

  const [purok, setPurok] = useState("");

  const [editingPurok, setEditingPurok] = useState("");

  const [bulkImportOpen, setBulkImportOpen] = useState(false);



  const refreshVerificationStatus = async () => {

    try {

      const admin = auth.currentUser;

      if (!admin) {

        setVerificationReady(false);

        setVerificationMigrationStatus("unauthorized");

        return;

      }

      const token = await admin.getIdToken(true);

      const response = await fetch("/api/admin/residents/verification-migration", { headers: { Authorization: `Bearer ${token || ""}` } });

      const result = await response.json() as { complete?: boolean; status?: string };

      setVerificationReady(response.ok && result.complete === true);

      setVerificationMigrationStatus(result.status || (response.ok ? "not-started" : "unavailable"));

    } catch {

      setVerificationReady(false);

      setVerificationMigrationStatus("unavailable");

    }

  };



  useEffect(() => {

    let mounted = true;

    const loadVerificationStatus = async () => {

      try {

        const admin = auth.currentUser;

        if (!admin) {

          if (mounted) {

            setVerificationReady(false);

            setVerificationMigrationStatus("unauthorized");

          }

          return;

        }

        const token = await admin.getIdToken(true);

        const response = await fetch("/api/admin/residents/verification-migration", { headers: { Authorization: `Bearer ${token || ""}` } });

        const result = await response.json() as { complete?: boolean; status?: string };

        if (mounted) {

          setVerificationReady(response.ok && result.complete === true);

          setVerificationMigrationStatus(result.status || (response.ok ? "not-started" : "unavailable"));

        }

      } catch {

        if (mounted) {

          setVerificationReady(false);

          setVerificationMigrationStatus("unavailable");

        }

      }

    };

    void loadVerificationStatus();

    const unsubscribe = onSnapshot(

    query(collection(db, "residents"), orderBy("createdAt", "desc")),

    (snapshot) => {

      setResidents(snapshot.docs.map((item) => {

        const data = item.data();

        return {

          id: item.id,

          fullName: String(data.fullName || ""),

          fullNameNormalized: String(data.fullNameNormalized || ""),

          purok: typeof data.purok === "string" ? data.purok : "",

          purokStreet: typeof data.purokStreet === "string" ? data.purokStreet : "",

          active: data.active === true,

          archived: data.archived === true,

          createdAt: data.createdAt,

        };

      }));

      setLoading(false);

    },

    (loadError) => {

      reportResidentFirestoreError("list residents", loadError);

      setError("Unable to load the Resident Registry.");

      setLoading(false);

    }

    );

    return () => {

      mounted = false;

      unsubscribe();

    };

  }, []);



  const visibleResidents = useMemo(() => {

    const searchValue = search.trim().toLowerCase();

    return residents.filter((resident) =>

      resident.archived === showArchived &&

      (purokFilter === "All Puroks" ||

        (purokFilter === "Not Set" ? !resident.purok : resident.purok === purokFilter)) &&

      `${resident.id} ${formatResidentNameForDisplay(resident.fullName)} ${resident.fullName} ${resident.purok} ${resident.purokStreet}`.toLowerCase().includes(searchValue)

    );

  }, [residents, search, showArchived, purokFilter]);



  const activeResidents = useMemo(

    () => residents.filter((resident) => !resident.archived && resident.active),

    [residents]

  );

  const activePurokCounts = useMemo(

    () => OFFICIAL_PUROKS.map((option) => ({

      purok: option,

      count: activeResidents.filter((resident) => resident.purok === option).length,

    })),

    [activeResidents]

  );

  const notSetCount = activeResidents.filter((resident) => !resident.purok).length;



  const openAdd = () => {

    setEditingId(null);

    setFullName("");

    setEditingFullName("");

    setPurok("");

    setEditingPurok("");

    setError("");

    setFormOpen(true);

  };



  const openEdit = (resident: Resident) => {

    setEditingId(resident.id);

    setFullName(resident.fullName);

    setEditingFullName(resident.fullName);

    setPurok(resident.purok);

    setEditingPurok(resident.purok);

    setError("");

    setFormOpen(true);

  };



  const saveResident = async (event: React.FormEvent) => {

    event.preventDefault();

    setError("");

    const cleanName = formatResidentNameForStorage(fullName);

    if (!cleanName) {

      setError("Please enter the name as: Last Name, First Name, Middle Name.");

      return;

    }

    if (!isOfficialPurok(purok)) {

      setError("Please select the resident's Purok.");

      return;

    }



    setSaving(true);

    let firestoreOperation = "resident duplicate lookup";

    try {

      const normalized = normalizeResidentNameForDuplicateCheck(cleanName);

      const duplicateSnapshot = await getDocs(
        query(
          collection(db, "residents"),
          where("fullNameNormalized", "==", normalized)
        )
      );

      const activeDuplicate = duplicateSnapshot.docs.some((item) =>

        item.id !== editingId &&

        item.data().active === true &&

        item.data().archived !== true &&

        isDuplicateResidentName(cleanName, String(item.data().fullName || ""))

      );



      if (activeDuplicate) {

        setError("This resident is already registered.");

        return;

      }



      const admin = auth.currentUser;

      if (editingId) {

        firestoreOperation = "update resident";

        await updateDoc(doc(db, "residents", editingId), {

          fullName: cleanName,

          fullNameNormalized: normalized,

          ...getResidentVerificationFields(cleanName, normalizePurokForSearch(purok)),

          purok,

          updatedAt: serverTimestamp(),

          updatedBy: { uid: admin?.uid || "", email: admin?.email || "" },

        });

        await logActivity({

          action: "RESIDENT_UPDATED",

          category: "Residents",

          description: `${admin?.email || "Administrator"} updated resident ${formatResidentNameForDisplay(cleanName)}.` +

            (editingFullName !== cleanName

              ? ` Name changed from ${formatResidentNameForDisplay(editingFullName)} to ${formatResidentNameForDisplay(cleanName)}.`

              : "") +

            (editingPurok !== purok

              ? ` Purok changed from ${editingPurok || "Not Set"} to ${purok}.`

              : ""),

          actorType: "admin",

          actorName: admin?.email || "Administrator",

          actorId: admin?.uid,

          referenceId: editingId,

          referenceType: "system",

          ...(editingFullName !== cleanName || editingPurok !== purok

            ? {

                metadata: {

                  ...(editingFullName !== cleanName ? { previousFullName: editingFullName, fullName: cleanName } : {}),

                  ...(editingPurok !== purok ? { previousPurok: editingPurok || "Not Set", purok } : {}),

                },

              }

            : {}),

        });

        setMessage("Resident updated successfully.");

      } else {

        const archivedDuplicate = duplicateSnapshot.docs.find((item) =>

          item.data().archived === true &&

          isDuplicateResidentName(cleanName, String(item.data().fullName || ""))

        );

        if (archivedDuplicate) {

          setError("An archived resident with this name already exists. Restore that resident instead.");

          return;

        }

        firestoreOperation = "add resident";

        const residentRef = await addDoc(collection(db, "residents"), {

          fullName: cleanName,

          fullNameNormalized: normalized,

          ...getResidentVerificationFields(cleanName, normalizePurokForSearch(purok)),

          purok,

          active: true,

          archived: false,

          createdAt: serverTimestamp(),

          updatedAt: serverTimestamp(),

          createdBy: { uid: admin?.uid || "", email: admin?.email || "" },

          updatedBy: { uid: admin?.uid || "", email: admin?.email || "" },

        });

        await logActivity({

          action: "RESIDENT_ADDED",

          category: "Residents",

          description: `${admin?.email || "Administrator"} added resident ${cleanName}.`,

          actorType: "admin",

          actorName: admin?.email || "Administrator",

          actorId: admin?.uid,

          referenceId: residentRef.id,

          referenceType: "system",

        });

        setMessage("Resident added successfully.");

      }

      setFullName("");

      setEditingFullName("");

      setPurok("");

      setEditingPurok("");

      setEditingId(null);

      setFormOpen(false);

    } catch (saveError) {

      reportResidentFirestoreError(firestoreOperation, saveError);

      setError(`Unable to ${editingId ? "update" : "add"} this resident.`);

    } finally {

      setSaving(false);

    }

  };



  const toggle = (id: string, checked: boolean) => setSelectedIds((current) =>

    checked ? [...new Set([...current, id])] : current.filter((item) => item !== id)

  );

  const selectAll = (checked: boolean) => setSelectedIds(checked ? visibleResidents.map((resident) => resident.id) : []);



  const archiveSelected = async () => {

    if (!selectedIds.length || !window.confirm("Archive selected residents?")) return;

    const count = selectedIds.length;

    try {

      await archiveRecords("residents", selectedIds);

      await logActivity({

        action: "RESIDENTS_ARCHIVED",

        category: "Residents",

        description: `${auth.currentUser?.email || "Administrator"} archived ${count} residents.`,

        actorType: "admin",

        actorName: auth.currentUser?.email || "Administrator",

        actorId: auth.currentUser?.uid,

        metadata: { count },

      });

      setSelectedIds([]);

      setMessage(`${count} residents archived successfully.`);

    } catch (archiveError) {

      reportResidentFirestoreError("archive residents", archiveError);

      setError("Unable to archive selected residents.");

    }

  };



  const prepareVerification = async () => {

    if (!window.confirm("Prepare the resident registry for indexed verification? This is safe to repeat.")) return;

    setMigrating(true);

    setError("");

    setMessage("");

    try {

      const admin = auth.currentUser;

      if (!admin) {

        setError("Please sign in as an administrator before preparing verification.");

        return;

      }

      const token = await admin.getIdToken(true);

      const response = await fetch("/api/admin/residents/verification-migration", {

        method: "POST",

        headers: { Authorization: `Bearer ${token || ""}` },

      });

      const result = (await response.json()) as { complete?: boolean; residentCount?: number; processedCount?: number; invalidCount?: number; invalidResidents?: Array<{ id: string; problems: string[] }>; message?: string };

      if (!response.ok || result.complete !== true) {

        setInvalidVerificationResidents(result.invalidResidents || []);

        setError(`${result.message || "Migration could not be completed."}${typeof result.invalidCount === "number" ? ` Invalid records: ${result.invalidCount}.` : ""}`);

        await refreshVerificationStatus();

        return;

      }

      setVerificationReady(true);

      setVerificationMigrationStatus("complete");

      setMessage(`Resident verification is ready. Prepared ${result.residentCount || 0} resident records.`);

    } catch {

      setError("Unable to reach the verification migration service. Check the server connection and try again.");

      await refreshVerificationStatus();

    } finally {

      setMigrating(false);

    }

  };



  const diagnoseVerification = async () => {

    setDiagnosingVerification(true);

    setError("");

    try {

      const admin = auth.currentUser;

      if (!admin) {

        setError("Please sign in as an administrator before running diagnostics.");

        return;

      }

      const token = await admin.getIdToken(true);

      const response = await fetch("/api/admin/residents/verification-migration?diagnose=invalid", {

        headers: { Authorization: `Bearer ${token || ""}` },

      });

      const result = await response.json() as { invalidResidents?: Array<{ id: string; problems: string[] }>; message?: string };

      if (!response.ok) {

        setError(result.message || "Unable to diagnose invalid resident records.");

        return;

      }

      setInvalidVerificationResidents(result.invalidResidents || []);

      setMessage(result.invalidResidents?.length ? "Invalid resident records identified below. No records were changed." : "No invalid resident records were found. No records were changed.");

    } catch {

      setError("Unable to reach the verification diagnostic service.");

    } finally {

      setDiagnosingVerification(false);

    }

  };



  const restore = async (resident: Resident) => {

    if (!window.confirm("Restore this resident?")) return;

    try {

      const normalized = normalizeResidentNameForDuplicateCheck(
        resident.fullName
      );
      const duplicateSnapshot = await getDocs(
        query(
          collection(db, "residents"),
          where("fullNameNormalized", "==", normalized)
        )
      );

      if (duplicateSnapshot.docs.some((item) =>

        item.id !== resident.id &&

        item.data().active === true &&

        item.data().archived !== true &&

        isDuplicateResidentName(resident.fullName, String(item.data().fullName || ""))

      )) {

        setError("This resident cannot be restored because an active duplicate already exists.");

        return;

      }

      await restoreRecord("residents", resident.id);

      await logActivity({

        action: "RESIDENT_RESTORED",

        category: "Residents",

        description: `${auth.currentUser?.email || "Administrator"} restored resident ${resident.fullName}.`,

        actorType: "admin",

        actorName: auth.currentUser?.email || "Administrator",

        actorId: auth.currentUser?.uid,

        referenceId: resident.id,

        referenceType: "system",

      });

      setMessage("Resident restored successfully.");

    } catch (restoreError) {

      reportResidentFirestoreError("restore resident", restoreError);

      setError("Unable to restore this resident.");

    }

  };



  return (

    <AdminFeatureShell

      title="Resident Registry"

      description="Manage the official list of registered residents of Barangay Poblacion North."


actions={
  <button
    type="button"
    onClick={openAdd}
    className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
  >
    <Plus size={16} />
    Add Resident
  </button>
}


    >

      <div className="space-y-5">

        {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{message}</div>}

        {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}

        {invalidVerificationResidents.length > 0 && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><h2 className="text-sm font-bold text-amber-900">Invalid Verification Records</h2><p className="mt-1 text-xs text-amber-800">Diagnostic output only. No resident records were changed.</p><div className="mt-3 space-y-2">{invalidVerificationResidents.map((resident) => <div key={resident.id} className="rounded-xl border border-amber-200 bg-white p-3"><p className="font-mono text-xs font-semibold text-slate-800">Document ID: {resident.id}</p><ul className="mt-2 list-disc pl-5 text-xs text-slate-600">{resident.problems.map((problem) => <li key={problem}>{problem.replaceAll("_", " ").toLowerCase()}</li>)}</ul></div>)}</div></section>}



        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {activePurokCounts.map(({ purok: option, count }) => (

            <button

              key={option}

              type="button"

              onClick={() => setPurokFilter(option)}

              className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-violet-300 ${purokFilter === option ? "border-violet-400 ring-2 ring-violet-100" : "border-violet-100"}`}

            >

              <p className="text-sm font-medium text-slate-500">{option}</p>

              <p className="mt-2 text-3xl font-bold text-slate-900">{count}</p>

              <p className="mt-1 text-xs text-slate-500">Active registered residents</p>

            </button>

          ))}

        </section>



        <div className="grid gap-4 sm:grid-cols-2">

          <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4">

            <p className="text-sm font-medium text-violet-700">Total Active Registered Residents</p>

            <p className="mt-2 text-3xl font-bold text-violet-900">{activeResidents.length}</p>

          </div>



        </div>



        {formOpen && <form onSubmit={saveResident} className="rounded-2xl border border-violet-100 bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-bold text-slate-900">{editingId ? "Edit Resident" : "Add Resident"}</h2><div className="grid max-w-xl gap-4"><label className="block text-sm font-semibold text-slate-700">Full Name<input autoFocus required value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Last Name, First Name, Middle Name" className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal" /><span className="mt-1 block text-xs font-normal text-slate-500">Enter name as: Last Name, First Name, Middle Name</span></label><label className="block text-sm font-semibold text-slate-700">Purok<select required value={purok} onChange={(event) => setPurok(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal"><option value="">Select Purok</option>{OFFICIAL_PUROKS.map((option) => <option key={option} value={option}>{option}</option>)}</select></label></div><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button><button type="submit" disabled={saving} className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : editingId ? "Save Changes" : "Save"}</button></div></form>}



        <div className="flex w-full flex-wrap rounded-xl border border-slate-200 bg-white p-1 sm:w-fit"><button type="button" onClick={() => { setShowArchived(false); setSelectedIds([]); }} className={`rounded-lg px-4 py-2 text-sm font-semibold ${!showArchived ? "bg-violet-50 text-violet-700" : "text-slate-500"}`}>Active Residents</button><button type="button" onClick={() => { setShowArchived(true); setSelectedIds([]); }} className={`rounded-lg px-4 py-2 text-sm font-semibold ${showArchived ? "bg-violet-50 text-violet-700" : "text-slate-500"}`}>Archived Residents</button></div>

         <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search residents or document ID..." className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm" /></div>

        <label className="block max-w-sm text-sm font-semibold text-slate-700">Filter by Purok<select value={purokFilter} onChange={(event) => setPurokFilter(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-normal"><option value="All Puroks">All Puroks</option>{OFFICIAL_PUROKS.map((option) => <option key={option} value={option}>{option}</option>)}{notSetCount > 0 && <option value="Not Set">Not Set</option>}</select></label>

         {!showArchived && <BulkArchiveBar visibleCount={visibleResidents.length} selectedCount={selectedIds.length} allSelected={visibleResidents.length > 0 && visibleResidents.every((resident) => selectedIds.includes(resident.id))} onSelectAll={selectAll} onArchive={() => void archiveSelected()} />}

         {!loading && residents.length === 0 && <section className="rounded-2xl border border-violet-100 bg-violet-50 p-6 text-center"><Users className="mx-auto text-violet-400" /><h3 className="mt-3 text-lg font-bold text-slate-900">No residents have been added yet.</h3><p className="mx-auto mt-2 max-w-md text-sm text-slate-600">Start the registry by adding one resident or importing a validated CSV list.</p><div className="mt-5 flex flex-wrap justify-center gap-2"><button type="button" onClick={openAdd} className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700">Add Residents</button><button type="button" onClick={() => setBulkImportOpen(true)} className="rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-50">Bulk Import Residents</button></div></section>}



        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-5"><h2 className="font-bold text-slate-900">{showArchived ? "Archived Residents" : "Active Residents"}</h2><p className="mt-1 text-sm text-slate-500">{visibleResidents.length} resident{visibleResidents.length === 1 ? "" : "s"}</p></div>{loading ? <div className="p-12 text-center"><Loader2 className="mx-auto animate-spin text-violet-600" /></div> : visibleResidents.length === 0 ? <div className="p-12 text-center"><Users className="mx-auto text-slate-300" /><p className="mt-3 text-sm text-slate-500">No residents found.</p></div> : <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-50"><tr><th className="px-5 py-4 text-xs uppercase text-slate-500">Select</th><th className="px-5 py-4 text-xs uppercase text-slate-500">Full Name</th><th className="px-5 py-4 text-xs uppercase text-slate-500">Purok</th><th className="px-5 py-4 text-xs uppercase text-slate-500">Status</th><th className="px-5 py-4 text-xs uppercase text-slate-500">Date Added</th><th className="px-5 py-4 text-xs uppercase text-slate-500">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{visibleResidents.map((resident) => <tr key={resident.id}><td className="px-5 py-4">{!showArchived && <input type="checkbox" checked={selectedIds.includes(resident.id)} onChange={(event) => toggle(resident.id, event.target.checked)} className="h-4 w-4 accent-violet-600" />}</td><td className="px-5 py-4 font-semibold text-slate-800">{resident.fullName}</td><td className="px-5 py-4 text-sm text-slate-600">{resident.purok || "Not Set"}</td><td className="px-5 py-4"><span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${resident.archived ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700"}`}><CheckCircle2 size={13} />{resident.archived ? "Archived" : "Active / Registered Resident"}</span></td><td className="px-5 py-4 text-sm text-slate-500">{formatDate(resident.createdAt)}</td><td className="px-5 py-4"><div className="flex items-center gap-2">{!showArchived && <button type="button" onClick={() => openEdit(resident)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" title="Edit"><Edit3 size={15} /></button>}{showArchived && <button type="button" onClick={() => void restore(resident)} className="rounded-lg px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-50">Restore</button>}</div></td></tr>)}</tbody></table></div>}</section>

      </div>

      {bulkImportOpen && <BulkResidentImport onClose={() => setBulkImportOpen(false)} />}

    </AdminFeatureShell>

  );

}



export default function AdminResidentsPage() {

  return <AdminAuthGuard><AdminResidentsContent /></AdminAuthGuard>;

}
