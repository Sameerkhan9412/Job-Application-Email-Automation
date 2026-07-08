import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import EmailLog from "@/models/EmailLog";
import { transporter } from "@/lib/mailer";
import { verifyAuth } from "@/lib/utils";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    if (!(await verifyAuth(req))) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { logIds, customMessage } = await req.json();

    if (!logIds || !Array.isArray(logIds) || logIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "No log IDs provided" },
        { status: 400 }
      );
    }

    const results = [];

    for (const logId of logIds) {
      const log = await EmailLog.findById(logId);
      if (!log) {
        results.push({ id: logId, status: "failed", error: "Log not found" });
        continue;
      }

      if (!log.messageId) {
        results.push({ id: logId, status: "failed", error: "Original Message-ID missing; cannot reply to thread" });
        continue;
      }

      // Generate default message if custom message not provided
      const defaultFollowUpText =
        log.followUpCount === 0
          ? `Hi ${log.hr_name || "Hiring Team"},

Just following up on my previous email regarding opportunities at ${log.company || "your company"}.

Looking forward to your response.

Best regards,
Sameer`
          : `Hi ${log.hr_name || "Hiring Team"},

I wanted to check in again regarding my application at ${log.company || "your company"}.

Would really appreciate your response.

Best regards,
Sameer`;

      const bodyText = customMessage ? customMessage.trim() : defaultFollowUpText;

      try {
        const mailOptions = {
          from: `"Sameer" <${process.env.EMAIL_USER}>`,
          to: log.email,
          subject: log.subject.startsWith("Re:") ? log.subject : `Re: ${log.subject}`,
          html: `<div style="font-family: Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #111827;">${bodyText.replace(/\n/g, "<br>")}</div>`,
          headers: {
            "In-Reply-To": log.messageId,
            "References": log.messageId,
          },
        };

        const info = await transporter.sendMail(mailOptions);

        // Update database log
        log.followUpCount += 1;
        log.lastSentAt = new Date();
        // Schedule next follow-up 3 days after first, 5 days after second
        log.nextFollowUpAt = new Date(
          Date.now() + (log.followUpCount === 1 ? 3 : 5) * 24 * 60 * 60 * 1000
        );
        await log.save();

        results.push({ id: logId, email: log.email, status: "sent", messageId: info.messageId });
      } catch (err: any) {
        console.error(`Error sending follow-up to ${log.email}:`, err);
        results.push({ id: logId, email: log.email, status: "failed", error: err.message });
      }

      // Rate limit delay between emails
      await delay(2000);
    }

    return NextResponse.json({
      success: true,
      message: "Follow-up reminders processed.",
      results,
    });
  } catch (error: any) {
    console.error("Bulk Follow-up API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to process bulk follow-up." },
      { status: 500 }
    );
  }
}
