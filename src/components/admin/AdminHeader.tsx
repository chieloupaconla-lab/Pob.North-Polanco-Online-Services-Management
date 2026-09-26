"use client";

import { useState } from "react";
import {
  Bell,
  ChevronDown,
  Home,
  Menu,
  Settings,
  FileText,
  MessageSquare,
  Package,
  Users,
  X,
} from "lucide-react";

interface AdminHeaderProps {
  pathname: string;
  mobileSidebarOpen?: boolean;
  onToggleMobileSidebar?: () => void;
}

const pageLabels: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/documents": "Document Requests",
  "/admin/complaints": "Facility Concerns",
  "/admin/assets": "Equipment Borrowing",
  "/admin/users": "Users",
  "/admin/settings": "Settings",
};

const moduleIcons: Record<string, typeof Home> = {
  "/admin": Home,
  "/admin/documents": FileText,
  "/admin/complaints": MessageSquare,
  "/admin/assets": Package,
  "/admin/users": Users,
  "/admin/settings": Settings,
};

export default function AdminHeader({
  pathname,
  mobileSidebarOpen,
  onToggleMobileSidebar,
}: AdminHeaderProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const currentPage = pageLabels[pathname] || "Admin";
  const CurrentIcon = moduleIcons[pathname] || Home;

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm sm:px-6">
      <div className="flex items-center gap-3">
        {onToggleMobileSidebar && (
          <button
            type="button"
            onClick={onToggleMobileSidebar}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
            aria-label={
              mobileSidebarOpen ? "Close navigation menu" : "Open navigation menu"
            }
          >
            {mobileSidebarOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        )}

        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
            <CurrentIcon className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {currentPage}
            </h1>

            <p className="hidden text-xs text-gray-500 sm:block">
              Barangay Poblacion North Administration
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />

            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-12 w-80 rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  Notifications
                </h3>

                <button
                  type="button"
                  onClick={() => setNotificationsOpen(false)}
                  className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Close notifications"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-sm font-medium text-gray-800">
                  New service requests
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Check the admin dashboard for pending requests.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
            A
          </div>

          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900">
              Administrator
            </p>

            <p className="text-xs text-gray-500">
              Barangay Admin
            </p>
          </div>

          <ChevronDown className="hidden h-4 w-4 text-gray-400 sm:block" />
        </div>
      </div>
    </header>
  );
}