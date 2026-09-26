import {
  ComplaintRequest,
  ComplaintFormData,
  ComplaintStatus,
} from "@/types/complaints";

const STORAGE_KEY = "barangay-complaints";

function generateId(): string {
  return `CMP-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

function now(): Date {
  return new Date();
}

function getComplaints(): ComplaintRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ComplaintRequest[];
      return parsed.map((r) => ({
        ...r,
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt),
      }));
    }
  } catch {
    // ignore
  }
  return [];
}

function saveComplaints(complaints: ComplaintRequest[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
}

function seedData(): void {
  const existing = getComplaints();
  if (existing.length > 0) return;

  const seed: ComplaintRequest[] = [
    {
      id: generateId(),
      submissionType: "Anonymous",
      category: "Community Concern",
      description:
        "Streetlight near the barangay hall has been out for three days. Residents are concerned about safety at night.",
      location: "Purok 3, Mabini Street",
      status: "Pending",
      adminNotes: "",
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: generateId(),
      submissionType: "Provide My Name",
      fullName: "Maria Santos",
      category: "Community Concern",
      description:
        "Drainage along Rizal Avenue is clogged causing flooding during rain.",
      location: "Rizal Avenue, Purok 1",
      status: "Under Review",
      adminNotes: "Assigned for inspection.",
      createdAt: now(),
      updatedAt: now(),
    },
    {
      id: generateId(),
      submissionType: "Provide My Name",
      fullName: "Pedro Reyes",
      category: "Community Concern",
      description:
        "Damaged fence near the barangay playground needs repair.",
      location: "Purok 5, Bonifacio Street",
      status: "Pending",
      adminNotes: "",
      createdAt: now(),
      updatedAt: now(),
    },
  ];

  saveComplaints(seed);
}

export async function getComplaints(): Promise<ComplaintRequest[]> {
  seedData();
  await new Promise((resolve) => setTimeout(resolve, 300));
  return getComplaints().sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}

export async function getComplaintById(
  id: string
): Promise<ComplaintRequest | null> {
  const complaints = getComplaints();
  return complaints.find((r) => r.id === id) || null;
}

export async function createComplaint(
  data: ComplaintFormData
): Promise<ComplaintRequest> {
  const complaint: ComplaintRequest = {
    ...data,
    id: generateId(),
    status: "Pending",
    adminNotes: "",
    createdAt: now(),
    updatedAt: now(),
  };
  const complaints = getComplaints();
  complaints.unshift(complaint);
  saveComplaints(complaints);
  return complaint;
}

export async function updateComplaintStatus(
  id: string,
  status: ComplaintStatus,
  adminNotes?: string
): Promise<ComplaintRequest> {
  const complaints = getComplaints();
  const index = complaints.findIndex((r) => r.id === id);
  if (index === -1) throw new Error("Complaint not found");

  complaints[index] = {
    ...complaints[index],
    status,
    adminNotes: adminNotes ?? complaints[index].adminNotes,
    updatedAt: now(),
  };
  saveComplaints(complaints);
  return complaints[index];
}

export { STORAGE_KEY };
