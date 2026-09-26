"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  MessageSquareWarning,
  Package,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ArrowRight,
  Clock3,
  CheckCircle2,
  AlertCircle,
  ClipboardList,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

import AdminAuthGuard from "@/components/AdminAuthGuard";
import { auth } from "@/lib/firebase";

export default function AdminPage() {
  return (
    <AdminAuthGuard>
      <AdminDashboard />
    </AdminAuthGuard>
  );
}

function AdminDashboard() {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.email) {
        setAdminEmail(user.email);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/admin/login");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Unable to sign out. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Mobile Header */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-violet-100 bg-white px-4 shadow-sm lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-xl p-2 text-slate-600 hover:bg-violet-50 hover:text-violet-700"
          aria-label="Open menu"
        >
          <Menu size={23} />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white">
            <ShieldCheck size={20} />
          </div>

          <span className="text-sm font-bold text-slate-800">
            e-Barangay Admin
          </span>
        </div>

        <div className="w-9" />
      </header>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <button
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-violet-100 bg-white shadow-xl transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full"
        }`}
      >

        {/* Sidebar Header */}
        <div className="flex h-20 items-center justify-between border-b border-slate-100 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-200">
              <ShieldCheck size={24} />
            </div>

            <div>
              <h1 className="text-sm font-bold text-slate-900">
                e-Barangay
              </h1>

              <p className="text-xs text-slate-400">
                Admin Portal
              </p>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 lg:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">

          <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Main Menu
          </p>

          <Link
            href="/admin"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 rounded-xl bg-violet-50 px-3 py-3 text-sm font-semibold text-violet-700"
          >
            <LayoutDashboard size={19} />
            Dashboard
          </Link>

          <Link
            href="/admin/documents"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
          >
            <FileText size={19} />
            Document Requests
          </Link>

          <Link
            href="/admin/complaints"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
          >
            <MessageSquareWarning size={19} />
            Community Concerns
          </Link>

          <Link
            href="/admin/assets"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
          >
            <Package size={19} />
            Asset Borrowing
          </Link>

          <div className="my-5 border-t border-slate-100" />

          <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Administration
          </p>

          <Link
            href="#notifications"
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
          >
            <Bell size={19} />
            Notifications
          </Link>

          <Link
            href="#settings"
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
          >
            <Settings size={19} />
            Settings
          </Link>

          <div className="my-5 border-t border-slate-100" />

          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
          >
            <ExternalLink size={19} />
            Public Portal
          </Link>
        </nav>

        {/* Admin Account */}
        <div className="border-t border-slate-100 p-4">

          <div className="mb-3 rounded-2xl bg-slate-50 p-3">
            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                <ShieldCheck size={19} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800">
                  Admin Personnel
                </p>

                <p className="truncate text-[11px] text-slate-400">
                  {adminEmail || "Authenticated Admin"}
                </p>
              </div>

            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={19} />
            Sign Out
          </button>

        </div>
      </aside>

      {/* Main Content */}
      <main className="min-h-screen lg:pl-72">

        {/* Top Header */}
        <header className="hidden h-20 items-center justify-between border-b border-slate-200 bg-white px-8 lg:flex">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-violet-500">
              Administration
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Barangay Services Dashboard
            </h2>
          </div>

          <div className="flex items-center gap-3">

            <button
              className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-violet-50 hover:text-violet-700"
              aria-label="Notifications"
            >
              <Bell size={21} />

              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
            </button>

            <div className="h-8 w-px bg-slate-200" />

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                <ShieldCheck size={19} />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Admin Personnel
                </p>

                <p className="max-w-48 truncate text-xs text-slate-400">
                  {adminEmail}
                </p>
              </div>

            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="px-4 py-6 sm:px-6 lg:px-8">

          {/* Welcome Banner */}
          <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-600 p-6 text-white shadow-lg shadow-violet-200 sm:p-8">

            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

              <div className="max-w-2xl">

                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-violet-100 ring-1 ring-white/15">
                  <ShieldCheck size={14} />
                  Authorized Administration Portal
                </div>

                <h1 className="text-2xl font-bold sm:text-3xl">
                  Welcome to e-Barangay Admin
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-violet-100 sm:text-base">
                  Manage document requests, community concerns,
                  and barangay-owned asset borrowing and returning
                  from one centralized administration portal.
                </p>

              </div>

              <div className="hidden lg:block">
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
                  <ClipboardList size={52} />
                </div>
              </div>

            </div>
          </section>

          {/* Summary Cards */}
          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <SummaryCard
              title="Document Requests"
              value="0"
              description="Pending requests"
              icon={<FileText size={21} />}
              href="/admin/documents"
            />

            <SummaryCard
              title="Community Concerns"
              value="0"
              description="Pending concerns"
              icon={<MessageSquareWarning size={21} />}
              href="/admin/complaints"
            />

            <SummaryCard
              title="Asset Borrowing"
              value="0"
              description="Active requests"
              icon={<Package size={21} />}
              href="/admin/assets"
            />

            <SummaryCard
              title="For Action"
              value="0"
              description="Items requiring attention"
              icon={<AlertCircle size={21} />}
              href="/admin"
            />

          </section>

          {/* Main Grid */}
          <div className="mt-6 grid gap-6 xl:grid-cols-3">

            {/* Recent Requests */}
            <section className="rounded-3xl border border-slate-200 bg-white xl:col-span-2">

              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">

                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Recent Requests & Concerns
                  </h2>

                  <p className="mt-1 text-xs text-slate-400">
                    Latest activity from the public portal
                  </p>
                </div>

                <button className="rounded-xl p-2 text-slate-400 hover:bg-violet-50 hover:text-violet-600">
                  <ArrowRight size={18} />
                </button>

              </div>

              <div className="p-5 sm:p-6">

                <div className="flex min-h-56 flex-col items-center justify-center text-center">

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                    <ClipboardList size={27} />
                  </div>

                  <h3 className="mt-4 text-sm font-semibold text-slate-800">
                    No requests yet
                  </h3>

                  <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
                    Submitted document requests, community
                    concerns, and asset borrowing requests will
                    appear here once they are connected to
                    Firestore.
                  </p>

                </div>

              </div>
            </section>

            {/* Quick Actions */}
            <section className="rounded-3xl border border-slate-200 bg-white">

              <div className="border-b border-slate-100 px-5 py-5">
                <h2 className="text-base font-bold text-slate-900">
                  Quick Actions
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Access common administrative tasks
                </p>
              </div>

              <div className="space-y-3 p-5">

                <QuickAction
                  href="/admin/documents"
                  icon={<FileText size={19} />}
                  title="Review Documents"
                  description="Manage document requests"
                />

                <QuickAction
                  href="/admin/complaints"
                  icon={<MessageSquareWarning size={19} />}
                  title="Review Concerns"
                  description="Manage community concerns"
                />

                <QuickAction
                  href="/admin/assets"
                  icon={<Package size={19} />}
                  title="Manage Assets"
                  description="Review borrowing requests"
                />

              </div>
            </section>
          </div>

          {/* Information Cards */}
          <section className="mt-6 grid gap-6 lg:grid-cols-2">

            {/* Workflow */}
            <div className="rounded-3xl border border-violet-100 bg-violet-50 p-6">

              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm">
                  <Clock3 size={21} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Administrative Workflow
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Review incoming submissions, update their
                    status, add administrative notes, and process
                    each request according to barangay procedures.
                  </p>
                </div>

              </div>
            </div>

            {/* Security */}
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6">

              <div className="flex items-start gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                  <CheckCircle2 size={21} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">
                    Admin Access
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    You are currently signed in through Firebase
                    Authentication. Administrative role
                    authorization and Firestore security rules
                    will be added as the system is completed.
                  </p>
                </div>

              </div>
            </div>

          </section>

          {/* Bottom Information */}
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
                  e-Barangay
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  Barangay Poblacion North
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Municipality of Polanco, Zamboanga del Norte
                </p>
              </div>

              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
              >
                View Public Portal
                <ExternalLink size={16} />
              </Link>

            </div>

          </section>

          <footer className="py-8 text-center text-xs text-slate-400">
            © 2026 e-Barangay • Barangay Poblacion North
          </footer>

        </div>
      </main>
    </div>
  );
}

/* ----------------------------- */
/* Summary Card                  */
/* ----------------------------- */

function SummaryCard({
  title,
  value,
  description,
  icon,
  href,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between">

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 transition group-hover:bg-violet-100">
          {icon}
        </div>

        <ArrowRight
          size={17}
          className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-violet-500"
        />

      </div>

      <p className="mt-5 text-2xl font-bold text-slate-900">
        {value}
      </p>

      <h3 className="mt-1 text-sm font-semibold text-slate-700">
        {title}
      </h3>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>
    </Link>
  );
}

/* ----------------------------- */
/* Quick Action                  */
/* ----------------------------- */

function QuickAction({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-slate-100 p-3 transition hover:border-violet-200 hover:bg-violet-50"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600 group-hover:bg-white">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800">
          {title}
        </p>

        <p className="mt-0.5 text-xs text-slate-400">
          {description}
        </p>
      </div>

      <ArrowRight
        size={16}
        className="text-slate-300 group-hover:text-violet-500"
      />
    </Link>
  );
}