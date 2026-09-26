"use client";

import React from "react";
import Link from "next/link";
import BarangaySealLogo from "./BarangaySealLogo";
import {
  Home,
  FileText,
  ClockCheck,
  AlertTriangle,
  Package,
  Info,
  ArrowLeft,
  X,
} from "lucide-react";

export type SidebarNavItemId =
  | "dashboard"
  | "request-document"
  | "check-status"
  | "submit-complaint"
  | "borrow-asset"
  | "barangay-info"
  | "back-home";

interface SidebarProps {
  activeItemId?: SidebarNavItemId;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  activeItemId = "dashboard",
  mobileOpen = false,
  onCloseMobile,
}: SidebarProps) {
  const navItems: { id: SidebarNavItemId; label: string; href: string; icon: React.ElementType }[] = [
    { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: Home },
    { id: "request-document", label: "Request Document", href: "/documents", icon: FileText },
    { id: "check-status", label: "Check Request Status", href: "/status", icon: ClockCheck },
    { id: "submit-complaint", label: "Submit Complaint", href: "/complaints", icon: AlertTriangle },
    { id: "borrow-asset", label: "Borrow Barangay Asset", href: "/assets", icon: Package },
  ];

  const secondaryNavItems: { id: SidebarNavItemId; label: string; href: string; icon: React.ElementType }[] = [
    { id: "barangay-info", label: "Barangay Information", href: "/info", icon: Info },
    { id: "back-home", label: "Back to Home", href: "/", icon: ArrowLeft },
  ];

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 z-20">
        <div className="flex flex-col h-full bg-white border-r border-slate-200/80 select-none">
          
          <div className="p-5 border-b border-slate-100 flex items-center gap-3">
            <BarangaySealLogo size={42} />
            <div>
              <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#6D3FE7]">
                BARANGAY
              </div>
              <div className="text-sm font-extrabold text-[#17213A] tracking-tight leading-none">
                POBLACION NORTH
              </div>
              <div className="text-[10px] font-semibold text-[#6B7280] tracking-[0.2em] uppercase mt-0.5">
                POLANCO
              </div>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = activeItemId === item.id;
              const Icon = item.icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
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
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            <div className="flex flex-col h-full bg-white border-r border-slate-200/80 select-none">
              
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BarangaySealLogo size={42} />
                  <div>
                    <div className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#6D3FE7]">
                      BARANGAY
                    </div>
                    <div className="text-sm font-extrabold text-[#17213A] tracking-tight leading-none">
                      POBLACION NORTH
                    </div>
                    <div className="text-[10px] font-semibold text-[#6B7280] tracking-[0.2em] uppercase mt-0.5">
                      POLANCO
                    </div>
                  </div>
                </div>
                {onCloseMobile && (
                  <button
                    onClick={onCloseMobile}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const isActive = activeItemId === item.id;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => onCloseMobile?.()}
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
                        onClick={() => onCloseMobile?.()}
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
          </div>
        </div>
      )}
    </>
  );
}
