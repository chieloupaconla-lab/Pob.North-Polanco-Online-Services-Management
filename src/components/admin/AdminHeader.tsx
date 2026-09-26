"use client";

import React, { useState } from "react";
import {
  Bell,
  ChevronDown,
  Menu,
  X,
  FileText,
  AlertTriangle,
  Package,
  Home,
} from "lucide-react";

interface AdminHeaderProps {
  onToggleMobileSidebar?: () => void;
  mobileSidebarOpen?: boolean;
  pathname: string;
}

const pageLabels: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/documents": "Document Requests",
  "/admin/complaints": "Complaints",
  "/admin/assets": "Asset Borrowing",
};

const moduleIcons: Record<string, React.ElementType> = {
  "/admin": Home,
  "/admin/documents": FileText,
  "/admin/complaints": AlertTriangle,
  "/admin/assets": Package,
};

export default function AdminHeader({
  onToggleMobileSidebar,
  mobileSidebarOpen = false,
  pathname,
}: AdminHeaderProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const router = usePathname();

  const currentPage = pageLabels[router] || "Admin";
  const CurrentIcon = moduleIcons[router] || Home;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-16">
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={onToggleMobileSidebar}
              type="button"
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileSidebarOpen ? (
                <X className="w-6 h-6 text-[#6D3FE7]" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <CurrentIcon className="w-5 h-5 text-[#6D3FE7] hidden sm:block" />
            <div>
              <h1 className="text-sm sm:text-base font-bold text-[#17213A] tracking-tight">
                {currentPage}
              </h1>
              <p className="hidden sm:block text-[10px] text-[#6B7280]">
                Barangay Poblacion North, Polanco
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative">
              <button
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                }}
                type="button"
                className="relative p-2.5 rounded-xl text-slate-600 hover:text-[#6D3FE7] hover:bg-[#F0EAFF]/50 focus:outline-none transition-colors"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-sm text-[#17213A]">Notifications</span>
                    <button
                      onClick={() => setNotificationsOpen(false)}
                      className="text-xs text-[#6D3FE7] font-semibold hover:underline"
                    >
                      Close
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 px-4 py-2">
                    <p className="text-xs text-[#6B7280] text-center py-4">
                      No notifications at this time.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#6D3FE7] to-indigo-800 flex items-center justify-center text-white text-xs font-extrabold">
                AD
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-[#17213A]">Admin</div>
                <div className="text-[10px] text-[#6B7280]">Barangay Personnel</div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
