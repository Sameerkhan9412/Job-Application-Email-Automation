import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { transporter } from "@/lib/mailer";
import EmailLog from "@/models/EmailLog";
import { verifyAuth } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    if (!(await verifyAuth(req))) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { logId } = await req.json();

    if (!logId) {
      return NextResponse.json(
        { success: false, message: "Log ID is required" },
        { status: 400 }
      );
    }

    const log = await EmailLog.findById(logId);
    if (!log) {
      return NextResponse.json(
        { success: false, message: "Email log not found" },
        { status: 404 }
      );
    }

    // Resend using the stored information
    const info = await transporter.sendMail({
      from: `"Sameer" <${process.env.EMAIL_USER}>`,
      to: log.email,
      subject: log.subject,
      html: log.message, // uses the saved html body
    });

    // Create a new log for this resend attempt
    const newLog = await EmailLog.create({
      email: log.email,
      hr_name: log.hr_name,
      company: log.company,
      status: "sent",
      type: log.type,
      subject: log.subject,
      message: log.message,
      messageId: info.messageId,
      followUpCount: log.followUpCount,
      lastSentAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Email resent successfully",
      log: newLog,
    });
  } catch (error: any) {
    console.error("Resend API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to resend email" },
      { status: 500 }
    );
  }
}
