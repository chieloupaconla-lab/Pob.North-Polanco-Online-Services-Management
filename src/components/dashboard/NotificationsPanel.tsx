import React from "react";
import { Check, Info, Clock, AlertTriangle, FileCheck } from "lucide-react";
import { NotificationItem } from "@/types/dashboard";

interface NotificationsPanelProps {
  notifications: NotificationItem[];
  onViewAll?: () => void;
  onSelectNotification?: (notification: NotificationItem) => void;
}

export default function NotificationsPanel({
  notifications,
  onViewAll,
  onSelectNotification,
}: NotificationsPanelProps) {
  const getNotificationIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "success":
        return {
          icon: Check,
          bgStyle: "bg-emerald-50 text-[#35B978]",
        };
      case "info":
        return {
          icon: Info,
          bgStyle: "bg-blue-50 text-[#4D8FEA]",
        };
      case "warning":
        return {
          icon: Clock,
          bgStyle: "bg-amber-50 text-[#E9B949]",
        };
      case "danger":
        return {
          icon: AlertTriangle,
          bgStyle: "bg-red-50 text-[#E96B73]",
        };
      case "purple":
        return {
          icon: FileCheck,
          bgStyle: "bg-[#F0EAFF] text-[#6D3FE7]",
        };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[#17213A] tracking-tight">
            Announcements
          </h2>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-xs font-semibold text-[#6D3FE7] hover:text-purple-800 transition-colors"
          >
            View All
          </button>
        )}
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100">
        {notifications.map((item) => {
          const { icon: Icon, bgStyle } = getNotificationIcon(item.type);

          return (
            <div
              key={item.id}
              onClick={() => onSelectNotification && onSelectNotification(item)}
              className="py-3 first:pt-0 last:pb-0 flex items-start gap-3.5 group cursor-pointer hover:bg-slate-50/60 p-1.5 rounded-xl transition-colors"
            >
              {/* Soft Circular Icon Background */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${bgStyle}`}
              >
                <Icon className="w-4 h-4 stroke-[2.2]" />
              </div>

              {/* Title & Timestamp */}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#17213A] group-hover:text-[#6D3FE7] transition-colors leading-snug">
                  {item.title}
                </p>
                <span className="text-[11px] text-[#6B7280] block mt-0.5">
                  {item.timestamp}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
