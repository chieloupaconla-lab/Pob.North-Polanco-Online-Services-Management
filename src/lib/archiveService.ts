import {
  deleteField,
  doc,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";

export type ArchiveSource =
  | "documents"
  | "complaints"
  | "assets"
  | "residents"
  | "equipmentInventory";

function getAdminName() {
  const user = auth.currentUser;
  if (user?.displayName?.trim()) return user.displayName.trim();

  const localPart = user?.email?.split("@")[0] || "Administrator";
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function archiveRecord(
  source: ArchiveSource,
  recordId: string
) {
  const user = auth.currentUser;
  if (!user) throw new Error("An authenticated administrator is required.");

  await updateDoc(doc(db, source, recordId), {
    archived: true,
    archivedAt: serverTimestamp(),
    archivedBy: {
      uid: user.uid,
      name: getAdminName(),
      email: user.email || "",
    },
  });
}

export async function archiveRecords(
  source: ArchiveSource,
  recordIds: string[]
) {
  const user = auth.currentUser;
  if (!user) throw new Error("An authenticated administrator is required.");
  if (recordIds.length === 0) return;

  const batch = writeBatch(db);
  const archiveData = {
    archived: true,
    archivedAt: serverTimestamp(),
    archivedBy: {
      uid: user.uid,
      name: getAdminName(),
      email: user.email || "",
    },
  };
  recordIds.forEach((recordId) => {
    batch.update(doc(db, source, recordId), archiveData);
  });
  await batch.commit();
}

export async function restoreRecord(
  source: ArchiveSource,
  recordId: string
) {
  await updateDoc(doc(db, source, recordId), {
    archived: false,
    archivedAt: deleteField(),
    archivedBy: deleteField(),
  });
}
