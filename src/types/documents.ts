export type DocumentStatus = "Pending" | "Under Review" | "Approved" | "Rejected" | "Completed";

export type DocumentType = string;

export interface DocumentRequest {
  id: string;
  fullName: string;
  email?: string;
  purok: string;
  documentType: DocumentType;
  purpose: string;
  status: DocumentStatus;
  adminNotes: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface DocumentRequestFormData {
  fullName: string;
  purok: string;
  documentType: DocumentType;
  purpose: string;
}
