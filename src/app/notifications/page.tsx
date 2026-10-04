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
  const [fullName, setFullName] =
    useState("");

  const [purokStreet, setPurokStreet] =
    useState("");

  const [trackingCode, setTrackingCode] =
    useState("");

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

  const purokStreetInputRef =
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

    const cleanPurokStreet =
      cleanResidentValue(
        purokStreet
      );

    const cleanTrackingCode =
      trackingCode
        .trim()
        .toUpperCase();

    /*
     * Resident lookup requires both
     * Full Name and Purok/Street.
     */
    if (
      (cleanName &&
        !cleanPurokStreet) ||
      (!cleanName &&
        cleanPurokStreet)
    ) {
      setError(
        "Please enter both your Full Name and Purok/Street."
      );

      return;
    }

    /*
     * Allow either:
     *
     * Full Name + Purok/Street
     *
     * OR
     *
     * Anonymous Complaint Tracking Code
     */
    if (
      !cleanName &&
      !cleanPurokStreet &&
      !cleanTrackingCode
    ) {
      setError(
        "Please enter your Full Name and Purok/Street, or enter your anonymous complaint tracking code."
      );

      return;
    }

    setLoading(true);

    try {
      const allRequests: RequestItem[] =
        [];

      /*
       * ============================================================
       * 1. BARANGAY DOCUMENT REQUESTS
       * ============================================================
       */

      if (
        cleanName &&
        cleanPurokStreet
      ) {
        const documentsQuery =
          query(
            collection(
              db,
              "documents"
            ),
            where(
              "fullName",
              "==",
              cleanName
            ),
            where(
              "purokStreet",
              "==",
              cleanPurokStreet
            )
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
                `Purok/Street: ${
                  data.purokStreet ||
                  cleanPurokStreet
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
        cleanPurokStreet
      ) {
        const complaintsQuery =
          query(
            collection(
              db,
              "complaints"
            ),
            where(
              "fullName",
              "==",
              cleanName
            ),
            where(
              "purokStreet",
              "==",
              cleanPurokStreet
            )
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
       * 3. ANONYMOUS COMMUNITY CONCERN
       * ============================================================
       */

      if (cleanTrackingCode) {
        const anonymousComplaintQuery =
          query(
            collection(
              db,
              "complaints"
            ),
            where(
              "trackingCode",
              "==",
              cleanTrackingCode
            )
          );

        const anonymousSnapshot =
          await getDocs(
            anonymousComplaintQuery
          );

        anonymousSnapshot.forEach(
          (
            complaintSnapshot
          ) => {
            const data =
              complaintSnapshot.data();

            if (
              data.submissionType !==
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
                "Anonymous Community Concern",

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
       * 4. EQUIPMENT BORROWING + RETURNING
       * ============================================================
       */

      if (
        cleanName &&
        cleanPurokStreet
      ) {
        const assetsQuery =
          query(
            collection(
              db,
              "assets"
            ),
            where(
              "borrowerName",
              "==",
              cleanName
            ),
            where(
              "purokStreet",
              "==",
              cleanPurokStreet
            )
          );

        const assetsSnapshot =
          await getDocs(
            assetsQuery
          );

        assetsSnapshot.forEach(
          (assetSnapshot) => {
            const data =
              assetSnapshot.data();

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
   * This allows the email button to open the
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
                `Purok/Street: ${
                  data.purokStreet ||
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
          "Request not found. Please check your email link or use the manual request status lookup."
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
      loadDirectRequest(
        requestId,
        requestType,
        urlTrackingCode
      );

      return;
    }

    if (
      requestId &&
      requestType
    ) {
      loadDirectRequest(
        requestId,
        requestType
      );

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
      setTrackingCode(
        urlTrackingCode
      );

      const runAnonymousSearch =
        async () => {
          setDirectLoading(
            true
          );
          setError("");

          try {
            const anonymousComplaintQuery =
              query(
                collection(
                  db,
                  "complaints"
                ),
                where(
                  "trackingCode",
                  "==",
                  urlTrackingCode
                )
              );

            const snapshot =
              await getDocs(
                anonymousComplaintQuery
              );

            const foundRequests: RequestItem[] =
              [];

            snapshot.forEach(
              (
                complaintSnapshot
              ) => {
                const data =
                  complaintSnapshot.data();

                if (
                  data.submissionType !==
                  "Anonymous"
                ) {
                  return;
                }

                foundRequests.push({
                  id:
                    complaintSnapshot.id,

                  type:
                    "Complaint",

                  title:
                    data.category ||
                    "Anonymous Community Concern",

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

            if (
              foundRequests.length ===
              0
            ) {
              setError(
                "Request not found. Please check your tracking code."
              );
            }

            setRequests(
              foundRequests
            );

            setSearched(true);
            setDirectRequestLoaded(
              foundRequests.length >
                0
            );
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
                  from your email notification.
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
          </div>

          <form
            onSubmit={handleSearch}
            className="space-y-5"
          >
            <div className="grid gap-5 sm:grid-cols-2">
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
                  Purok / Street
                </label>

                <input
                  ref={
                    purokStreetInputRef
                  }
                  type="text"
                  value={purokStreet}
                  onChange={(event) =>
                    setPurokStreet(
                      event.target.value
                    )
                  }
                  placeholder="Example: Purok 2, Poblacion North"
                  autoComplete="street-address"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />
              </div>
            </div>

            <div className="relative flex items-center py-2">
              <div className="h-px flex-1 bg-gray-200" />

              <span className="px-4 text-xs font-medium uppercase tracking-wider text-gray-400">
                Anonymous Complaint
              </span>

              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <div>
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
                placeholder="Example: CN-ABC12345"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm uppercase outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />

              <p className="mt-2 text-xs text-gray-500">
                Use this only if you submitted a
                complaint anonymously.
              </p>
            </div>

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
                  Checking Your Requests...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  View My Requests
                </>
              )}
            </button>
          </form>

          <div className="mt-5 flex gap-3 rounded-xl bg-purple-50 p-4">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-purple-600" />

            <p className="text-xs leading-5 text-purple-800">
              Your requests from the three main
              services are automatically combined
              here. You do not need to check each
              service page separately.
            </p>
          </div>

          <div className="mt-4 flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

            <p className="text-xs leading-5 text-blue-800">
              Status updates are sent to the email
              address you provided when submitting
              your request. If you opened this page
              from an email notification, your specific
              request is displayed automatically.
            </p>
          </div>
        </section>

        {/* Results */}
        {searched && (
          <section className="mt-8">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  My Requests
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
                  We could not find any document
                  requests, complaints, equipment
                  borrowing, or returning records
                  using the information you entered.
                </p>

                <p className="mt-4 text-xs text-gray-400">
                  Make sure your Full Name and
                  Purok/Street match the information
                  submitted with your request.
                </p>
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
                            {request.status}
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