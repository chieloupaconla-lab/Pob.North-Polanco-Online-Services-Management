"use client";

import React, { useEffect, useState } from "react";
import Sidebar, { SidebarNavItemId } from "./Sidebar";
import TopHeader from "./TopHeader";
import DashboardFooter from "./DashboardFooter";

interface DashboardLayoutProps {
  activeItemId?: SidebarNavItemId;
  children: React.ReactNode;
}

export default function DashboardLayout({
  activeItemId = "dashboard",
  children,
}: DashboardLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileSidebarOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = "";
    };
  }, [mobileSidebarOpen]);

  return (
    <div className="min-h-screen bg-[#F7F8FC] flex">
      {/* Sidebar */}
      <Sidebar
        activeItemId={activeItemId}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <TopHeader
          mobileSidebarOpen={mobileSidebarOpen}
          onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
        />

        <main className="flex-1 min-w-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
            {children}
            <DashboardFooter />
          </div>
        </main>
      </div>
    </div>
  );
}
