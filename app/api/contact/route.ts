import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, instituteName, location, phoneNumber, email, message } = body;

    if (!fullName || !instituteName || !location || !phoneNumber || !email || !message) {
      return NextResponse.json(
        { error: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(email).trim())) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const query = await (prisma as any).contactQuery.create({
      data: {
        fullName: String(fullName).trim(),
        instituteName: String(instituteName).trim(),
        location: String(location).trim(),
        phoneNumber: String(phoneNumber).trim(),
        email: String(email).trim().toLowerCase(),
        message: String(message).trim(),
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Your message has been sent successfully. We will contact you shortly!",
      query: {
        id: query.id,
        fullName: query.fullName,
        createdAt: query.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Error submitting contact inquiry:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while sending your message. Please try again." },
      { status: 500 }
    );
  }
}
