"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  FileText,
  AlertTriangle,
  Package,
  Users,
  ExternalLink,
  Warehouse,
  History,
  Bell,
  Archive,
} from "lucide-react";

export type AdminSidebarNavItemId =
  | "dashboard"
  | "documents"
  | "complaints"
  | "assets"
  | "residents"
  | "inventory"
  | "activity-log"
  | "notifications"
  | "archive"
  | "public-portal";

interface AdminSidebarProps {
  activeItemId?: AdminSidebarNavItemId;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const mainNavItems: {
  id: AdminSidebarNavItemId;
  label: string;
  href: string;
  icon: React.ElementType;
}[] = [
  { id: "dashboard", label: "Dashboard", href: "/admin", icon: Home },
  { id: "residents", label: "Resident Registry", href: "/admin/residents", icon: Users },
  { id: "documents", label: "Document Requests", href: "/admin/documents", icon: FileText },
  { id: "complaints", label: "Complaints", href: "/admin/complaints", icon: AlertTriangle },
  { id: "assets", label: "Asset Borrowing", href: "/admin/assets", icon: Package },
  { id: "inventory", label: "Equipment Inventory", href: "/admin/inventory", icon: Warehouse },
  { id: "activity-log", label: "Activity Log", href: "/admin/activity-log", icon: History },
  { id: "notifications", label: "Notifications", href: "/admin/notifications", icon: Bell },
  { id: "archive", label: "Archive", href: "/admin/archive", icon: Archive },
];

const secondaryNavItems: {
  id: AdminSidebarNavItemId;
  label: string;
  href: string;
  icon: React.ElementType;
}[] = [
  { id: "public-portal", label: "Public Portal", href: "/", icon: ExternalLink },
];

export default function AdminSidebar({
  activeItemId = "dashboard",
  mobileOpen = false,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200/80 select-none">
      <div className="flex min-w-0 items-center gap-3 border-b border-slate-100 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#6D3FE7] to-indigo-800 text-white">
          <span className="text-[10px] font-extrabold">BP</span>
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#6D3FE7]">
            BARANGAY
          </div>
          <div className="text-sm font-extrabold text-[#17213A] tracking-tight leading-none">
            POBLACION NORTH
          </div>
          <div className="text-[10px] font-semibold text-[#6B7280] tracking-[0.2em] uppercase mt-0.5">
            ADMIN PORTAL
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {mainNavItems.map((item) => {
          const isActive =
            activeItemId !== "dashboard"
              ? activeItemId === item.id
              : item.id === "dashboard"
                ? pathname === "/admin"
                : pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onCloseMobile}
              className={`group relative flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? "bg-[#F0EAFF] text-[#6D3FE7] font-bold"
                  : "text-slate-600 hover:text-[#17213A] hover:bg-slate-50"
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1.5 rounded-r-full bg-[#6D3FE7]" />
              )}
              <Icon
                className={`w-5 h-5 shrink-0 transition-colors ${
                  isActive
                    ? "text-[#6D3FE7]"
                    : "text-slate-400 group-hover:text-slate-700"
                }`}
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}

        <div className="pt-4 mt-4 border-t border-slate-100 space-y-1">
          {secondaryNavItems.map((item) => {
            const isActive = activeItemId === item.id;
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onCloseMobile}
                className={`group relative flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-[#F0EAFF] text-[#6D3FE7] font-bold"
                    : "text-slate-600 hover:text-[#17213A] hover:bg-slate-50"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1.5 rounded-r-full bg-[#6D3FE7]" />
                )}
                <Icon
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    isActive
                      ? "text-[#6D3FE7]"
                      : "text-slate-400 group-hover:text-slate-700"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 z-20">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex h-full w-72 max-w-[85vw] flex-col shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
