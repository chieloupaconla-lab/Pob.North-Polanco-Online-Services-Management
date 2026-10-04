
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  throw new Error("Missing RESEND_API_KEY environment variable.");
}

const resend = new Resend(resendApiKey);

type SendResidentEmailNotificationParams = {
  email: string;
  fullName: string;
  title: string;
  requestType: string;
  requestId?: string;
  oldStatus: string;
  newStatus: string;
};

export async function sendResidentEmailNotification({
  email,
  fullName,
  title,
  requestType,
  requestId,
  oldStatus,
  newStatus,
}: SendResidentEmailNotificationParams) {
  try {
    const cleanEmail = email.trim();
    const cleanName = fullName.trim();

    if (!cleanEmail) {
      return {
        success: false,
        message: "Resident email address is required.",
      };
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(cleanEmail)) {
      return {
        success: false,
        message: "Invalid resident email address.",
      };
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://pob-north-polanco-online-services-management-bb05z9zbs.vercel.app";

    const notificationsUrl =
      `${siteUrl}/notifications`;

    const result = await resend.emails.send({
      from:
        "Barangay Poblacion North <onboarding@resend.dev>",

      to: [cleanEmail],

      subject: title,

      html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />
            <title>${title}</title>
          </head>

          <body
            style="
              margin: 0;
              padding: 0;
              background-color: #f5f3ff;
              font-family: Arial, Helvetica, sans-serif;
              color: #1f2937;
            "
          >
            <div
              style="
                max-width: 600px;
                margin: 40px auto;
                background: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0,0,0,0.08);
              "
            >
              <div
                style="
                  background: #6d28d9;
                  padding: 28px 24px;
                  text-align: center;
                  color: #ffffff;
                "
              >
                <h1
                  style="
                    margin: 0;
                    font-size: 24px;
                  "
                >
                  Barangay Poblacion North
                </h1>

                <p
                  style="
                    margin: 8px 0 0;
                    font-size: 14px;
                    opacity: 0.95;
                  "
                >
                  Integrated Public Services Portal
                </p>
              </div>

              <div
                style="
                  padding: 32px 28px;
                "
              >
                <p
                  style="
                    font-size: 16px;
                    margin-top: 0;
                  "
                >
                  Hello <strong>${cleanName}</strong>,
                </p>

                <p
                  style="
                    font-size: 15px;
                    line-height: 1.6;
                  "
                >
                  Your <strong>${requestType}</strong> request has
                  been updated by Barangay Poblacion North.
                </p>

                <div
                  style="
                    margin: 24px 0;
                    padding: 20px;
                    background: #f5f3ff;
                    border-radius: 12px;
                    border-left: 4px solid #6d28d9;
                  "
                >
                  <p
                    style="
                      margin: 0 0 12px;
                      font-size: 14px;
                      color: #6b7280;
                    "
                  >
                    Previous Status
                  </p>

                  <p
                    style="
                      margin: 0 0 20px;
                      font-size: 17px;
                      font-weight: bold;
                    "
                  >
                    ${oldStatus}
                  </p>

                  <p
                    style="
                      margin: 0 0 12px;
                      font-size: 14px;
                      color: #6b7280;
                    "
                  >
                    New Status
                  </p>

                  <p
                    style="
                      margin: 0;
                      font-size: 17px;
                      font-weight: bold;
                      color: #6d28d9;
                    "
                  >
                    ${newStatus}
                  </p>
                </div>

                ${
                  requestId
                    ? `
                      <p
                        style="
                          font-size: 13px;
                          color: #6b7280;
                        "
                      >
                        Request ID: ${requestId}
                      </p>
                    `
                    : ""
                }

                <p
                  style="
                    font-size: 15px;
                    line-height: 1.6;
                  "
                >
                  You can visit the Integrated Public Services
                  Portal to view the current status of your request.
                </p>

                <div
                  style="
                    text-align: center;
                    margin: 30px 0;
                  "
                >
                  <a
                    href="${notificationsUrl}"
                    style="
                      display: inline-block;
                      padding: 13px 24px;
                      background: #6d28d9;
                      color: #ffffff;
                      text-decoration: none;
                      border-radius: 8px;
                      font-weight: bold;
                      font-size: 14px;
                    "
                  >
                    View Request Status
                  </a>
                </div>

                <p
                  style="
                    font-size: 13px;
                    line-height: 1.6;
                    color: #6b7280;
                  "
                >
                  This is an automated notification from the
                  Barangay Poblacion North Integrated Public Services
                  Portal. Please do not reply to this email.
                </p>
              </div>

              <div
                style="
                  padding: 18px 24px;
                  background: #f9fafb;
                  text-align: center;
                  font-size: 12px;
                  color: #6b7280;
                "
              >
                Barangay Poblacion North<br />
                Polanco, Zamboanga del Norte
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (result.error) {
      console.error(
        "Resend email error:",
        result.error
      );

      return {
        success: false,
        message: "Email could not be sent.",
      };
    }

    return {
      success: true,
      message: "Email sent successfully.",
      id: result.data?.id,
    };
  } catch (error) {
    console.error(
      "Failed to send resident email notification:",
      error
    );

    return {
      success: false,
      message: "Email could not be sent.",
    };
  }
}

