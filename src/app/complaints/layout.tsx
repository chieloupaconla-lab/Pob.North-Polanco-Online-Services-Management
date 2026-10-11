import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Report Public Facility Concerns",
  description: "Report public facility and infrastructure concerns to Barangay Poblacion North, Polanco, Zamboanga del Norte.",
  alternates: { canonical: "/complaints" },
};

export default function ComplaintsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
