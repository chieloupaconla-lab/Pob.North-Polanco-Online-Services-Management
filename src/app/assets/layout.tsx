import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Barangay Equipment Borrowing",
  description: "Request barangay-owned equipment borrowing services from Barangay Poblacion North, Polanco, Zamboanga del Norte.",
  alternates: { canonical: "/assets" },
};

export default function AssetsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
