export type ComplaintStatus =
  | "Pending"
  | "Under Review"
  | "For Action"
  | "In Progress"
  | "Resolved";

export type SubmissionType = "Anonymous" | "Provide My Name";

export type ComplaintCategory = "Community Concern";

export interface ComplaintRequest {
  id: string;
  submissionType: SubmissionType;
  fullName?: string;
  category: ComplaintCategory;
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
  description: string;
  location: string;
}
