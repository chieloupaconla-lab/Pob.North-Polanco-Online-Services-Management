import React from "react";
import type { Metadata } from "next";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ResidentDashboard from "@/components/dashboard/ResidentDashboard";

export const metadata: Metadata = {
  title: "Resident Dashboard | Barangay Poblacion North",
  description:
    "Resident dashboard for Barangay Poblacion North, Polanco. Request documents, Complaints, borrow equipment, and track your service requests.",
};

export default function DashboardPage() {
  return (
    <DashboardLayout activeItemId="dashboard">
      <ResidentDashboard />
    </DashboardLayout>
  );
}
