import React from "react";
import type { Metadata } from "next";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageHeading from "@/components/dashboard/PageHeading";
import ReportIssueForm from "@/components/dashboard/ReportIssueForm";

export const metadata: Metadata = {
  title: "Report an Issue | Barangay Poblacion North",
  description:
    "Report barangay facility and infrastructure concerns such as damaged streetlights, clogged drainage, and road hazards.",
};

export default function ReportIssuePage() {
  return (
    <DashboardLayout activeItemId="submit-complaint">
      <div className="space-y-5 sm:space-y-6">
        <PageHeading
          breadcrumb="Report an Issue"
          title="Report a Barangay Issue"
          description="Your concerns matter. Complaints or infrastructure problems so barangay personnel can respond quickly."
        />
        <ReportIssueForm />
      </div>
    </DashboardLayout>
  );
}