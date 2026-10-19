"use client";

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import Link from "next/link";
import {
  Bell,
  FileText,
  AlertTriangle,
  Package,
  RotateCcw,
  Search,
  Clock,
  CheckCircle2,
  Circle,
  ArrowLeft,
  Info,
  Loader2,
} from "lucide-react";

import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import { OFFICIAL_PUROKS, getStoredPurok, isOfficialPurok } from "@/lib/purokConfig";
import { compareResidentNames } from "@/lib/residentVerification";

type RequestType =
  | "Document Request"
  | "Complaint"
  | "Equipment Borrowing"
  | "Equipment Returning";

type RequestItem = {
  id: string;
  type: RequestType;
  title: string;
  status: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  details: string;
  extraDetails?: string;
};

type LookupMode = "resident" | "anonymous";

const DOCUMENT_STATUSES = [
  "Pending",
  "Under Review",
  "Approved",
  "Completed",
];

const COMPLAINT_STATUSES = [
  "Pending",
  "Under Review",
  "For Action",
  "In Progress",
  "Resolved",
];

const BORROWING_STATUSES = [
  "Pending",
  "Under Review",
  "Approved",
  "Released",
];

const RETURNING_STATUSES = [
  "Borrowed",
  "Return Requested",
  "Returned",
];


function normalizeRequestStatus(status: string) {
  return status.trim().toLowerCase();
}

function isPendingRequest(status: string) {
  return normalizeRequestStatus(status) === "pending";
}

function displayRequestStatus(status: string) {
  const normalized = normalizeRequestStatus(status);
  if (normalized === "cancelled" || normalized === "canceled") return "Cancelled";
  if (normalized === "pending") return "Pending";
  return status.trim();
}

function cleanResidentValue(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ");
}

function formatDate(date: Date | null) {
  if (!date) {
    return "Not available";
  }

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(date: Date | null) {
  if (!date) {
    return "Not available";
  }

  return date.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function convertTimestamp(value: unknown): Date | null {
  if (value instanceof Timestamp) {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  return null;
}

function getStatusColor(status: string) {
  const normalized = status.toLowerCase();

  if (
    normalized.includes("completed") ||
    normalized.includes("resolved") ||
    normalized.includes("returned")
  ) {
    return "bg-green-100 text-green-700 border-green-200";
  }

  if (
    normalized.includes("approved") ||
    normalized.includes("released")
  ) {
    return "bg-blue-100 text-blue-700 border-blue-200";
  }

  if (
    normalized.includes("under review") ||
    normalized.includes("in progress") ||
    normalized.includes("for action")
  ) {
    return "bg-yellow-100 text-yellow-700 border-yellow-200";
  }

  if (
    normalized.includes("rejected") ||
    normalized.includes("cancelled") ||
    normalized.includes("lost") ||
    normalized.includes("damaged") ||
    normalized.includes("overdue")
  ) {
    return "bg-red-100 text-red-700 border-red-200";
  }

  return "bg-gray-100 text-gray-700 border-gray-200";
}

function getTypeIcon(type: RequestType) {
  switch (type) {
    case "Document Request":
      return <FileText className="h-5 w-5" />;

    case "Complaint":
      return <AlertTriangle className="h-5 w-5" />;

    case "Equipment Borrowing":
      return <Package className="h-5 w-5" />;

    case "Equipment Returning":
      return <RotateCcw className="h-5 w-5" />;

    default:
      return <Bell className="h-5 w-5" />;
  }
}

function getTypeColor(type: RequestType) {
  switch (type) {
    case "Document Request":
      return "bg-purple-100 text-purple-700";

    case "Complaint":
      return "bg-orange-100 text-orange-700";

    case "Equipment Borrowing":
      return "bg-blue-100 text-blue-700";

    case "Equipment Returning":
      return "bg-green-100 text-green-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getStatuses(
  type: RequestType,
  status: string
) {
  let statuses: string[] = [];

  switch (type) {
    case "Document Request":
      statuses = DOCUMENT_STATUSES;
      break;

    case "Complaint":
      statuses = COMPLAINT_STATUSES;
      break;

    case "Equipment Borrowing":
      statuses = BORROWING_STATUSES;
      break;

    case "Equipment Returning":
      statuses = RETURNING_STATUSES;
      break;
  }

  const normalizedStatus = status.trim();

  if (
    normalizedStatus === "Rejected" ||
    normalizedStatus === "Cancelled" ||
    normalizedStatus === "Overdue" ||
    normalizedStatus === "Damaged" ||
    normalizedStatus === "Lost"
  ) {
    return [...statuses, normalizedStatus];
  }

  if (!statuses.includes(normalizedStatus)) {
    return [...statuses, normalizedStatus];
  }

  return statuses;
}

function getStatusIndex(
  statuses: string[],
  status: string
) {
  return statuses.findIndex(
    (item) =>
      item.toLowerCase() ===
      status.toLowerCase()
  );
}

function StatusTimeline({
  type,
  status,
}: {
  type: RequestType;
  status: string;
}) {
  const statuses = getStatuses(
    type,
    status
  );

  const currentIndex =
    getStatusIndex(
      statuses,
      status
    );

  const isSpecial = [
    "Rejected",
    "Cancelled",
    "Overdue",
    "Damaged",
    "Lost",
  ].includes(status);

  return (
    <div className="mt-6">
      <p className="mb-4 text-sm font-semibold text-gray-700">
        Request Progress
      </p>

      <div className="space-y-0">
        {statuses.map(
          (step, index) => {
            const completed =
              currentIndex >= 0 &&
              index <= currentIndex;

            const isCurrent =
              step.toLowerCase() ===
              status.toLowerCase();

            return (
              <div
                key={step}
                className="flex"
              >
                <div className="mr-4 flex flex-col items-center">
                  {completed ? (
                    <CheckCircle2
                      className={`h-6 w-6 ${
                        isSpecial
                          ? "text-red-500"
                          : "text-purple-600"
                      }`}
                    />
                  ) : (
                    <Circle className="h-6 w-6 text-gray-300" />
                  )}

                  {index <
                    statuses.length -
                      1 && (
                    <div
                      className={`h-10 w-0.5 ${
                        completed &&
                        index <
                          currentIndex
                          ? isSpecial
                            ? "bg-red-300"
                            : "bg-purple-300"
                          : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>

                <div className="pb-7">
                  <p
                    className={`text-sm font-medium ${
                      isCurrent
                        ? isSpecial
                          ? "text-red-600"
                          : "text-purple-700"
                        : completed
                        ? "text-gray-700"
                        : "text-gray-400"
                    }`}
                  >
                    {step}
                  </p>

                  {isCurrent && (
                    <p className="mt-1 text-xs text-gray-500">
                      Current status
                    </p>
                  )}
                </div>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}

function normalizeRequestType(
  value: string | null
): RequestType | null {
  switch (
    value?.toLowerCase()
  ) {
    case "document":
    case "documents":
    case "document request":
      return "Document Request";

    case "complaint":
    case "complaints":
      return "Complaint";

    case "borrow":
    case "borrowing":
    case "equipment borrowing":
      return "Equipment Borrowing";

    case "return":
    case "returning":
    case "equipment returning":
      return "Equipment Returning";

    default:
      return null;
  }
}

export default function NotificationsPage() {
  const [lookupMode, setLookupMode] = useState<LookupMode>("resident");
  const [fullName, setFullName] =
    useState("");

  const [purok, setPurok] =
    useState("");

  const [trackingCode, setTrackingCode] =
    useState("");

  // Inline resident cancellation state
  const [cancellingRequestId, setCancellingRequestId] = useState<string | null>(null);
  const [cancelMessage, setCancelMessage] = useState("");
  const [cancelError, setCancelError] = useState("");

  const [requests, setRequests] =
    useState<RequestItem[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [directLoading, setDirectLoading] =
    useState(false);

  const [searched, setSearched] =
    useState(false);

  const [directRequestLoaded, setDirectRequestLoaded] =
    useState(false);

  const [error, setError] =
    useState("");

  const fullNameInputRef =
    useRef<HTMLInputElement>(null);

  /*
   * ============================================================
   * SEARCH RESIDENT REQUESTS
   * ============================================================
   */
  async function handleSearch(
    event?: FormEvent<HTMLFormElement>
  ) {
    event?.preventDefault();

    setError("");
    setRequests([]);
    setSearched(false);
    setDirectRequestLoaded(false);

    const cleanName =
      cleanResidentValue(fullName);

    const cleanPurok = cleanResidentValue(purok);

    const cleanTrackingCode =
      trackingCode
        .trim()
        .toUpperCase();

    if (lookupMode === "anonymous") {
      if (!cleanTrackingCode) {
        setError("Please enter your anonymous complaint tracking code.");
        return;
      }

      setLoading(true);
      try {
        const response = await fetch("/api/complaints/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trackingCode: cleanTrackingCode }),
        });
        const result = (await response.json()) as {
          found?: boolean;
             complaint?: {
               category: string;
               customConcern?: string;
               description: string;
            status: string;
            createdAt: string | null;
            updatedAt: string | null;
          };
        };

        if (!response.ok || !result.found || !result.complaint) {
          setError("Unable to find a complaint with that tracking code. Please check the code and try again.");
          setSearched(true);
          return;
        }

        setRequests([{
          id: "anonymous-complaint",
          type: "Complaint",
          title: result.complaint.category,
          status: result.complaint.status,
          createdAt: result.complaint.createdAt ? new Date(result.complaint.createdAt) : null,
          updatedAt: result.complaint.updatedAt ? new Date(result.complaint.updatedAt) : null,
          details: result.complaint.description,
            extraDetails: `Anonymous complaint${result.complaint.customConcern ? ` · Specific concern: ${result.complaint.customConcern}` : ""}`,
        }]);
        setSearched(true);
      } catch {
        setError("Unable to find a complaint with that tracking code. Please check the code and try again.");
        setSearched(true);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (cleanPurok && !isOfficialPurok(cleanPurok)) {
      setError("Please select an official Purok.");
      return;
    }

    /*
     * Resident lookup requires both
     * Full Name and Purok.
     */
    if (
      (cleanName &&
        !cleanPurok) ||
      (!cleanName &&
        cleanPurok)
    ) {
      setError(
        "Please enter both your Full Name and Purok."
      );

      return;
    }

    /*
     * Allow either:
     *
     * Full Name + Purok
     *
     * OR
     *
     * Anonymous Complaint Tracking Code
     */
    if (!cleanName && !cleanPurok) {
      setError(
       "Please enter your Full Name and Purok."
      );

      return;
    }

    setLoading(true);

    try {
      const lookupResponse = await fetch("/api/notifications/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: cleanName, purok: cleanPurok }),
      });
      const lookupResult = await lookupResponse.json() as {
        status?: "matched" | "ambiguous" | "not_found" | "invalid" | "error";
        requests?: Array<RequestItem & { createdAt: string | null; updatedAt: string | null }>;
      };

      if (!lookupResponse.ok || lookupResult.status === "error") {
        setError("Something went wrong while checking your requests. Please try again.");
        setSearched(true);
        return;
      }

      if (lookupResult.status === "ambiguous") {
        setError("More than one resident matches that name in the selected Purok. Please enter your complete registered name.");
        setSearched(true);
        return;
      }

      if (lookupResult.status === "not_found") {
        setError("Unable to find a resident with that name and Purok. Please check your information and try again.");
        setSearched(true);
        return;
      }

      setRequests((lookupResult.requests || []).map((item) => ({
        ...item,
        createdAt: item.createdAt ? new Date(item.createdAt) : null,
        updatedAt: item.updatedAt ? new Date(item.updatedAt) : null,
      })));
      setSearched(true);
      setLoading(false);
      return;

      /* Legacy client-side request collection lookup is intentionally unreachable.
       * Resident records and service requests are now filtered server-side. */
      const verificationResponse = await fetch("/api/residents/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: cleanName, purok: cleanPurok }),
      });
      const verificationResult = (await verificationResponse.json()) as { verified?: boolean };
      if (!verificationResponse.ok || verificationResult.verified !== true) {
        setError("Unable to verify your resident information. Please check your full name and Purok and try again.");
        setSearched(true);
        return;
      }

      const allRequests: RequestItem[] =
        [];

      /*
       * ============================================================
       * 1. BARANGAY DOCUMENT REQUESTS
       * ============================================================
       */

      if (
        cleanName &&
        cleanPurok
      ) {
        const documentsQuery =
          query(
            collection(
              db,
              "documents"
            ),
            where(
              "purok",
              "==",
              cleanPurok
            ),
          );

        const documentsSnapshot =
          await getDocs(
            documentsQuery
          );

        documentsSnapshot.forEach(
          (
            documentSnapshot
          ) => {
             const data =
               documentSnapshot.data();
             if (compareResidentNames(cleanName, String(data.fullName || "")).confidence !== "HIGH_CONFIDENCE") return;
             if (getStoredPurok(data) !== cleanPurok) return;

            allRequests.push({
              id:
                documentSnapshot.id,

              type:
                "Document Request",

              title:
                data.documentType ||
                "Barangay Document Request",

              status:
                data.status ||
                "Pending",

              createdAt:
                convertTimestamp(
                  data.createdAt
                ),

              updatedAt:
                convertTimestamp(
                  data.updatedAt
                ),

              details:
                data.purpose ||
                "No purpose provided.",

              extraDetails:
                 `Purok: ${
                   getStoredPurok(data) ||
                   cleanPurok
                }`,
            });
          }
        );
      }

      /*
       * ============================================================
       * 2. NAMED COMMUNITY CONCERNS / COMPLAINTS
       * ============================================================
       */

      if (
        cleanName &&
        cleanPurok
      ) {
        const complaintsQuery =
          query(
            collection(
              db,
              "complaints"
            ),
            where(
              "purok",
              "==",
              cleanPurok
            ),
          );

        const complaintsSnapshot =
          await getDocs(
            complaintsQuery
          );

        complaintsSnapshot.forEach(
          (
            complaintSnapshot
          ) => {
             const data =
               complaintSnapshot.data();
             if (compareResidentNames(cleanName, String(data.fullName || "")).confidence !== "HIGH_CONFIDENCE") return;
             if (getStoredPurok(data) !== cleanPurok) return;

            /*
             * Anonymous complaints should not
             * appear in normal resident lookup.
             */
            if (
              data.submissionType ===
              "Anonymous"
            ) {
              return;
            }

            allRequests.push({
              id:
                complaintSnapshot.id,

              type:
                "Complaint",

              title:
                data.category ||
                "Community Concern",

              status:
                data.status ||
                "Pending",

              createdAt:
                convertTimestamp(
                  data.createdAt
                ),

              updatedAt:
                convertTimestamp(
                  data.updatedAt
                ),

              details:
                data.description ||
                "No description provided.",

              extraDetails:
                `${data.category === "Others" && data.customConcern ? `Specific concern: ${data.customConcern} · ` : ""}Location: ${
                  data.locationOfConcern ||
                  "Not provided"
                }`,
            });
          }
        );
      }

      /*
       * ============================================================
       * 4. EQUIPMENT BORROWING + RETURNING
       * ============================================================
       */

      if (
        cleanName &&
        cleanPurok
      ) {
        const assetsQuery =
          query(
            collection(
              db,
              "assets"
            ),
            where(
              "purok",
              "==",
              cleanPurok
            ),
          );

        const assetsSnapshot =
          await getDocs(
            assetsQuery
          );

        assetsSnapshot.forEach(
          (assetSnapshot) => {
             const data =
               assetSnapshot.data();
             if (compareResidentNames(cleanName, String(data.borrowerName || "")).confidence !== "HIGH_CONFIDENCE") return;
             if (getStoredPurok(data) !== cleanPurok) return;

            const assetName =
              data.assetName ||
              "Barangay Equipment";

            const quantity =
              data.quantity || 1;

            /*
             * Equipment Borrowing
             */
            allRequests.push({
              id:
                `${assetSnapshot.id}-borrow`,

              type:
                "Equipment Borrowing",

              title:
                assetName,

              status:
                data.status ||
                "Pending",

              createdAt:
                convertTimestamp(
                  data.createdAt
                ),

              updatedAt:
                convertTimestamp(
                  data.updatedAt
                ),

              details:
                `Quantity: ${quantity}`,

              extraDetails:
                `Borrow Date: ${
                  data.borrowDate ||
                  "Not provided"
                }`,
            });

            /*
             * Equipment Returning
             */
            const hasReturnInformation =
              data.actualReturnDate ||
              data.returnCondition ||
              data.damageDetails ||
              data.lossDetails ||
              data.penalty ||
              [
                "Returned",
                "Damaged",
                "Lost",
                "Overdue",
              ].includes(
                data.status
              );

            if (
              hasReturnInformation
            ) {
              let returnStatus =
                "Return Requested";

              if (
                data.status ===
                "Returned"
              ) {
                returnStatus =
                  "Returned";
              } else if (
                data.status ===
                "Damaged"
              ) {
                returnStatus =
                  "Damaged";
              } else if (
                data.status ===
                "Lost"
              ) {
                returnStatus =
                  "Lost";
              } else if (
                data.status ===
                "Overdue"
              ) {
                returnStatus =
                  "Overdue";
              }

              allRequests.push({
                id:
                  `${assetSnapshot.id}-return`,

                type:
                  "Equipment Returning",

                title:
                  assetName,

                status:
                  returnStatus,

                createdAt:
                  convertTimestamp(
                    data.createdAt
                  ),

                updatedAt:
                  convertTimestamp(
                    data.updatedAt
                  ),

                details:
                  `Quantity: ${quantity}`,

                extraDetails:
                  data.actualReturnDate
                    ? `Returned: ${data.actualReturnDate}`
                    : "Return information is being processed.",
              });
            }
          }
        );
      }

      /*
       * ============================================================
       * SORT NEWEST FIRST
       * ============================================================
       */

      allRequests.sort(
        (a, b) => {
          const dateA =
            a.updatedAt?.getTime() ||
            a.createdAt?.getTime() ||
            0;

          const dateB =
            b.updatedAt?.getTime() ||
            b.createdAt?.getTime() ||
            0;

          return dateB - dateA;
        }
      );

      setRequests(
        allRequests
      );

      setSearched(true);
    } catch (searchError) {
      console.error(
        "Error loading resident requests:",
        searchError
      );

      setError(
        "Something went wrong while checking your requests. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * ============================================================
   * DIRECT REQUEST LOOKUP FROM EMAIL LINK
   *
   * Example:
   * /notifications?requestId=ABC123&requestType=document
   *
   * This allows a direct link to open the
   * specific request directly.
   * ============================================================
   */
  async function loadDirectRequest(
    requestId: string,
    requestType: RequestType,
    trackingCodeFromUrl?: string
  ) {
    setDirectLoading(true);
    setError("");
    setRequests([]);
    setSearched(false);

    try {
      const allRequests: RequestItem[] =
        [];

      /*
       * ============================================================
       * DOCUMENT
       * ============================================================
       */
      if (
        requestType ===
        "Document Request"
      ) {
        const documentQuery =
          query(
            collection(
              db,
              "documents"
            ),
            where(
              "__name__",
              "==",
              requestId
            )
          );

        const snapshot =
          await getDocs(
            documentQuery
          );

        snapshot.forEach(
          (documentSnapshot) => {
            const data =
              documentSnapshot.data();

            allRequests.push({
              id:
                documentSnapshot.id,

              type:
                "Document Request",

              title:
                data.documentType ||
                "Barangay Document Request",

              status:
                data.status ||
                "Pending",

              createdAt:
                convertTimestamp(
                  data.createdAt
                ),

              updatedAt:
                convertTimestamp(
                  data.updatedAt
                ),

              details:
                data.purpose ||
                "No purpose provided.",

              extraDetails:
                 `Purok: ${
                   getStoredPurok(data) ||
                  "Not provided"
                }`,
            });
          }
        );
      }

      /*
       * ============================================================
       * COMPLAINT
       * ============================================================
       */
      if (
        requestType ===
        "Complaint"
      ) {
        const complaintQuery =
          query(
            collection(
              db,
              "complaints"
            ),
            where(
              "__name__",
              "==",
              requestId
            )
          );

        const snapshot =
          await getDocs(
            complaintQuery
          );

        snapshot.forEach(
          (complaintSnapshot) => {
            const data =
              complaintSnapshot.data();

            /*
             * If a tracking code was supplied,
             * verify that it matches the complaint.
             */
            if (
              trackingCodeFromUrl &&
              String(
                data.trackingCode || ""
              ).toUpperCase() !==
                trackingCodeFromUrl.toUpperCase()
            ) {
              return;
            }

            allRequests.push({
              id:
                complaintSnapshot.id,

              type:
                "Complaint",

              title:
                data.category ||
                "Community Concern",

              status:
                data.status ||
                "Pending",

              createdAt:
                convertTimestamp(
                  data.createdAt
                ),

              updatedAt:
                convertTimestamp(
                  data.updatedAt
                ),

              details:
                data.description ||
                "No description provided.",

              extraDetails:
                `Location: ${
                  data.locationOfConcern ||
                  "Not provided"
                }`,
            });
          }
        );
      }

      /*
       * ============================================================
       * EQUIPMENT BORROWING
       * ============================================================
       */
      if (
        requestType ===
        "Equipment Borrowing"
      ) {
        const assetQuery =
          query(
            collection(
              db,
              "assets"
            ),
            where(
              "__name__",
              "==",
              requestId
            )
          );

        const snapshot =
          await getDocs(
            assetQuery
          );

        snapshot.forEach(
          (assetSnapshot) => {
            const data =
              assetSnapshot.data();

            const assetName =
              data.assetName ||
              "Barangay Equipment";

            const quantity =
              data.quantity || 1;

            allRequests.push({
              id:
                `${assetSnapshot.id}-borrow`,

              type:
                "Equipment Borrowing",

              title:
                assetName,

              status:
                data.status ||
                "Pending",

              createdAt:
                convertTimestamp(
                  data.createdAt
                ),

              updatedAt:
                convertTimestamp(
                  data.updatedAt
                ),

              details:
                `Quantity: ${quantity}`,

              extraDetails:
                `Borrow Date: ${
                  data.borrowDate ||
                  "Not provided"
                }`,
            });
          }
        );
      }

      /*
       * ============================================================
       * EQUIPMENT RETURNING
       * ============================================================
       */
      if (
        requestType ===
        "Equipment Returning"
      ) {
        const assetQuery =
          query(
            collection(
              db,
              "assets"
            ),
            where(
              "__name__",
              "==",
              requestId
            )
          );

        const snapshot =
          await getDocs(
            assetQuery
          );

        snapshot.forEach(
          (assetSnapshot) => {
            const data =
              assetSnapshot.data();

            const assetName =
              data.assetName ||
              "Barangay Equipment";

            const quantity =
              data.quantity || 1;

            let returnStatus =
              "Return Requested";

            if (
              data.status ===
              "Returned"
            ) {
              returnStatus =
                "Returned";
            } else if (
              data.status ===
              "Damaged"
            ) {
              returnStatus =
                "Damaged";
            } else if (
              data.status ===
              "Lost"
            ) {
              returnStatus =
                "Lost";
            } else if (
              data.status ===
              "Overdue"
            ) {
              returnStatus =
                "Overdue";
            }

            allRequests.push({
              id:
                `${assetSnapshot.id}-return`,

              type:
                "Equipment Returning",

              title:
                assetName,

              status:
                returnStatus,

              createdAt:
                convertTimestamp(
                  data.createdAt
                ),

              updatedAt:
                convertTimestamp(
                  data.updatedAt
                ),

              details:
                `Quantity: ${quantity}`,

              extraDetails:
                data.actualReturnDate
                  ? `Returned: ${data.actualReturnDate}`
                  : "Return information is being processed.",
            });
          }
        );
      }

      if (
        allRequests.length ===
        0
      ) {
        setError(
          "Request not found. Please use the manual request status lookup."
        );

        setSearched(true);
        return;
      }

      allRequests.sort(
        (a, b) => {
          const dateA =
            a.updatedAt?.getTime() ||
            a.createdAt?.getTime() ||
            0;

          const dateB =
            b.updatedAt?.getTime() ||
            b.createdAt?.getTime() ||
            0;

          return dateB - dateA;
        }
      );

      setRequests(
        allRequests
      );

      setSearched(true);
      setDirectRequestLoaded(true);
    } catch (directError) {
      console.error(
        "Error loading direct request:",
        directError
      );

      setError(
        "Unable to open this request. Please use the manual request status lookup."
      );

      setSearched(true);
    } finally {
      setDirectLoading(false);
    }
  }

  /*
   * ============================================================
   * READ REQUEST ID FROM EMAIL LINK
   * ============================================================
   */
  useEffect(() => {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    const params =
      new URLSearchParams(
        window.location.search
      );

    const requestId =
      params.get(
        "requestId"
      );

    const requestType =
      normalizeRequestType(
        params.get(
          "requestType"
        )
      );

    const urlTrackingCode =
      params
        .get(
          "trackingCode"
        )
        ?.trim()
        .toUpperCase();

    /*
     * Anonymous complaint links can use
     * trackingCode.
     */
    if (
      requestId &&
      requestType ===
        "Complaint"
    ) {
      void Promise.resolve().then(() => loadDirectRequest(
        requestId,
        requestType,
        urlTrackingCode
      ));

      return;
    }

    if (
      requestId &&
      requestType
    ) {
      void Promise.resolve().then(() => loadDirectRequest(
        requestId,
        requestType
      ));

      return;
    }

    /*
     * If the URL only contains a tracking code,
     * automatically search for the anonymous complaint.
     */
    if (
      urlTrackingCode &&
      !requestId
    ) {
      void Promise.resolve().then(() => {
        setLookupMode("anonymous");
        setTrackingCode(urlTrackingCode);
      });

      const runAnonymousSearch =
        async () => {
          setDirectLoading(
            true
          );
          setError("");

          try {
            const response = await fetch("/api/complaints/track", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ trackingCode: urlTrackingCode }),
            });
            const result = (await response.json()) as {
              found?: boolean;
               complaint?: { category: string; customConcern?: string; description: string; status: string; createdAt: string | null; updatedAt: string | null };
            };
            if (!response.ok || !result.found || !result.complaint) {
              setError("Unable to find a complaint with that tracking code. Please check the code and try again.");
            } else {
              setRequests([{
                id: "anonymous-complaint",
                type: "Complaint",
                title: result.complaint.category,
                status: result.complaint.status,
                createdAt: result.complaint.createdAt ? new Date(result.complaint.createdAt) : null,
                updatedAt: result.complaint.updatedAt ? new Date(result.complaint.updatedAt) : null,
                details: result.complaint.description,
                 extraDetails: `Anonymous complaint${result.complaint.customConcern ? ` · Specific concern: ${result.complaint.customConcern}` : ""}`,
              }]);
              setDirectRequestLoaded(true);
            }
            setSearched(true);
          } catch (trackingError) {
            console.error(
              "Error loading tracking code request:",
              trackingError
            );

            setError(
              "Unable to load the request using this tracking code."
            );

            setSearched(true);
          } finally {
            setDirectLoading(
              false
            );
          }
        };

      runAnonymousSearch();
    }
  }, []);

  async function handleCancelRequest(request: RequestItem) {
    setCancelMessage("");
    setCancelError("");

    // Only a Pending request can be cancelled. The API checks this again
    // to protect against a status change between page load and cancellation.
    if (!isPendingRequest(request.status)) {
      setCancelError("This request can no longer be cancelled because it is not Pending.");
      return;
    }

    if (request.id === "anonymous-complaint" || request.type === "Equipment Returning") {
      setCancelError("This request cannot be cancelled from this tracking view.");
      return;
    }

    const token = window.prompt(
      "Enter the private 64-character cancellation token you received when submitting this request."
    )?.trim();

    if (!token) return;
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      setCancelError("The cancellation token must be 64 hexadecimal characters.");
      return;
    }

    if (!window.confirm("Cancel this Pending request now? The barangay does not need to approve the cancellation.")) {
      return;
    }

    const requestType =
      request.type === "Document Request"
        ? "document"
        : request.type === "Complaint"
          ? "complaint"
          : "asset";
    // Borrowing cards use a display suffix; the API needs the actual Firestore document ID.
    const requestId = request.type === "Equipment Borrowing"
      ? request.id.replace(/-borrow$/, "")
      : request.id;

    setCancellingRequestId(request.id);

    try {
      const response = await fetch("/api/requests/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestType, requestId, cancellationToken: token }),
      });
      const result = await response.json() as { success?: boolean; message?: string };

      if (!response.ok || !result.success) {
        setCancelError(result.message || "Unable to cancel this request. It may no longer be Pending.");
        return;
      }

      const now = new Date();
      setRequests((current) => current.map((item) =>
        item.id === request.id ? { ...item, status: "Cancelled", updatedAt: now } : item
      ));
      setCancelMessage(`Your ${request.type.toLowerCase()} was cancelled successfully. The admin has been notified.`);
    } catch {
      setCancelError("A connection error occurred. Please try again.");
    } finally {
      setCancellingRequestId(null);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Header */}
      <section className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-800"
          >
            <ArrowLeft className="h-4 w-4" />

            Back to Home
          </Link>

          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
              <Bell className="h-7 w-7" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                My Notifications & Requests
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
                View and track all your barangay
                service requests in one place.
                You do not need to check each
                service page separately.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {/* Direct Request Notice */}
        {directRequestLoaded && (
          <section className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4">
            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />

              <div>
                <p className="text-sm font-semibold text-green-800">
                  Request Opened
                </p>

                <p className="mt-1 text-sm leading-6 text-green-700">
                   This request was opened directly
                   from a request link.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Direct Request Loading */}
        {directLoading && (
          <section className="mb-6 rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-center gap-3 text-sm text-purple-700">
              <Loader2 className="h-5 w-5 animate-spin" />

              Loading your request...
            </div>
          </section>
        )}

        {/* Search Card */}
        <section className="rounded-3xl border border-purple-100 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              Find Your Requests
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Enter the same information you used
              when submitting your request.
            </p>

            <div className="mt-5 grid grid-cols-2 rounded-xl bg-gray-100 p-1">
              <button type="button" onClick={() => { setLookupMode("resident"); setError(""); setRequests([]); setSearched(false); }} className={`rounded-lg px-3 py-2 text-sm font-semibold ${lookupMode === "resident" ? "bg-white text-purple-700 shadow-sm" : "text-gray-500"}`}>Resident Lookup</button>
              <button type="button" onClick={() => { setLookupMode("anonymous"); setError(""); setRequests([]); setSearched(false); }} className={`rounded-lg px-3 py-2 text-sm font-semibold ${lookupMode === "anonymous" ? "bg-white text-purple-700 shadow-sm" : "text-gray-500"}`}>Anonymous Complaint</button>
            </div>
          </div>

          <form
            onSubmit={handleSearch}
            className="space-y-5"
          >
            {lookupMode === "resident" && <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Full Name
                </label>

                <input
                  ref={fullNameInputRef}
                  type="text"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(
                      event.target.value
                    )
                  }
                  placeholder="Enter your full name"
                  autoComplete="name"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                   Purok
                </label>

                 <select
                   value={purok}
                   onChange={(event) => setPurok(event.target.value)}
                   className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                 >
                   <option value="">Select your Purok</option>
                   {OFFICIAL_PUROKS.map((option) => <option key={option} value={option}>{option}</option>)}
                 </select>
              </div>
            </div>}

            {lookupMode === "anonymous" && <div className="relative flex items-center py-2">
              <div className="h-px flex-1 bg-gray-200" />

              <span className="px-4 text-xs font-medium uppercase tracking-wider text-gray-400">
                Anonymous Complaint
              </span>

              <div className="h-px flex-1 bg-gray-200" />
            </div>}

            {lookupMode === "anonymous" && <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Anonymous Complaint Tracking Code
              </label>

              <input
                type="text"
                value={trackingCode}
                onChange={(event) =>
                  setTrackingCode(
                    event.target.value.toUpperCase()
                  )
                }
                 placeholder="Example: PN-7K4Q9M"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm uppercase outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />

              <p className="mt-2 text-xs text-gray-500">
                Use this only if you submitted a
                complaint anonymously.
              </p>
            </div>}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={
                loading ||
                directLoading
              }
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {lookupMode === "anonymous" ? "Tracking Complaint..." : "Checking Your Requests..."}
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  {lookupMode === "anonymous" ? "Track Complaint" : "View My Requests"}
                </>
              )}
            </button>
          </form>

           {lookupMode === "resident" && <div className="mt-5 flex gap-3 rounded-xl bg-purple-50 p-4">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-purple-600" />

            <p className="text-xs leading-5 text-purple-800">
              Your requests from the three main
              services are automatically combined
              here. You do not need to check each
              service page separately.
            </p>
           </div>}

           
        </section>

        {/* Cancellation information */}
        <section className="mt-8 rounded-2xl border border-purple-100 bg-purple-50 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-purple-600" />
            <div>
              <h2 className="font-semibold text-purple-900">Request Cancellation</h2>
              <p className="mt-1 text-sm leading-6 text-purple-800">
                You can cancel a request yourself while its status is Pending. Select Cancel Request on the request card and enter the private cancellation token you received when you submitted it. No barangay approval is needed. The button is hidden after processing begins.
              </p>
            </div>
          </div>
          {cancelError && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{cancelError}</div>}
          {cancelMessage && <div role="status" className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800">{cancelMessage}</div>}
        </section>

        {/* Results */}

        {(cancelError || cancelMessage) && (
          <div className={`mt-6 rounded-xl border p-4 text-sm ${cancelError ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-800"}`} role={cancelError ? "alert" : "status"}>
            {cancelError || cancelMessage}
          </div>
        )}

        {searched && (
          <section className="mt-8">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                   {lookupMode === "anonymous" ? "Anonymous Complaint" : "My Requests"}
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {requests.length === 0
                    ? "No requests found."
                    : `${requests.length} request${
                        requests.length === 1
                          ? ""
                          : "s"
                      } found`}
                </p>
              </div>
            </div>

            {requests.length === 0 ? (
              <div className="rounded-3xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <Bell className="h-8 w-8 text-gray-400" />
                </div>

                <h3 className="mt-5 text-lg font-bold text-gray-900">
                  No Requests Found
                </h3>

                 <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                   {lookupMode === "anonymous"
                     ? "Unable to find a complaint with that tracking code. Please check the code and try again."
                     : "We could not find any document requests, complaints, equipment borrowing, or returning records using the information you entered."}
                 </p>

                 {lookupMode === "resident" && <p className="mt-4 text-xs text-gray-400">Make sure your Full Name and Purok match the information submitted with your request.</p>}
              </div>
            ) : (
              <div className="space-y-6">
                {requests.map(
                  (request) => (
                    <article
                      key={request.id}
                      className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm"
                    >
                      {/* Card Header */}
                      <div className="border-b border-gray-100 p-5 sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex items-start gap-4">
                            <div
                              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${getTypeColor(
                                request.type
                              )}`}
                            >
                              {getTypeIcon(
                                request.type
                              )}
                            </div>

                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                                {request.type}
                              </p>

                              <h3 className="mt-1 text-lg font-bold text-gray-900">
                                {request.title}
                              </h3>
                            </div>
                          </div>

                          <span
                            className={`inline-flex w-fit items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusColor(
                              request.status
                            )}`}
                          >
                            {displayRequestStatus(request.status)}
                          </span>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="p-5 sm:p-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="rounded-xl bg-gray-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                              Details
                            </p>

                            <p className="mt-1 text-sm text-gray-700">
                              {request.details}
                            </p>
                          </div>

                          <div className="rounded-xl bg-gray-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                              Additional Information
                            </p>

                            <p className="mt-1 text-sm text-gray-700">
                              {request.extraDetails ||
                                "No additional information."}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-col gap-2 rounded-xl bg-purple-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-2 text-sm text-purple-800">
                            <Clock className="h-4 w-4" />

                            <span>
                              Submitted:{" "}
                              {formatDate(
                                request.createdAt
                              )}
                            </span>
                          </div>

                          <p className="text-xs text-purple-600">
                            Last updated:{" "}
                            {formatDateTime(
                              request.updatedAt
                            )}
                          </p>
                        </div>

                        {/* Timeline */}
                        <StatusTimeline
                          type={request.type}
                          status={request.status}
                        />

                        {isPendingRequest(request.status) &&
                          request.id !== "anonymous-complaint" &&
                          request.type !== "Equipment Returning" && (
                            <div className="mt-5 border-t border-gray-100 pt-4">
                              <button
                                type="button"
                                onClick={() => void handleCancelRequest(request)}
                                disabled={cancellingRequestId === request.id}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {cancellingRequestId === request.id ? (
                                  <><Loader2 className="h-4 w-4 animate-spin" /> Cancelling...</>
                                ) : "Cancel Request"}
                              </button>
                              <p className="mt-2 text-xs text-gray-500">
                                Available only while this request is Pending. Cancellation takes effect immediately after verification.
                              </p>
                            </div>
                          )}
                      </div>
                    </article>
                  )
                )}
              </div>
            )}
          </section>
        )}

        {/* Service Links */}
        <section className="mt-10">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h3 className="font-bold text-gray-900">
              Need to Submit Another Request?
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Use the appropriate service below.
              Your submitted request will
              automatically appear here after you
              search for your requests.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <Link
                href="/documents"
                className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 transition hover:border-purple-300 hover:bg-purple-50"
              >
                <FileText className="h-5 w-5 text-purple-600" />

                <span className="text-sm font-semibold text-gray-700">
                  Documents
                </span>
              </Link>

              <Link
                href="/complaints"
                className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 transition hover:border-orange-300 hover:bg-orange-50"
              >
                <AlertTriangle className="h-5 w-5 text-orange-600" />

                <span className="text-sm font-semibold text-gray-700">
                  Complaints
                </span>
              </Link>

              <Link
                href="/assets"
                className="flex items-center gap-3 rounded-xl border border-gray-200 p-4 transition hover:border-blue-300 hover:bg-blue-50"
              >
                <Package className="h-5 w-5 text-blue-600" />

                <span className="text-sm font-semibold text-gray-700">
                  Equipment
                </span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
