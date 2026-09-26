export const SERVICE_CARDS_DATA = [
  {
    id: "documents",
    title: "Online Document Requests",
    description: "Request official barangay documents online.",
    iconName: "document",
    accentColor: "indigo",
    href: "/documents",
  },
  {
    id: "complaints",
    title: "Complaint Management",
    description: "Submit and monitor community concerns.",
    iconName: "complaint",
    accentColor: "rose",
    href: "/complaints",
  },
  {
    id: "assets",
    title: "Asset Borrowing and Returning",
    description: "Request barangay-owned equipment and track returns.",
    iconName: "asset",
    accentColor: "violet",
    href: "/assets",
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Check the progress of your requests and submissions.",
    iconName: "status",
    accentColor: "amber",
    href: "/notifications",
  },
] as any[];

export const NOTIFICATIONS_DATA = [
  {
    id: "request-status",
    title: "Request Status",
    message:
      "Check the latest progress of your barangay service requests.",
    timestamp: "View updates",
    read: true,
    type: "info",
    href: "/notifications",
  },
] as any[];

export const QUICK_LINKS_DATA = [
  {
    id: "directory",
    title: "Barangay Directory",
    description: "View barangay contact information",
    href: "/",
    iconName: "directory",
  },
  {
    id: "programs",
    title: "Barangay Programs",
    description: "Explore available barangay programs",
    href: "/",
    iconName: "programs",
  },
  {
    id: "equipment",
    title: "Asset Borrowing",
    description: "Borrow barangay-owned equipment",
    href: "/assets",
    iconName: "equipment",
  },
  {
    id: "faqs",
    title: "FAQs",
    description: "Find answers to common questions",
    href: "/",
    iconName: "faqs",
  },
] as any[];

export const RECENT_REQUESTS_DATA = [] as any[];