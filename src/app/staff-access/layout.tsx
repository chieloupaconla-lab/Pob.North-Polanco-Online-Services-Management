import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staff Access",
  robots: { index: false, follow: false },
};

export default function StaffAccessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
