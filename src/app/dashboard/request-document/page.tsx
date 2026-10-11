import React from "react";
import type { Metadata } from "next";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageHeading from "@/components/dashboard/PageHeading";
import RequestDocumentForm from "@/components/dashboard/RequestDocumentForm";

export const metadata: Metadata = {
  title: "Request Document | Barangay Poblacion North",
  description:
    "Request Barangay Clearance, Certificate of Residency, Barangay Business Clearance, and Community Tax Certificate (Cedula) online.",
};

export default function RequestDocumentPage() {
  return (
    <DashboardLayout activeItemId="request-document">
      <div className="space-y-5 sm:space-y-6">
        <PageHeading
          breadcrumb="Request Document"
          title="Request a Document"
          description="Apply for Barangay Clearance, Certificate of Residency, Barangay Business Clearance, and Community Tax Certificate (Cedula) online."
        />
        <RequestDocumentForm />
      </div>
    </DashboardLayout>
  );
}
