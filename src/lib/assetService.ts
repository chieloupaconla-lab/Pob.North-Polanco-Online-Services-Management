import {
  AssetBorrowRequest,
  AssetBorrowFormData,
  AssetStatus,
} from "@/types/assets";

const STORAGE_KEY = "barangay-asset-borrowings";

function generateId(): string {
  return `AST-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

function now(): Date {
  return new Date();
}

function getBorrowings(): AssetBorrowRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AssetBorrowRequest[];
      return parsed.map((r) => ({
        ...r,
        borrowDate: new Date(r.borrowDate),
        expectedReturnDate: new Date(r.expectedReturnDate),
        actualReturnDate: r.actualReturnDate
          ? new Date(r.actualReturnDate)
          : undefined,
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt),
      }));
    }
  } catch {
    // ignore
  }
  return [];
}

function saveBorrowings(borrowings: AssetBorrowRequest[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(borrowings));
}

function seedData(): void {
  const existing = getBorrowings();
  if (existing.length > 0) return;

  const seed: AssetBorrowRequest[] = [
    {
      id: generateId(),
      borrowerName: "Juan Dela Cruz",
      borrowerContact: "09123456789",
      borrowerPurok: "Purok 3, Mabini Street",
      asset: "Chairs",
      quantity: 10,
      purpose: "Family gathering",
      borrowDate: new Date(),
      expectedReturnDate: new Date(Date.now() + 3 * 86400000),
      witnessName: "Maria Dela Cruz",
      witnessRelationship: "Spouse",
      witnessContact: "09987654321",
      status: "Pending",
      adminNotes: "",
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: generateId(),
      borrowerName: "Ana Reyes",
      borrowerContact: "09198765432",
      borrowerPurok: "Purok 1, Rizal Avenue",
      asset: "Tents",
      quantity: 2,
      purpose: "Community meeting",
      borrowDate: new Date(Date.now() - 2 * 86400000),
      expectedReturnDate: new Date(Date.now() + 1 * 86400000),
      witnessName: "Jose Rizal",
      witnessRelationship: "Neighbor",
      witnessContact: "09567890123",
      status: "Under Review",
      adminNotes: "Awaiting approval.",
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: generateId(),
      borrowerName: "Pedro Santos",
      borrowerContact: "09156789012",
      borrowerPurok: "Purok 5, Bonifacio Street",
      asset: "Sound System",
      quantity: 1,
      purpose: "Barangay event",
      borrowDate: new Date(Date.now() - 5 * 86400000),
      expectedReturnDate: new Date(Date.now() - 2 * 86400000),
      witnessName: "Maria Santos",
      witnessRelationship: "Sibling",
      witnessContact: "09345678901",
      status: "Released",
      adminNotes: "Overdue - not yet returned.",
      createdAt: now(),
      updatedAt: now(),
    },
  ];

  saveBorrowings(seed);
}

export async function getBorrowings(): Promise<AssetBorrowRequest[]> {
  seedData();
  await new Promise((resolve) => setTimeout(resolve, 300));
  return getBorrowings().sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}

export async function getBorrowingById(
  id: string
): Promise<AssetBorrowRequest | null> {
  const borrowings = getBorrowings();
  return borrowings.find((r) => r.id === id) || null;
}

export async function createBorrowing(
  data: AssetBorrowFormData
): Promise<AssetBorrowRequest> {
  const borrowing: AssetBorrowRequest = {
    ...data,
    id: generateId(),
    status: "Pending",
    adminNotes: "",
    borrowDate: new Date(data.borrowDate),
    expectedReturnDate: new Date(data.expectedReturnDate),
    createdAt: now(),
    updatedAt: now(),
  };
  const borrowings = getBorrowings();
  borrowings.unshift(borrowing);
  saveBorrowings(borrowings);
  return borrowing;
}

export async function updateBorrowingStatus(
  id: string,
  status: AssetStatus,
  adminNotes?: string
): Promise<AssetBorrowRequest> {
  const borrowings = getBorrowings();
  const index = borrowings.findIndex((r) => r.id === id);
  if (index === -1) throw new Error("Borrowing request not found");

  borrowings[index] = {
    ...borrowings[index],
    status,
    adminNotes: adminNotes ?? borrowings[index].adminNotes,
    updatedAt: now(),
  };
  saveBorrowings(borrowings);
  return borrowings[index];
}

export async function updateBorrowingReturnInfo(
  id: string,
  data: {
    actualReturnDate?: Date;
    returnCondition?: string;
    damageDetails?: string;
    lossDetails?: string;
    penalty?: number;
  }
): Promise<AssetBorrowRequest> {
  const borrowings = getBorrowings();
  const index = borrowings.findIndex((r) => r.id === id);
  if (index === -1) throw new Error("Borrowing request not found");

  borrowings[index] = {
    ...borrowings[index],
    actualReturnDate: data.actualReturnDate,
    returnCondition: data.returnCondition,
    damageDetails: data.damageDetails,
    lossDetails: data.lossDetails,
    penalty: data.penalty,
    updatedAt: now(),
  };
  saveBorrowings(borrowings);
  return borrowings[index];
}

export { STORAGE_KEY };
