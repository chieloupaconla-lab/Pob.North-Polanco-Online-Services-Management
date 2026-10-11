
import { NextResponse } from "next/server";
import { getAdminServices, getBearerToken, verifyAdminTokenDetailed } from "@/lib/adminAuthorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const authResult = await verifyAdminTokenDetailed(
    getBearerToken(request)
  );

  if (!authResult.admin) {
    return NextResponse.json(
      { message: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    const { db } = getAdminServices();
    const snapshot = await db.collection("residents").get();

    let batch = db.batch();
    let pendingWrites = 0;
    let updated = 0;

    for (const resident of snapshot.docs) {
      const data = resident.data();

      if (!Object.prototype.hasOwnProperty.call(data, "archived")) {
        batch.update(resident.ref, { archived: false });
        pendingWrites++;
        updated++;

        if (pendingWrites === 400) {
          await batch.commit();
          batch = db.batch();
          pendingWrites = 0;
        }
      }
    }

    if (pendingWrites > 0) {
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      scanned: snapshot.size,
      updated,
      message: `Migration complete. ${updated} resident records were updated.`,
    });
  } catch (error) {
    console.error("Archived field migration failed:", error);

    return NextResponse.json(
      { message: "Migration failed. Check the server logs." },
      { status: 500 }
    );
  }
}
