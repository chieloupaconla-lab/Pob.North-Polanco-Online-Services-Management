import {
  ServiceRequestItem,
  NotificationItem,
  QuickLinkItem,
  ServiceCardItem,
} from "@/types/dashboard";

export const RECENT_REQUESTS_DATA: ServiceRequestItem[] = [];

export const NOTIFICATIONS_DATA: NotificationItem[] = [
  {
    id: "n1",
    title: "Barangay Hall Hours",
    timestamp: "Monday–Friday, 8:00 AM–5:00 PM",
    type: "purple",
    read: false,
  },
  {
    id: "n2",
    title: "Service Reminder",
    timestamp: "Please provide complete and accurate information when submitting a request.",
    type: "info",
    read: false,
  },
  {
    id: "n3",
    title: "Validation Notice",
    timestamp: "All submissions are subject to validation by authorized barangay personnel.",
    type: "warning",
    read: true,
  },
  {
    id: "n4",
    title: "No Login Required",
    timestamp: "Residents can access public services without creating an account.",
    type: "success",
    read: true,
  },
];

export const SERVICE_CARDS_DATA: ServiceCardItem[] = [
  {
    id: "sc1",
    title: "Request Document",
    description: "Apply for official barangay documents online with ease.",
    iconName: "document",
    accentColor: "purple",
    href: "/documents",
  },
  {
    id: "sc2",
    title: "Check Request Status",
    description: "Track the status of your submitted service requests.",
    iconName: "status",
    accentColor: "blue",
    href: "/status",
  },
  {
    id: "sc3",
    title: "Submit Complaint",
    description: "Report barangay facility or infrastructure concerns.",
    iconName: "complaint",
    accentColor: "red",
    href: "/complaints",
  },
  {
    id: "sc4",
    title: "Borrow Barangay Asset",
    description: "Request available barangay equipment and resources.",
    iconName: "asset",
    accentColor: "emerald",
    href: "/assets",
  },
];

export const QUICK_LINKS_DATA: QuickLinkItem[] = [
  {
    id: "ql1",
    title: "Barangay Info",
    iconName: "directory",
    href: "/info",
  },
  {
    id: "ql2",
    title: "FAQs",
    iconName: "faqs",
    href: "/faqs",
  },
  {
    id: "ql3",
    title: "Contact",
    iconName: "equipment",
    href: "/contact",
  },
  {
    id: "ql4",
    title: "Home",
    iconName: "programs",
    href: "/",
  },
];
