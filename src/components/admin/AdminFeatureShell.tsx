"use client";

import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface AdminFeatureShellProps {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}

export default function AdminFeatureShell({
  title,
  description,
  actions,
  children,
}: AdminFeatureShellProps) {
  return (
    <div className="min-h-screen min-w-0 bg-[#F8F7FC]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
          <Link
            href="/admin"
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-violet-600 transition hover:text-violet-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin Dashboard
          </Link>

          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-extrabold text-[#17213A] sm:text-2xl">{title}</h1>
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            </div>
            {actions}
          </div>
        </div>
      </header>

      <main className="mx-auto min-w-0 max-w-[1600px] px-3 py-5 sm:px-6 sm:py-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
