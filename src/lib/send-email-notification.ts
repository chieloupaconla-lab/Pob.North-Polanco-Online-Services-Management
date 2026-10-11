
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY?.trim();
const configuredFromEmail = process.env.RESEND_FROM_EMAIL?.trim();

const fromEmail =
  configuredFromEmail ||
  (process.env.NODE_ENV === "development"
    ? "onboarding@resend.dev"
    : "");

type SendResidentEmailNotificationParams = {
  email: string;
  fullName: string;
  title: string;
  requestType: string;
  requestId?: string;
  oldStatus: string;
  newStatus: string;
};

type SendEmailResult = {
  success: boolean;
  message: string;
  deliveryStatus?: "accepted";
  id?: string;
};

// Basic email format validation.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendResidentEmailNotification(
  params: SendResidentEmailNotificationParams
): Promise<SendEmailResult> {
  if (!resendApiKey) {
    console.error("Resident email notification configuration error: RESEND_API_KEY is missing.");

    return {
      success: false,
      message: "Email notifications are not configured. Check the server email settings.",
    };
  }

  if (!fromEmail || !EMAIL_PATTERN.test(fromEmail)) {
    console.error("Resident email notification configuration error: invalid sender address.");

    return {
      success: false,
      message: "The configured sender email address is invalid.",
    };
  }

  if (
    process.env.NODE_ENV === "production" &&
    fromEmail.toLowerCase() === "onboarding@resend.dev"
  ) {
    return {
      success: false,
      message: "A verified sender domain is required for production email.",
    };
  }

  const email = params.email.trim().toLowerCase();

  if (!EMAIL_PATTERN.test(email)) {
    return {
      success: false,
      message: "The resident request does not contain a valid email address.",
    };
  }

  const resend = new Resend(resendApiKey);

  const fullName = escapeHtml(params.fullName.trim() || "Resident");
  const requestType = escapeHtml(params.requestType.trim() || "service");
  const title = escapeHtml(
    params.title.trim() || "Request Status Updated"
  );
  const oldStatus = escapeHtml(params.oldStatus.trim());
  const newStatus = escapeHtml(params.newStatus.trim());
  const requestId = params.requestId
    ? escapeHtml(params.requestId.trim())
    : "";

  const updatedDate = new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date());

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
      </head>
      <body style="margin:0;padding:0;background:#f5f3ff;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
        <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08);">
          <div style="background:#6d28d9;padding:28px 24px;text-align:center;color:#fff;">
            <h1 style="margin:0;font-size:24px;">Barangay Poblacion North</h1>
            <p style="margin:8px 0 0;font-size:14px;">Integrated Public Services Portal</p>
          </div>

          <div style="padding:32px 28px;">
            <p style="font-size:16px;margin-top:0;">
              Hello <strong>${fullName}</strong>,
            </p>

            <p style="font-size:15px;line-height:1.6;">
              Your <strong>${requestType}</strong> request has been updated by Barangay Poblacion North.
            </p>

            <div style="margin:24px 0;padding:20px;background:#f5f3ff;border-radius:12px;border-left:4px solid #6d28d9;">
              <p style="margin:0 0 12px;font-size:14px;color:#6b7280;">
                Previous Status
              </p>
              <p style="margin:0 0 20px;font-size:17px;font-weight:bold;">
                ${oldStatus}
              </p>

              <p style="margin:0 0 12px;font-size:14px;color:#6b7280;">
                New Status
              </p>
              <p style="margin:0;font-size:17px;font-weight:bold;color:#6d28d9;">
                ${newStatus}
              </p>
            </div>

            ${
              requestId
                ? `<p style="font-size:13px;color:#6b7280;">Request ID: ${requestId}</p>`
                : ""
            }

            <p style="font-size:13px;color:#6b7280;">
              Updated: ${escapeHtml(updatedDate)}
            </p>

            <p style="font-size:15px;line-height:1.6;">
              You can visit the Integrated Public Services Portal to view the current status of your request.
            </p>

            <p style="font-size:13px;line-height:1.6;color:#6b7280;">
              This is an automated notification from the Barangay Poblacion North Integrated Public Services Portal. Please do not reply to this email.
            </p>
          </div>

          <div style="padding:18px 24px;background:#f9fafb;text-align:center;font-size:12px;color:#6b7280;">
            Barangay Poblacion North<br />
            Polanco, Zamboanga del Norte
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const result = await resend.emails.send({
      from: `Barangay Poblacion North <${fromEmail}>`,
      to: [email],
      subject: params.title.trim() || "Request Status Updated",
      html,
    });

    if (result.error) {
      // Log diagnostic information without exposing the API key
      // or the resident's email address.
      console.error("Resend rejected resident email.", {
        errorName: result.error.name || "ProviderError",
        errorMessage: result.error.message,
      });

      return {
        success: false,
        message: "Resend could not accept the email. Check the server logs and Resend dashboard.",
      };
    }

    if (!result.data?.id) {
      console.error("Resend returned no email ID for the notification.");

      return {
        success: false,
        message: "The email provider did not confirm acceptance of the message.",
      };
    }

    return {
      success: true,
      deliveryStatus: "accepted",
      message: "Email accepted by the delivery provider.",
      id: result.data.id,
    };
  } catch (error) {
    console.error("Failed to send resident status email.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorMessage:
        error instanceof Error
          ? error.message
          : "Unknown email delivery error",
    });

    return {
      success: false,
      message: "An email delivery error occurred. Check the server logs.",
    };
  }
}
