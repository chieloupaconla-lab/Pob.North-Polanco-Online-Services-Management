import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export type InventoryStatus =
  | "Available"
  | "Low Stock"
  | "Out of Stock"
  | "Unavailable";

export type EquipmentInventory = {
  id: string;

  name: string;
  category: string;

  totalQuantity: number;
  availableQuantity: number;
  borrowedQuantity: number;
  damagedQuantity: number;
  lostQuantity: number;

  unit: string;
  description: string;

  status: InventoryStatus;

  createdAt?: unknown;
  updatedAt?: unknown;
  archived?: boolean;
};

const inventoryCollection = collection(
  db,
  "equipmentInventory"
);

export function getInventoryStatus(
  availableQuantity: number,
  totalQuantity: number
): InventoryStatus {
  if (totalQuantity <= 0) {
    return "Out of Stock";
  }

  if (availableQuantity <= 0) {
    return "Out of Stock";
  }

  const lowStockThreshold = Math.max(
    1,
    Math.ceil(totalQuantity * 0.2)
  );

  if (availableQuantity <= lowStockThreshold) {
    return "Low Stock";
  }

  return "Available";
}

/* ================================
   GET ALL INVENTORY
================================ */

export async function getEquipmentInventory(): Promise<
  EquipmentInventory[]
> {
  const q = query(
    inventoryCollection,
    orderBy("name", "asc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...(item.data() as Omit<
      EquipmentInventory,
      "id"
    >),
  }));
}

/* ================================
   GET AVAILABLE INVENTORY
================================ */

export async function getAvailableEquipmentInventory(): Promise<
  EquipmentInventory[]
> {
  const q = query(
    inventoryCollection,
    where("availableQuantity", ">", 0),
    orderBy("availableQuantity", "asc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs
    .filter((item) => item.data().archived !== true)
    .map((item) => ({
      id: item.id,
      ...(item.data() as Omit<EquipmentInventory, "id">),
    }));
}

/* ================================
   ADD INVENTORY
================================ */

export async function addEquipmentInventory(data: {
  name: string;
  category: string;
  totalQuantity: number;
  availableQuantity: number;
  borrowedQuantity: number;
  damagedQuantity: number;
  lostQuantity: number;
  unit: string;
  description: string;
  status: InventoryStatus;
}) {
  const docRef = await addDoc(
    inventoryCollection,
    {
      name: data.name,
      category: data.category,

      totalQuantity: data.totalQuantity,
      availableQuantity: data.availableQuantity,
      borrowedQuantity: data.borrowedQuantity,
      damagedQuantity: data.damagedQuantity,
      lostQuantity: data.lostQuantity,

      unit: data.unit,
      description: data.description,

      status: data.status,

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
  );

  return docRef.id;
}

/* ================================
   UPDATE INVENTORY
================================ */

export async function updateEquipmentInventory(
  id: string,
  data: {
    name?: string;
    category?: string;
    totalQuantity?: number;
    availableQuantity?: number;
    borrowedQuantity?: number;
    damagedQuantity?: number;
    lostQuantity?: number;
    unit?: string;
    description?: string;
    status?: InventoryStatus;
  }
) {
  const itemRef = doc(
    db,
    "equipmentInventory",
    id
  );

  await updateDoc(itemRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/* ================================
   RELEASE EQUIPMENT
================================ */

export async function releaseEquipmentFromInventory(
  inventoryId: string,
  quantity: number
) {
  if (quantity <= 0) {
    throw new Error(
      "Quantity must be greater than zero."
    );
  }

  const itemRef = doc(
    db,
    "equipmentInventory",
    inventoryId
  );

  const snapshot = await getDocs(
    query(
      inventoryCollection,
      where("__name__", "==", inventoryId)
    )
  );

  if (snapshot.empty) {
    throw new Error(
      "Equipment inventory item not found."
    );
  }

  const item = snapshot.docs[0].data() as EquipmentInventory;

  if (item.availableQuantity < quantity) {
    throw new Error(
      `Only ${item.availableQuantity} ${item.unit} available.`
    );
  }

  const newAvailable =
    item.availableQuantity - quantity;

  const newBorrowed =
    item.borrowedQuantity + quantity;

  await updateDoc(itemRef, {
    availableQuantity: newAvailable,
    borrowedQuantity: newBorrowed,
    status: getInventoryStatus(
      newAvailable,
      item.totalQuantity
    ),
    updatedAt: serverTimestamp(),
  });
}

/* ================================
   RETURN EQUIPMENT
================================ */

export async function returnEquipmentToInventory(
  inventoryId: string,
  quantity: number,
  condition: "Good" | "Damaged" | "Lost"
) {
  if (quantity <= 0) {
    throw new Error(
      "Quantity must be greater than zero."
    );
  }

  const itemRef = doc(
    db,
    "equipmentInventory",
    inventoryId
  );

  const snapshot = await getDocs(
    query(
      inventoryCollection,
      where("__name__", "==", inventoryId)
    )
  );

  if (snapshot.empty) {
    throw new Error(
      "Equipment inventory item not found."
    );
  }

  const item = snapshot.docs[0].data() as EquipmentInventory;

  if (item.borrowedQuantity < quantity) {
    throw new Error(
      `Cannot return ${quantity}. Only ${item.borrowedQuantity} currently borrowed.`
    );
  }

  const newBorrowed =
    item.borrowedQuantity - quantity;

  let newAvailable =
    item.availableQuantity;

  let newDamaged =
    item.damagedQuantity;

  let newLost =
    item.lostQuantity;

  if (condition === "Good") {
    newAvailable += quantity;
  }

  if (condition === "Damaged") {
    newDamaged += quantity;
  }

  if (condition === "Lost") {
    newLost += quantity;
  }

  await updateDoc(itemRef, {
    availableQuantity: newAvailable,
    borrowedQuantity: newBorrowed,
    damagedQuantity: newDamaged,
    lostQuantity: newLost,

    status: getInventoryStatus(
      newAvailable,
      item.totalQuantity
    ),

    updatedAt: serverTimestamp(),
  });
}
