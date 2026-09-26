export type AssetStatus =
  | "Pending"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "Released"
  | "Returned"
  | "Overdue"
  | "Damaged"
  | "Lost";

export type AssetType =
  | "Chairs"
  | "Tables"
  | "Tents"
  | "Sound System"
  | "Other Barangay-Owned Asset";

export interface AssetBorrowRequest {
  id: string;
  borrowerName: string;
  borrowerContact: string;
  borrowerPurok: string;
  asset: AssetType;
  quantity: number;
  purpose: string;
  borrowDate: Date;
  expectedReturnDate: Date;
  actualReturnDate?: Date;
  witnessName: string;
  witnessRelationship: string;
  witnessContact: string;
  returnCondition?: string;
  damageDetails?: string;
  lossDetails?: string;
  penalty?: number;
  status: AssetStatus;
  adminNotes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetBorrowFormData {
  borrowerName: string;
  borrowerContact: string;
  borrowerPurok: string;
  asset: AssetType;
  quantity: number;
  purpose: string;
  borrowDate: Date;
  expectedReturnDate: Date;
  witnessName: string;
  witnessRelationship: string;
  witnessContact: string;
}
