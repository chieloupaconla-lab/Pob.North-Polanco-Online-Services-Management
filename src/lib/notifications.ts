import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export type AdminNotificationType =
  | "document"
  | "complaint"
  | "equipment"
  | "proof"
  | "system";

export type CreateAdminNotificationInput = {
  title: string;
  message: string;
  type: AdminNotificationType;
  referenceId?: string;
  referenceType?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
};

export type AdminNotification =
  CreateAdminNotificationInput & {
    id: string;
    recipientType: "admin";
    recipientId?: string;
    read: boolean;
    createdAt: import("firebase/firestore").Timestamp | null;
  };

export async function createAdminNotification(
  input: CreateAdminNotificationInput
): Promise<string | null> {
  try {
    const notification = {
      title: input.title,
      message: input.message,
      type: input.type,
      recipientType: "admin" as const,
      read: false,
      ...(input.referenceId
        ? { referenceId: input.referenceId }
        : {}),
      ...(input.referenceType
        ? { referenceType: input.referenceType }
        : {}),
      ...(input.actionUrl
        ? { actionUrl: input.actionUrl }
        : {}),
      ...(input.metadata
        ? { metadata: input.metadata }
        : {}),
      createdAt: serverTimestamp(),
    };

    const notificationRef = await addDoc(
      collection(db, "notifications"),
      notification
    );

    return notificationRef.id;
  } catch (error) {
    // Notification failure must not fail the primary request operation.
    console.error(
      "Admin notification write failed:",
      error
    );
    return null;
  }
}
