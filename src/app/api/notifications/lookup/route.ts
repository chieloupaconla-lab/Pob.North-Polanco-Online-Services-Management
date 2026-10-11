import { NextResponse } from "next/server";
import { getAdminServices } from "@/lib/adminAuthorization";
import { getFirebaseFailureDetails } from "@/lib/firebaseErrors";
import { getCanonicalPurok, getStoredPurok, normalizePurokForSearch } from "@/lib/purokConfig";
import { getResidentNameSearchParts, isResidentVerificationReady, matchesResidentNameParts } from "@/lib/residentVerification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function timestamp(value: unknown) {
  return (value as { toDate?: () => Date })?.toDate?.()?.toISOString?.() || null;
}

function requestMatches(data: Record<string, unknown>, residentName: string, purok: string, nameField: string) {
  const requestPurok = getCanonicalPurok(getStoredPurok(data));
  const requestName = typeof data[nameField] === "string" ? data[nameField] : "";
  return requestPurok === purok && (
    matchesResidentNameParts(requestName, residentName) ||
    matchesResidentNameParts(residentName, requestName)
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { fullName?: unknown; purok?: unknown };
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    const purok = typeof body.purok === "string" ? getCanonicalPurok(body.purok) : null;
    if (fullName.split(/[\s,]+/gu).filter(Boolean).length < 2 || !purok) {
      return NextResponse.json({ status: "invalid" }, { status: 400 });
    }

    const { db } = getAdminServices();
    const migration = await db.collection("systemMetadata").doc("residentVerification").get();
    if (!migration.exists || !isResidentVerificationReady(migration.data())) {
      return NextResponse.json({ status: "unavailable", requests: [] }, { status: 503 });
    }
    const { firstName, surname } = getResidentNameSearchParts(fullName);
    const residentSnapshot = await db.collection("residents")
      .where("active", "==", true)
      .where("purokNormalized", "==", normalizePurokForSearch(purok))
      .where("verificationFirstName", "==", firstName)
      .where("verificationSurname", "==", surname)
      .limit(25)
      .get();
    const residents = residentSnapshot.docs.filter((resident) => {
      const data = resident.data();
      return data.archived !== true && getCanonicalPurok(String(data.purok || data.purokStreet || "")) === purok && matchesResidentNameParts(fullName, String(data.fullName || ""));
    });

    if (residents.length !== 1) {
      return NextResponse.json({ status: residents.length > 1 ? "ambiguous" : "not_found", requests: [] });
    }

    const residentName = String(residents[0].data().fullName || "");
    const requests: Array<Record<string, unknown>> = [];
    const [documents, complaints, assets] = await Promise.all([
      db.collection("documents").get(),
      db.collection("complaints").get(),
      db.collection("assets").get(),
    ]);

    documents.docs.forEach((item) => {
      const data = item.data();
      if (!requestMatches(data, residentName, purok, "fullName")) return;
      requests.push({ id: item.id, type: "Document Request", title: data.documentType || "Barangay Document Request", status: data.status || "Pending", createdAt: timestamp(data.createdAt), updatedAt: timestamp(data.updatedAt), details: data.purpose || "No purpose provided.", extraDetails: `Purok: ${getCanonicalPurok(String(data.purok || "")) || purok}` });
    });

    complaints.docs.forEach((item) => {
      const data = item.data();
      if (data.submissionType === "Anonymous" || data.anonymous === true || !requestMatches(data, residentName, purok, "fullName")) return;
      requests.push({ id: item.id, type: "Complaint", title: data.category || "Community Concern", status: data.status || "Pending", createdAt: timestamp(data.createdAt), updatedAt: timestamp(data.updatedAt), details: data.description || "No description provided.", extraDetails: `${data.category === "Others" && data.customConcern ? `Specific concern: ${data.customConcern} · ` : ""}Location: ${data.locationOfConcern || "Not provided"}` });
    });

    assets.docs.forEach((item) => {
      const data = item.data();
      if (!requestMatches(data, residentName, purok, "borrowerName")) return;
      const assetName = data.assetName || "Barangay Equipment";
      const quantity = data.quantity || 1;
      requests.push({ id: `${item.id}-borrow`, type: "Equipment Borrowing", title: assetName, status: data.status || "Pending", createdAt: timestamp(data.createdAt), updatedAt: timestamp(data.updatedAt), details: `Quantity: ${quantity}`, extraDetails: `Borrow Date: ${data.borrowDate || "Not provided"}` });
      const returnStatus = data.status === "Returned" || data.status === "Damaged" || data.status === "Lost" || data.status === "Overdue" ? data.status : "Return Requested";
      if (data.actualReturnDate || data.returnCondition || data.damageDetails || data.lossDetails || data.penalty || ["Returned", "Damaged", "Lost", "Overdue"].includes(String(data.status))) {
        requests.push({ id: `${item.id}-return`, type: "Equipment Returning", title: assetName, status: returnStatus, createdAt: timestamp(data.createdAt), updatedAt: timestamp(data.updatedAt), details: `Quantity: ${quantity}`, extraDetails: data.actualReturnDate ? `Returned: ${data.actualReturnDate}` : "Return information is being processed." });
      }
    });

    requests.sort((left, right) => String(right.updatedAt || right.createdAt || "").localeCompare(String(left.updatedAt || left.createdAt || "")));
    return NextResponse.json({ status: "matched", requests });
  } catch (error) {
    console.error("Resident request lookup failed.", {
      operation: "resident-request-lookup",
      ...getFirebaseFailureDetails(error),
    });
    return NextResponse.json({ status: "error", requests: [] }, { status: 503 });
  }
}
