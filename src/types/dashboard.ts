export type RequestStatus =
  | "For Signature"
  | "Processing"
  | "Ready for Pickup"
  | "Approved"
  | "Under Review"
  | "Pending"
  | "Completed"
  | "Rejected";

export interface ServiceRequestItem {
  id: string;
  requestNo: string;
  serviceName: string;
  category: "Document" | "Equipment" | "Issue Report";
  status: RequestStatus;
  dateRequested: string;
  purok?: string;
  details?: string;
  lastUpdated?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  timestamp: string;
  type: "success" | "info" | "warning" | "danger" | "purple";
  read: boolean;
}

export interface QuickLinkItem {
  id: string;
  title: string;
  iconName: "directory" | "programs" | "equipment" | "faqs";
  href: string;
}

export interface ServiceCardItem {
  id: string;
  title: string;
  description: string;
  iconName: "document" | "status" | "complaint" | "asset";
  accentColor: "purple" | "blue" | "red" | "emerald";
  href: string;
}
