"use client";

import { Archive, CheckSquare } from "lucide-react";

type Props = {
  visibleCount: number;
  selectedCount: number;
  allSelected: boolean;
  onSelectAll: (checked: boolean) => void;
  onArchive: () => void;
};

export default function BulkArchiveBar({
  visibleCount,
  selectedCount,
  allSelected,
  onSelectAll,
  onArchive,
}: Props) {
  return (
    <div className="mb-4 flex flex-col items-stretch gap-3 rounded-2xl border border-violet-100 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
      <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
        <input
          type="checkbox"
          checked={allSelected && visibleCount > 0}
          onChange={(event) => onSelectAll(event.target.checked)}
          className="h-4 w-4 accent-violet-600"
        />
        <CheckSquare size={16} className="text-violet-600" />
        Select All ({visibleCount})
      </label>
      <span className="text-sm text-slate-500">{selectedCount} selected</span>
      <button
        type="button"
        disabled={selectedCount === 0}
        onClick={onArchive}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Archive size={16} /> Archive Selected ({selectedCount})
      </button>
    </div>
  );
}
