import { EmailForm } from "@/app/components/emailform";
import { resend } from "@/lib/resend";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    if (!resend) {
      return NextResponse.json(
        { success: false, error: "Email service not configured" },
        { status: 503 }
      );
    }

    const data = await resend.emails.send({
      from: "awup-evs.site",
      to: "kupalkakupalka47@gmail.com",
      subject: "Your Voting Credentials",
      react: EmailForm(),
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to send email" },
      { status: 500 }
    );
  }
}
