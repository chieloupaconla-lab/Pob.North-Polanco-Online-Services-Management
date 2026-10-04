import { NextRequest, NextResponse } from "next/server";
import { sendResidentNotification } from "@/lib/send-notification";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      fullName,
      purokStreet,
      title,
      notificationBody,
      requestType,
      requestId,
    } = body;

    if (
      typeof fullName !== "string" ||
      typeof purokStreet !== "string" ||
      typeof title !== "string" ||
      typeof notificationBody !== "string" ||
      typeof requestType !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid notification data.",
        },
        { status: 400 }
      );
    }

    const result = await sendResidentNotification({
      fullName: fullName.trim(),
      purokStreet: purokStreet.trim(),
      title: title.trim(),
      body: notificationBody.trim(),
      requestType: requestType.trim(),
      requestId:
        typeof requestId === "string"
          ? requestId
          : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "Admin notification API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to send notification.",
      },
      { status: 500 }
    );
  }
}