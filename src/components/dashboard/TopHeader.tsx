"use client";

import React, { useState } from "react";
import BarangaySealLogo from "./BarangaySealLogo";
import {
  Bell,
  Menu,
  X,
} from "lucide-react";
import { NOTIFICATIONS_DATA } from "@/data/dashboardData";

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
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
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

          <div className="flex items-center gap-3">
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
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#17213A]">Announcements</span>
                    </div>
                    <button
                      onClick={() => setNotificationsOpen(false)}
                      className="text-xs text-[#6D3FE7] font-semibold hover:underline"
                    >
                      Close
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {NOTIFICATIONS_DATA.map((item) => (
                      <div
                        key={item.id}
                        className="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3"
                      >
                        <div className="w-2 h-2 rounded-full bg-[#6D3FE7] mt-1.5 shrink-0" />
                        <div>
                          <p className="text-xs text-slate-800 font-medium leading-snug">
                            {item.title}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {item.timestamp}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

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
