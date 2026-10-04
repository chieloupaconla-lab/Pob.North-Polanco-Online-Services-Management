
import { NextRequest, NextResponse } from "next/server";
import { sendResidentEmailNotification } from "@/lib/send-email-notification";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      email,
      fullName,
      title,
      emailBody,
      requestType,
      requestId,
      oldStatus,
      newStatus,
    } = body;

    if (
      typeof email !== "string" ||
      !email.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Resident email is required.",
        },
        { status: 400 }
      );
    }

    if (
      typeof fullName !== "string" ||
      !fullName.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Resident name is required.",
        },
        { status: 400 }
      );
    }

    if (
      typeof title !== "string" ||
      !title.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Email title is required.",
        },
        { status: 400 }
      );
    }

    if (
      typeof requestType !== "string" ||
      !requestType.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Request type is required.",
        },
        { status: 400 }
      );
    }

    if (
      typeof oldStatus !== "string" ||
      typeof newStatus !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Request statuses are required.",
        },
        { status: 400 }
      );
    }

    const result =
      await sendResidentEmailNotification({
        email: email.trim(),
        fullName: fullName.trim(),
        title: title.trim(),
        requestType: requestType.trim(),
        requestId:
          typeof requestId === "string"
            ? requestId
            : undefined,
        oldStatus: oldStatus.trim(),
        newStatus: newStatus.trim(),
      });

    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "Admin email notification API error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Failed to send email notification.",
      },
      { status: 500 }
    );
  }
}

