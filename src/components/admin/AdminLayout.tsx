"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import AdminSidebar, { AdminSidebarNavItemId } from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

interface AdminLayoutProps {
  children: React.ReactNode;
  activeItemId?: AdminSidebarNavItemId;
}

export default function AdminLayout({
  children,
  activeItemId = "dashboard",
}: AdminLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  const inferredActiveItem: AdminSidebarNavItemId = pathname.startsWith("/admin/residents")
    ? "residents"
    : pathname.startsWith("/admin/documents")
      ? "documents"
      : pathname.startsWith("/admin/complaints")
        ? "complaints"
        : pathname.startsWith("/admin/assets")
          ? "assets"
          : activeItemId;

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
      <AdminSidebar
        activeItemId={inferredActiveItem}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <AdminHeader
          mobileSidebarOpen={mobileSidebarOpen}
          onToggleMobileSidebar={() => setMobileSidebarOpen((prev) => !prev)}
          pathname={pathname}
        />

        <main className="flex-1 min-w-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
