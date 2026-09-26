export type DocumentStatus = "Pending" | "Under Review" | "Approved" | "Rejected" | "Completed";

export type DocumentType =
  | "Barangay Clearance"
  | "Barangay Certificate"
  | "Certificate of Residency"
  | "Certificate of Indigency"
  | "Other Barangay Document";

export interface DocumentRequest {
  id: string;
  fullName: string;
  purokStreet: string;
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
  purokStreet: string;
  documentType: DocumentType;
  purpose: string;
}
