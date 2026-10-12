export type ComplaintStatus =
  | "Pending"
  | "Under Review"
  | "For Action"
  | "In Progress"
  | "Resolved";

export type SubmissionType = "Anonymous" | "Provide My Name";

import type { OfficialComplaintCategory } from "@/config/complaintCategories";

export type ComplaintCategory =
  | OfficialComplaintCategory
  // Retained so historical local records remain readable.
  | "Community Concern"
  | "Damaged Public Facility"
  | "Road or Drainage Problem"
  | "Streetlight Problem"
  | "Public Safety Concern"
  | "Other";

export interface ComplaintRequest {
  id: string;
  submissionType: SubmissionType;
  fullName?: string;
  email?: string;
  category: ComplaintCategory;
  customConcern?: string;
  description: string;
  location: string;
  status: ComplaintStatus;
  adminNotes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ComplaintFormData {
  submissionType: SubmissionType;
  fullName: string;
  category: ComplaintCategory;
  customConcern?: string;
  description: string;
  location: string;
}
