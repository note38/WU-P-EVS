import { EmailForm } from "@/app/components/emailform";

import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST() {
  try {
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
