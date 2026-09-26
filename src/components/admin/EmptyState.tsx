import React from "react";

interface EmptyStateProps {
  message: string;
  subMessage?: string;
  icon?: React.ReactNode;
}

export default function EmptyState({
  message,
  subMessage,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
      {icon || (
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
          <svg
            className="w-7 h-7 text-slate-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
            />
          </svg>
        </div>
      )}
      <p className="text-sm font-semibold text-[#17213A]">{message}</p>
      {subMessage && (
        <p className="text-xs text-[#6B7280]">{subMessage}</p>
      )}
    </div>
  );
}
