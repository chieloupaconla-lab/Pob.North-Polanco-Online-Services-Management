import React from "react";
import type { Metadata } from "next";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PageHeading from "@/components/dashboard/PageHeading";
import BorrowEquipmentForm from "@/components/dashboard/BorrowEquipmentForm";

export const metadata: Metadata = {
  title: "Borrow Equipment | Barangay Poblacion North",
  description:
    "Request available barangay equipment such as chairs, tables, tents, and sound systems.",
};

export default function BorrowEquipmentPage() {
  return (
    <DashboardLayout activeItemId="borrow-asset">
      <div className="space-y-5 sm:space-y-6">
        <PageHeading
          breadcrumb="Borrow Equipment"
          title="Borrow Barangay Equipment"
          description="Request available barangay equipment and resources for community events and activities."
        />
        <BorrowEquipmentForm />
      </div>
    </DashboardLayout>
  );
}