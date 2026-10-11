"use client";

import { useState } from "react";
import {
  MAX_RESIDENT_IMPORT_BYTES,
  MAX_RESIDENT_IMPORT_RECORDS,
  parseResidentCsv,
  type ResidentImportIssue,
  type ResidentImportRecord,
} from "@/lib/residentBulkImport";
import { auth } from "@/lib/firebase";
import { CheckCircle2, Download, FileUp, Loader2, X } from "lucide-react";

type ImportSummary = {
  recordsRead: number;
  validRecords: number;
  invalidRecords: number;
  potentialDuplicates: number;
};

type ValidationResult = ImportSummary & {
  invalidRows: ResidentImportIssue[];
  skippedDuplicates: ResidentImportIssue[];
};

type Props = { onClose: () => void };

const emptySummary: ImportSummary = {
  recordsRead: 0,
  validRecords: 0,
  invalidRecords: 0,
  potentialDuplicates: 0,
};

function downloadTemplate() {
  const blob = new Blob([
    "fullName,purok,active,archived\n\"Paconla, Juan, Dela Cruz\",\"Purok Rizal\",true,false\n",
  ], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "resident-import-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function issueLabel(issue: ResidentImportIssue) {
  return `Row ${issue.rowNumber}: ${issue.message}`;
}

export default function BulkResidentImport({ onClose }: Props) {
  const [records, setRecords] = useState<ResidentImportRecord[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [summary, setSummary] = useState(emptySummary);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    created: number;
    skippedDuplicates: ResidentImportIssue[];
    failedRows: ResidentImportIssue[];
  } | null>(null);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setFileName(file.name);
    setError("");
    setMessage("");
    setResult(null);
    setValidation(null);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please upload a .csv file.");
      return;
    }
    if (file.size > MAX_RESIDENT_IMPORT_BYTES) {
      setError("CSV file must be 1 MB or smaller.");
      return;
    }

    setLoading(true);
    try {
      const parsed = parseResidentCsv(await file.text());
      setRecords(parsed.validRecords);
      if (parsed.invalidRows.length > 0) {
        const recordsRead = parsed.validRecords.length + parsed.invalidRows.length + parsed.duplicateRows.length;
        setSummary({ recordsRead, validRecords: parsed.validRecords.length, invalidRecords: parsed.invalidRows.length, potentialDuplicates: parsed.duplicateRows.length });
        setValidation({ ...emptySummary, recordsRead, validRecords: parsed.validRecords.length, invalidRecords: parsed.invalidRows.length, potentialDuplicates: parsed.duplicateRows.length, invalidRows: parsed.invalidRows, skippedDuplicates: parsed.duplicateRows });
        return;
      }

      const admin = auth.currentUser;
      if (!admin) throw new Error("Please sign in as an administrator before importing residents.");
      const token = await admin.getIdToken(true);
      const response = await fetch("/api/admin/residents/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "validate", records: parsed.validRecords }),
      });
      const serverResult = await response.json() as Partial<ValidationResult> & { message?: string };
      const validationResult: ValidationResult = {
        recordsRead: serverResult.recordsRead || parsed.validRecords.length,
        validRecords: serverResult.validRecords || 0,
        invalidRecords: serverResult.invalidRecords || 0,
        potentialDuplicates: serverResult.potentialDuplicates || 0,
        invalidRows: serverResult.invalidRows || [],
        skippedDuplicates: serverResult.skippedDuplicates || [],
      };
      setValidation(validationResult);
      setSummary(validationResult);
      if (!response.ok && validationResult.invalidRows.length === 0) setError(serverResult.message || "Unable to validate the import.");
    } catch (validationError) {
      setError(validationError instanceof Error ? validationError.message : "Unable to read the CSV file.");
      setRecords([]);
      setSummary(emptySummary);
    } finally {
      setLoading(false);
    }
  };

  const confirmImport = async () => {
    if (!validation || validation.invalidRows.length > 0 || records.length === 0) return;
    const admin = auth.currentUser;
    if (!admin) {
      setError("Please sign in as an administrator before importing residents.");
      return;
    }

    setCommitting(true);
    setError("");
    try {
      const token = await admin.getIdToken(true);
      const response = await fetch("/api/admin/residents/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "commit", records }),
      });
      const importResult = await response.json() as {
        created?: number;
        skippedDuplicates?: ResidentImportIssue[];
        failedRows?: ResidentImportIssue[];
        message?: string;
      };
      setResult({ created: importResult.created || 0, skippedDuplicates: importResult.skippedDuplicates || [], failedRows: importResult.failedRows || [] });
      if (!response.ok && response.status !== 207) {
        setError(importResult.message || "Import could not be completed.");
        return;
      }
      setMessage(importResult.message || "Import completed.");
    } catch {
      setError("Unable to reach the bulk import service. No confirmation was recorded.");
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <section className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-violet-600">Resident Registry</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">Bulk Import Residents</h2>
          </div>
          <button type="button" onClick={onClose} disabled={committing} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"><X size={18} /></button>
        </header>

        <div className="overflow-y-auto p-5 sm:p-6">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={downloadTemplate} className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-100"><Download size={16} /> Download CSV Template</button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"><FileUp size={16} /> Choose CSV<input type="file" accept=".csv,text/csv" onChange={(event) => void handleFile(event)} className="sr-only" /></label>
          </div>
          <p className="mt-3 text-xs text-slate-500">Required columns: <code>fullName</code>, <code>purok</code>. Optional columns: <code>active</code>, <code>archived</code>. Maximum {MAX_RESIDENT_IMPORT_RECORDS} records and 1 MB.</p>
          {fileName && <p className="mt-3 text-xs font-semibold text-slate-700">Selected file: {fileName}</p>}
          {loading && <div className="mt-5 flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-600"><Loader2 size={16} className="animate-spin" /> Validating CSV and checking existing residents...</div>}
          {error && <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
          {message && <div className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"><CheckCircle2 size={17} className="mt-0.5 shrink-0" />{message}</div>}

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Read" value={summary.recordsRead} />
            <Stat label="Valid" value={summary.validRecords} />
            <Stat label="Invalid" value={summary.invalidRecords} />
            <Stat label="Duplicates" value={summary.potentialDuplicates} />
          </div>

          {records.length > 0 && <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200"><div className="border-b border-slate-100 bg-slate-50 p-3"><h3 className="text-sm font-bold text-slate-800">Preview</h3><p className="mt-1 text-xs text-slate-500">Showing up to the first 10 valid rows.</p></div><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="border-b border-slate-100 text-slate-500"><tr><th className="px-3 py-2">Row</th><th className="px-3 py-2">Full Name</th><th className="px-3 py-2">Purok</th><th className="px-3 py-2">Active</th><th className="px-3 py-2">Archived</th></tr></thead><tbody className="divide-y divide-slate-100">{records.slice(0, 10).map((record) => <tr key={record.rowNumber}><td className="px-3 py-2 text-slate-500">{record.rowNumber}</td><td className="px-3 py-2 font-medium text-slate-800">{record.fullName}</td><td className="px-3 py-2 text-slate-600">{record.purok}</td><td className="px-3 py-2 text-slate-600">{String(record.active)}</td><td className="px-3 py-2 text-slate-600">{String(record.archived)}</td></tr>)}</tbody></table></div></div>}

          {validation && validation.invalidRows.length > 0 && <IssueList title="Invalid rows" issues={validation.invalidRows} />}
          {validation && validation.skippedDuplicates.length > 0 && <IssueList title="Rows that will be skipped as duplicates" issues={validation.skippedDuplicates} />}
          {result && result.failedRows.length > 0 && <IssueList title="Rows that failed to write" issues={result.failedRows} />}
          {result && <p className="mt-5 text-sm font-semibold text-slate-700">Created: {result.created}. Skipped duplicates: {result.skippedDuplicates.length}. Failed: {result.failedRows.length}.</p>}
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button type="button" onClick={onClose} disabled={committing} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={() => void confirmImport()} disabled={committing || loading || !validation || validation.invalidRows.length > 0 || records.length === 0 || Boolean(result && result.failedRows.length === 0 && result.created > 0)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300">{committing ? <Loader2 size={16} className="animate-spin" /> : null}{committing ? "Importing..." : "Confirm Import"}</button>
        </footer>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-bold text-slate-900">{value}</p></div>;
}

function IssueList({ title, issues }: { title: string; issues: ResidentImportIssue[] }) {
  return <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4"><h3 className="text-sm font-bold text-amber-900">{title}</h3><ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs text-amber-900">{issues.map((issue, index) => <li key={`${issue.rowNumber}-${index}`}>{issueLabel(issue)}</li>)}</ul></div>;
}
