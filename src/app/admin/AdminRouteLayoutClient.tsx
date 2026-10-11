"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminAuthGuard from "@/components/admin/AdminAuthGuard";

export default function AdminRouteLayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = [
    "/admin/login",
    "/admin/forgot-password",
    "/admin/reset-password",
    "/admin/signup",
  ].includes(pathname);

  return isAuthPage ? children : <AdminAuthGuard><AdminLayout>{children}</AdminLayout></AdminAuthGuard>;
}
