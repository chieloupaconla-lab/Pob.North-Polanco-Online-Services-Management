import React from "react";
import type { Metadata } from "next";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageHeading from "@/components/dashboard/PageHeading";
import MyRequestsList from "@/components/dashboard/MyRequestsList";

export const metadata: Metadata = {
  title: "Check Request Status | Barangay Poblacion North",
  description:
    "Track the status of your document requests, equipment borrowing, and reported concerns.",
};

export default function StatusPage() {
  return (
    <DashboardLayout activeItemId="check-status">
      <div className="space-y-5 sm:space-y-6">
        <PageHeading
          breadcrumb="Status"
          title="Check Request Status"
          description="Track the status of your document requests, equipment borrowing, and reported concerns."
        />
        <MyRequestsList />
      </div>
    </DashboardLayout>
  );
}
