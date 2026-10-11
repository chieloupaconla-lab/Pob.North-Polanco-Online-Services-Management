import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Barangay Document Requests",
  description: "Request Barangay Clearance, Certificate of Residency, Barangay Business Clearance, and Community Tax Certificate (Cedula) services online.",
  alternates: { canonical: "/documents" },
};

export default function DocumentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
