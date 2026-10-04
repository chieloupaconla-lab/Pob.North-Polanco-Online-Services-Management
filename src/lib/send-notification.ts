import {
  adminDb,
  adminMessaging,
} from "@/lib/firebase-admin";

type SendResidentNotificationParams = {
  fullName: string;
  purokStreet: string;
  title: string;
  body: string;
  requestType: string;
  requestId?: string;
};

export async function sendResidentNotification({
  fullName,
  purokStreet,
  title,
  body,
  requestType,
  requestId,
}: SendResidentNotificationParams) {
  try {
    const tokensSnapshot = await adminDb
      .collection("notificationTokens")
      .where("fullName", "==", fullName)
      .where("purokStreet", "==", purokStreet)
      .get();

    if (tokensSnapshot.empty) {
      return {
        success: false,
        sent: 0,
        message: "No notification device found.",
      };
    }

    const tokens: {
      id: string;
      token: string;
    }[] = [];

    tokensSnapshot.forEach((tokenDoc) => {
      const data = tokenDoc.data();

      if (
        typeof data.token === "string" &&
        data.token.trim()
      ) {
        tokens.push({
          id: tokenDoc.id,
          token: data.token.trim(),
        });
      }
    });

    if (tokens.length === 0) {
      return {
        success: false,
        sent: 0,
        message: "No valid notification token found.",
      };
    }

    let sent = 0;

    for (const tokenData of tokens) {
      try {
        await adminMessaging.send({
          token: tokenData.token,

          notification: {
            title,
            body,
          },

          data: {
            url: "/notifications",
            requestType,
            requestId: requestId || "",
          },

          webpush: {
            notification: {
              title,
              body,
              icon: "/icon-192.png",
            },

            fcmOptions: {
              link: "/notifications",
            },
          },
        });

        sent++;
      } catch (error: unknown) {
        console.error(
          "FCM notification error:",
          error
        );

        const errorCode =
          error &&
          typeof error === "object" &&
          "code" in error
            ? String(
                (error as { code?: unknown }).code
              )
            : "";

        if (
          errorCode ===
            "messaging/registration-token-not-registered" ||
          errorCode ===
            "messaging/invalid-registration-token"
        ) {
          await adminDb
            .collection("notificationTokens")
            .doc(tokenData.id)
            .delete();

          console.log(
            "Removed invalid notification token:",
            tokenData.id
          );
        }
      }
    }

    return {
      success: sent > 0,
      sent,
      message:
        sent > 0
          ? "Notification sent successfully."
          : "Notification could not be sent.",
    };
  } catch (error) {
    console.error(
      "Failed to send resident notification:",
      error
    );

    return {
      success: false,
      sent: 0,
      message: "Failed to send notification.",
    };
  }
}