import React from "react";
import type { Metadata } from "next";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageHeading from "@/components/dashboard/PageHeading";
import RequestDocumentForm from "@/components/dashboard/RequestDocumentForm";

export const metadata: Metadata = {
  title: "Request Document | Barangay Poblacion North",
  description:
    "Request barangay documents online including Cedula, Barangay Clearance, Certificate of Residency, and more.",
};

export default function RequestDocumentPage() {
  return (
    <DashboardLayout activeItemId="request-document">
      <div className="space-y-5 sm:space-y-6">
        <PageHeading
          breadcrumb="Request Document"
          title="Request a Document"
          description="Apply for Cedula, Barangay Clearance, Certificate of Residency, and other official barangay documents online."
        />
        <RequestDocumentForm />
      </div>
    </DashboardLayout>
  );
}