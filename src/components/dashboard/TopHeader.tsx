
"use client";

import React from "react";
import BarangaySealLogo from "./BarangaySealLogo";
import { Bell, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface TopHeaderProps {
  onToggleMobileSidebar?: () => void;
  mobileSidebarOpen?: boolean;
  onNotificationClick?: () => void;
  onProfileClick?: () => void;
}

export default function TopHeader({
  onToggleMobileSidebar,
  mobileSidebarOpen = false,
}: TopHeaderProps) {
  const router = useRouter();

  const handleNotificationClick = () => {
    router.push("/notifications");
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Barangay Branding */}
          <div className="flex items-center gap-3">
            <BarangaySealLogo size={40} />

            <div>
              <div className="text-[9px] font-bold tracking-[0.18em] uppercase text-[#6D3FE7]">
                BARANGAY
              </div>

              <div className="text-xs font-extrabold text-[#17213A] tracking-tight leading-tight">
                POBLACION NORTH
              </div>

              <div className="text-[9px] font-semibold text-[#6B7280] tracking-[0.2em] uppercase">
                POLANCO
              </div>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <button
              onClick={handleNotificationClick}
              type="button"
              className="relative p-2.5 rounded-xl text-slate-600 hover:text-[#6D3FE7] hover:bg-[#F0EAFF]/50 focus:outline-none focus:ring-2 focus:ring-[#6D3FE7]/20 transition-colors"
              aria-label="View my notifications"
              title="My Notifications"
            >
              <Bell className="w-5 h-5" />

              {/* Notification indicator */}
              <span
                className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#6D3FE7] ring-2 ring-white"
                aria-hidden="true"
              />
            </button>

            {/* Mobile Sidebar Button */}
            <button
              onClick={onToggleMobileSidebar}
              type="button"
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileSidebarOpen ? (
                <X className="w-6 h-6 text-[#6D3FE7]" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

