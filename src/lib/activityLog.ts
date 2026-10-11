import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export type ActivityActorType =
  | "resident"
  | "admin"
  | "system";

export type ActivityReferenceType =
  | "document"
  | "complaint"
  | "asset"
  | "return"
  | "system";

export type ActivityCategory =
  | "Documents"
  | "Complaints"
  | "Equipment"
  | "Residents"
  | "Admin"
  | "System";

export type LogActivityInput = {
  action: string;
  category: ActivityCategory;
  description: string;
  actorType: ActivityActorType;
  actorName?: string;
  actorId?: string;
  referenceId?: string;
  referenceType?: ActivityReferenceType;
  status?: string;
  metadata?: Record<string, unknown>;
};

export async function logActivity(
  input: LogActivityInput
): Promise<string | null> {
  try {
    const activity = {
      action: input.action,
      category: input.category,
      description: input.description,
      actorType: input.actorType,
      ...(input.actorName
        ? { actorName: input.actorName }
        : {}),
      ...(input.actorId
        ? { actorId: input.actorId }
        : {}),
      ...(input.referenceId
        ? { referenceId: input.referenceId }
        : {}),
      ...(input.referenceType
        ? { referenceType: input.referenceType }
        : {}),
      ...(input.status
        ? { status: input.status }
        : {}),
      ...(input.metadata
        ? { metadata: input.metadata }
        : {}),
      createdAt: serverTimestamp(),
    };

    const activityRef = await addDoc(
      collection(db, "activityLogs"),
      activity
    );

    return activityRef.id;
  } catch (error) {
    // Auditing must not prevent the request itself from succeeding.
    console.error("Activity log write failed:", error);
    return null;
  }
}
