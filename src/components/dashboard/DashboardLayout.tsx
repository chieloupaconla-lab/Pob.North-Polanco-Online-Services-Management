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
    <div className="flex min-h-screen min-w-0 bg-[#F7F8FC]">
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
          <div className="mx-auto min-w-0 max-w-7xl px-3 py-5 sm:px-6 sm:py-6 lg:px-8">
            {children}
            <DashboardFooter />
          </div>
        </main>
      </div>
    </div>
  );
}
