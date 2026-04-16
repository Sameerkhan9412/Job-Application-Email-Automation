import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import EmailLog from "@/models/EmailLog";
import { transporter } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { email } = await req.json();

    // ✅ Validation
    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    // 🔍 Find latest email log for this user
    const log = await EmailLog.findOne({ email }).sort({ createdAt: -1 });

    if (!log) {
      return NextResponse.json(
        { success: false, message: "No email found for this user" },
        { status: 404 }
      );
    }

    if (!log.messageId) {
      return NextResponse.json(
        { success: false, message: "No messageId found for threading" },
        { status: 400 }
      );
    }

    // 🚫 Limit follow-ups
    if (log.followUpCount >= 2) {
      return NextResponse.json(
        { success: false, message: "Follow-up limit reached" },
        { status: 400 }
      );
    }

    // ✉️ Follow-up content
    const followUpText =
      log.followUpCount === 0
        ? `Hi ${log.hr_name},

Just following up on my previous email regarding opportunities at ${log.company}.

Looking forward to your response.

Best regards,
Sameer`
        : `Hi ${log.hr_name},

I wanted to check in again regarding my application at ${log.company}.

Would really appreciate your response.

Best regards,
Sameer`;

    // 📧 Send follow-up
    const info = await transporter.sendMail({
      from: `"Sameer" <${process.env.EMAIL_USER}>`,
      to: log.email,
      subject: `Re: Opportunity at ${log.company}`,
      text: followUpText,
      headers: {
        "In-Reply-To": log.messageId,
        References: log.messageId,
      },
    });

    // ✅ Update DB
    log.followUpCount += 1;
    log.lastSentAt = new Date();

    // schedule next follow-up
    log.nextFollowUpAt = new Date(
      Date.now() + (log.followUpCount === 1 ? 3 : 5) * 24 * 60 * 60 * 1000
    );

    await log.save();

    return NextResponse.json({
      success: true,
      message: "Follow-up sent successfully",
      messageId: info.messageId,
      followUpCount: log.followUpCount,
    });

  } catch (error) {
    console.error("Follow-up API Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to send follow-up" },
      { status: 500 }
    );
  }
}