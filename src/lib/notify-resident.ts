import { auth } from "@/lib/firebase";

type NotifyResidentStatusParams = {
  recordType: "document" | "complaint" | "asset";
  title: string;
  requestType: string;
  requestId: string;
  oldStatus: string;
  newStatus: string;
};

export type ResidentNotificationResult = {
  success: boolean;
  message: string;
  deliveryStatus?: "accepted";
};

export async function notifyResidentStatus(
  params: NotifyResidentStatusParams
): Promise<ResidentNotificationResult> {

  try {
    const user = auth.currentUser;
    if (!user) {
      console.error("Resident email notification skipped: administrator is not authenticated.");
      return { success: false, message: "Administrator authentication is required." };
    }
    const token = await user.getIdToken();
    const response = await fetch(
      "/api/admin/notify/email-notify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
          body: JSON.stringify(params),
      }
    );

    if (!response.ok) {
      const result = await response.json().catch(() => null) as { message?: string } | null;
      console.error("Resident email notification failed.", {
        recordType: params.recordType,
        requestId: params.requestId,
        status: response.status,
        message: result?.message || "Unknown notification failure",
      });
      return { success: false, message: result?.message || "Email notification could not be sent." };
    }

    return await response.json() as ResidentNotificationResult;
  } catch (error) {
    // Email delivery must not undo a successful status update.
    console.error("Resident email notification error.", {
      recordType: params.recordType,
      requestId: params.requestId,
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return { success: false, message: "Email notification could not be sent." };
  }
}
