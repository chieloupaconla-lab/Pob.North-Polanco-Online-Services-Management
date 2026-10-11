
import { NextResponse } from "next/server";
import {
  FieldPath,
  Timestamp,
  type Query,
} from "firebase-admin/firestore";
import { getAdminServices } from "@/lib/adminAuthorization";
import {
  getBearerToken,
  verifyAdminTokenDetailed,
} from "@/lib/adminAuthorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type Cursor =
  | {
      mode: "date";
      seconds: number;
      nanoseconds: number;
      id: string;
    }
  | {
      mode: "name";
      name: string;
      id: string;
    };

function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

function decodeCursor(value: string | null): Cursor | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8")
    ) as Cursor;

    if (
      parsed &&
      typeof parsed.id === "string" &&
      (parsed.mode === "date" || parsed.mode === "name")
    ) {
      return parsed;
    }
  } catch {
    return null;
  }

  return null;
}

export async function GET(request: Request) {
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
    const url = new URL(request.url);

    const archivedParam = url.searchParams.get("archived");
    const purok = url.searchParams.get("purok")?.trim() || "";
    const search = url.searchParams.get("search")?.trim().toLowerCase() || "";
    const cursor = decodeCursor(url.searchParams.get("cursor"));

    if (archivedParam !== "true" && archivedParam !== "false") {
      return NextResponse.json(
        { message: "The archived parameter must be true or false." },
        { status: 400 }
      );
    }

    if (url.searchParams.has("cursor") && !cursor) {
      return NextResponse.json(
        { message: "Invalid pagination cursor." },
        { status: 400 }
      );
    }

    const residentsRef = db.collection("residents");

    // Exact document ID lookup. This avoids scanning the collection.
    if (search) {
      const exactDocument = await residentsRef.doc(search).get();

      if (exactDocument.exists) {
        const data = exactDocument.data()!;

        const matchesTab = (data.archived === true) ===
          (archivedParam === "true");
        const matchesPurok = !purok || data.purok === purok;

        if (matchesTab && matchesPurok) {
          return NextResponse.json({
            residents: [
              {
                id: exactDocument.id,
                ...data,
                fullName: String(data.fullName || ""),
                fullNameNormalized: String(data.fullNameNormalized || ""),
                purok: String(data.purok || ""),
                purokStreet: String(data.purokStreet || ""),
                active: data.active === true,
                archived: data.archived === true,
              },
            ],
            nextCursor: null,
            hasMore: false,
          });
        }
      }
    }

   let query: Query = residentsRef;

if (archivedParam === "true") {
  query = query.where("archived", "==", true);
}



    if (search) {
      // Prefix search by normalized full name.
      query = query
        .where("fullNameNormalized", ">=", search)
        .where("fullNameNormalized", "<", search + "\uf8ff")
        .orderBy("fullNameNormalized", "asc")
        .orderBy(FieldPath.documentId(), "asc");

      if (cursor) {
        if (cursor.mode !== "name") {
          return NextResponse.json(
            { message: "The cursor does not match the search mode." },
            { status: 400 }
          );
        }

        query = query.startAfter(cursor.name, cursor.id);
      }
    } else {
      query = query
        .orderBy("createdAt", "desc")
        .orderBy(FieldPath.documentId(), "desc");

      if (cursor) {
        if (cursor.mode !== "date") {
          return NextResponse.json(
            { message: "The cursor does not match the list mode." },
            { status: 400 }
          );
        }

        query = query.startAfter(
          new Timestamp(cursor.seconds, cursor.nanoseconds),
          cursor.id
        );
      }
    }

    const snapshot = await query.limit(PAGE_SIZE + 1).get();
    const hasMore = snapshot.docs.length > PAGE_SIZE;
    const pageDocs = snapshot.docs.slice(0, PAGE_SIZE);

    const residents = pageDocs.map((item) => {
      const data = item.data();

      return {
        id: item.id,
        ...data,
        fullName: String(data.fullName || ""),
        fullNameNormalized: String(data.fullNameNormalized || ""),
        purok: String(data.purok || ""),
        purokStreet: String(data.purokStreet || ""),
        active: data.active === true,
        archived: data.archived === true,
      };
    });

    let nextCursor: string | null = null;

    if (hasMore && pageDocs.length > 0) {
      const last = pageDocs[pageDocs.length - 1];

      if (search) {
        nextCursor = encodeCursor({
          mode: "name",
          name: String(last.get("fullNameNormalized") || ""),
          id: last.id,
        });
      } else {
        const createdAt = last.get("createdAt");

        if (createdAt instanceof Timestamp) {
          nextCursor = encodeCursor({
            mode: "date",
            seconds: createdAt.seconds,
            nanoseconds: createdAt.nanoseconds,
            id: last.id,
          });
        }
      }
    }

    return NextResponse.json({
      residents,
      nextCursor,
      hasMore: Boolean(hasMore && nextCursor),
    });
  } catch (error) {
    console.error("Resident list API failed:", error);

    return NextResponse.json(
      {
        message:
          "Unable to load residents. Check server logs and any required Firestore indexes.",
      },
      { status: 500 }
    );
  }
}
