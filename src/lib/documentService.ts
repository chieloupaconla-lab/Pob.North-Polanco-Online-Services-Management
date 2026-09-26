import { DocumentRequest, DocumentType, DocumentStatus } from "@/types/documents";

const STORAGE_KEY = "barangay-document-requests";

const DOCUMENT_TYPES: DocumentType[] = [
  "Barangay Clearance",
  "Barangay Certificate",
  "Certificate of Residency",
  "Certificate of Indigency",
  "Other Barangay Document",
];

function generateId(): string {
  return `DOC-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

function formatDate(date: Date): string {
  return date.toISOString();
}

function now(): Date {
  return new Date();
}

function getRequests(): DocumentRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DocumentRequest[];
      return parsed.map((r) => ({
        ...r,
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt),
        completedAt: r.completedAt ? new Date(r.completedAt) : undefined,
      }));
    }
  } catch {
    // ignore
  }
  return [];
}

function saveRequests(requests: DocumentRequest[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

function seedData(): void {
  const existing = getRequests();
  if (existing.length > 0) return;

  const seed: DocumentRequest[] = [
    {
      id: generateId(),
      fullName: "Maria Santos",
      purokStreet: "Purok 3, Mabini Street",
      documentType: "Barangay Clearance",
      purpose: "Employment application",
      status: "Pending",
      adminNotes: "",
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: generateId(),
      fullName: "Juan Dela Cruz",
      purokStreet: "Purok 1, Rizal Avenue",
      documentType: "Certificate of Residency",
      purpose: "School enrollment",
      status: "Pending",
      adminNotes: "",
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: generateId(),
      fullName: "Pedro Reyes",
      purokStreet: "Purok 5, Bonifacio Street",
      documentType: "Barangay Certificate",
      purpose: "Business permit",
      status: "Under Review",
      adminNotes: "Waiting for verification.",
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: generateId(),
      fullName: "Ana Reyes",
      purokStreet: "Purok 2, Aguinaldo Street",
      documentType: "Certificate of Indigency",
      purpose: "Financial assistance",
      status: "Approved",
      adminNotes: "Verified and approved.",
      createdAt: now(),
      updatedAt: now(),
      completedAt: now(),
    },
    {
      id: generateId(),
      fullName: "Jose Rizal",
      purokStreet: "Purok 4, Mabini Street",
      documentType: "Other Barangay Document",
      purpose: "General certification",
      status: "Rejected",
      adminNotes: "Insufficient proof of residency.",
      createdAt: now(),
      updatedAt: now(),
    },
  ];

  saveRequests(seed);
}

export async function getDocumentRequests(): Promise<DocumentRequest[]> {
  seedData();
  await new Promise((resolve) => setTimeout(resolve, 300));
  return getRequests().sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}

export async function getDocumentRequestById(
  id: string
): Promise<DocumentRequest | null> {
  const requests = getRequests();
  return requests.find((r) => r.id === id) || null;
}

export async function createDocumentRequest(
  data: Omit<DocumentRequest, "id" | "status" | "adminNotes" | "createdAt" | "updatedAt" | "completedAt">
): Promise<DocumentRequest> {
  const request: DocumentRequest = {
    ...data,
    id: generateId(),
    status: "Pending",
    adminNotes: "",
    createdAt: now(),
    updatedAt: now(),
  };
  const requests = getRequests();
  requests.unshift(request);
  saveRequests(requests);
  return request;
}

export async function updateDocumentStatus(
  id: string,
  status: DocumentStatus,
  adminNotes?: string,
  completedAt?: Date
): Promise<DocumentRequest> {
  const requests = getRequests();
  const index = requests.findIndex((r) => r.id === id);
  if (index === -1) throw new Error("Document request not found");

  requests[index] = {
    ...requests[index],
    status,
    adminNotes: adminNotes ?? requests[index].adminNotes,
    updatedAt: now(),
    completedAt: completedAt ?? requests[index].completedAt,
  };
  saveRequests(requests);
  return requests[index];
}

export async function updateAdminNotes(
  id: string,
  adminNotes: string
): Promise<DocumentRequest> {
  const requests = getRequests();
  const index = requests.findIndex((r) => r.id === id);
  if (index === -1) throw new Error("Document request not found");

  requests[index] = {
    ...requests[index],
    adminNotes,
    updatedAt: now(),
  };
  saveRequests(requests);
  return requests[index];
}

export { DOCUMENT_TYPES };
