import type { Metadata } from "next";
import type { ReactNode } from "react";
import AdminRouteLayoutClient from "./AdminRouteLayoutClient";

export const metadata: Metadata = {
  title: "Admin Portal",
  robots: { index: false, follow: false },
};

export default function AdminRouteLayout({ children }: { children: ReactNode }) {
  return <AdminRouteLayoutClient>{children}</AdminRouteLayoutClient>;
}
