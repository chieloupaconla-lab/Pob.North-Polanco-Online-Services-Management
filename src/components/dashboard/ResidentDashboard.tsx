"use client";

import React, { useState } from "react";
import WelcomeBanner from "./WelcomeBanner";
import ServiceCard from "./ServiceCard";
import RecentRequests from "./RecentRequests";
import NotificationsPanel from "./NotificationsPanel";
import QuickLinks from "./QuickLinks";
import DashboardCTA from "./DashboardCTA";
import RequestDetailModal from "./RequestDetailModal";
import { ServiceRequestItem } from "@/types/dashboard";
import {
  SERVICE_CARDS_DATA,
  RECENT_REQUESTS_DATA,
  NOTIFICATIONS_DATA,
  QUICK_LINKS_DATA,
} from "@/data/dashboardData";

export default function ResidentDashboard() {
  const [selectedRequest, setSelectedRequest] =
    useState<ServiceRequestItem | null>(null);

  return (
    <div className="space-y-5 sm:space-y-6">
      <WelcomeBanner />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 sm:gap-6">
        <div className="xl:col-span-2 space-y-5 sm:space-y-6 min-w-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {SERVICE_CARDS_DATA.map((card) => (
              <ServiceCard key={card.id} card={card} />
            ))}
          </div>

          <RecentRequests
            requests={RECENT_REQUESTS_DATA}
            onSelectRequest={(request) => setSelectedRequest(request)}
          />

          <DashboardCTA />
        </div>

        <div className="space-y-5 sm:space-y-6 min-w-0">
          <NotificationsPanel
            notifications={NOTIFICATIONS_DATA}
          />
          <QuickLinks links={QUICK_LINKS_DATA} />
        </div>
      </div>

      <RequestDetailModal
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
      />
    </div>
  );
}
