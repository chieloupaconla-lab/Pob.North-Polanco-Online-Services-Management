import { createHash } from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getAdminServices, getBearerToken, verifyAdminTokenDetailed } from "@/lib/adminAuthorization";
import {
  getResidentImportDuplicateKey,
  MAX_RESIDENT_IMPORT_RECORDS,
  MAX_RESIDENT_IMPORT_BYTES,
  validateResidentImportRecords,
  type ResidentImportRecord,
} from "@/lib/residentBulkImport";
import { getStoredPurok, normalizePurokForSearch } from "@/lib/purokConfig";
import { getResidentVerificationFields, normalizeResidentName } from "@/lib/residentVerification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BATCH_SIZE = 400;

type ImportIssue = { rowNumber: number; message: string };

function residentDocumentId(record: ResidentImportRecord) {
  return `bulk-${createHash("sha256").update(getResidentImportDuplicateKey(record.fullName, record.purok)).digest("hex").slice(0, 32)}`;
}

function unauthorizedResponse() {
  return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
}

export async function POST(request: Request) {
  const authorization = await verifyAdminTokenDetailed(getBearerToken(request));
  if (!authorization.admin) return unauthorizedResponse();
  const admin = authorization.admin;

  try {
    const body = await request.json() as { action?: unknown; records?: unknown };
    const action = body.action === "commit" ? "commit" : body.action === "validate" ? "validate" : "";
    if (!action || !Array.isArray(body.records)) {
      return NextResponse.json({ success: false, message: "A valid import action and records are required." }, { status: 400 });
    }
    if (body.records.length > MAX_RESIDENT_IMPORT_RECORDS) {
      return NextResponse.json({ success: false, message: `Import cannot contain more than ${MAX_RESIDENT_IMPORT_RECORDS} residents.` }, { status: 413 });
    }
    if (new TextEncoder().encode(JSON.stringify(body.records)).byteLength > MAX_RESIDENT_IMPORT_BYTES) {
      return NextResponse.json({ success: false, message: "Import payload must be 1 MB or smaller." }, { status: 413 });
    }

    const validation = validateResidentImportRecords(body.records);
    const { db } = getAdminServices();
    const existingSnapshot = await db.collection("residents").get();
    const existingKeys = new Set<string>();
    existingSnapshot.docs.forEach((resident) => {
      const data = resident.data();
      if (typeof data.fullName === "string") {
        existingKeys.add(getResidentImportDuplicateKey(data.fullName, getStoredPurok(data)));
      }
    });

    const skippedDuplicates: ImportIssue[] = [...validation.duplicateRows];
    const recordsToCreate: ResidentImportRecord[] = [];
    validation.validRecords.forEach((record) => {
      const key = getResidentImportDuplicateKey(record.fullName, record.purok);
      if (existingKeys.has(key)) {
        skippedDuplicates.push({ rowNumber: record.rowNumber, message: "Resident with the same normalized name and Purok already exists." });
      } else {
        recordsToCreate.push(record);
        existingKeys.add(key);
      }
    });

    const summary = {
      recordsRead: body.records.length,
      validRecords: recordsToCreate.length,
      invalidRecords: validation.invalidRows.length,
      potentialDuplicates: skippedDuplicates.length,
    };

    if (action === "validate") {
      return NextResponse.json({
        success: validation.invalidRows.length === 0,
        ...summary,
        invalidRows: validation.invalidRows,
        skippedDuplicates,
      }, { status: validation.invalidRows.length === 0 ? 200 : 422 });
    }

    if (validation.invalidRows.length > 0) {
      return NextResponse.json({
        success: false,
        ...summary,
        invalidRows: validation.invalidRows,
        skippedDuplicates,
        message: "Import contains invalid rows. Correct them before confirming the import.",
      }, { status: 422 });
    }

    const failedRows: ImportIssue[] = [];
    let created = 0;
    for (let offset = 0; offset < recordsToCreate.length; offset += BATCH_SIZE) {
      const chunk = recordsToCreate.slice(offset, offset + BATCH_SIZE);
      const batch = db.batch();
      chunk.forEach((record) => {
        const residentRef = db.collection("residents").doc(residentDocumentId(record));
        const verificationFields = getResidentVerificationFields(record.fullName, normalizePurokForSearch(record.purok));
        batch.create(residentRef, {
          fullName: record.fullName,
          fullNameNormalized: normalizeResidentName(record.fullName),
          ...verificationFields,
          purok: record.purok,
          active: record.active,
          archived: record.archived,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          createdBy: { uid: admin.uid, email: admin.email || "" },
          updatedBy: { uid: admin.uid, email: admin.email || "" },
        });
      });

      try {
        await batch.commit();
        created += chunk.length;
      } catch (error) {
        console.error("Bulk resident import batch failed.", {
          operation: "bulk-resident-import",
          batchStart: offset,
          batchSize: chunk.length,
          errorName: error instanceof Error ? error.name : "UnknownError",
          errorCode: typeof (error as { code?: unknown })?.code === "string" ? (error as { code: string }).code : "unknown",
        });
        chunk.forEach((record) => failedRows.push({ rowNumber: record.rowNumber, message: "This batch could not be written. Retry after checking the server connection." }));
      }
    }

    if (created > 0) {
      await db.collection("activityLogs").add({
        action: "RESIDENTS_BULK_IMPORTED",
        category: "Residents",
        description: `Administrator imported ${created} resident records.`,
        actorType: "admin",
        actorId: admin.uid,
        status: failedRows.length === 0 ? "completed" : "partial",
        metadata: {
          recordsRead: summary.recordsRead,
          created,
          skippedDuplicates: skippedDuplicates.length,
          failed: failedRows.length,
        },
        createdAt: FieldValue.serverTimestamp(),
      }).catch((error) => console.error("Bulk resident import activity log failed.", {
        errorName: error instanceof Error ? error.name : "UnknownError",
      }));
    }

    const success = failedRows.length === 0;
    return NextResponse.json({
      success,
      ...summary,
      created,
      skippedDuplicates,
      failedRows,
      message: success
        ? "Resident import completed."
        : "Resident import partially completed. Review failed rows before retrying.",
    }, { status: success ? 200 : 207 });
  } catch (error) {
    console.error("Bulk resident import failed.", {
      operation: "bulk-resident-import",
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorCode: typeof (error as { code?: unknown })?.code === "string" ? (error as { code: string }).code : "unknown",
    });
    return NextResponse.json({ success: false, message: "Bulk resident import could not be completed." }, { status: 500 });
  }
}
