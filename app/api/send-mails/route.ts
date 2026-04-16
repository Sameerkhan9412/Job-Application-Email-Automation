import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { transporter } from "@/lib/mailer";
import { directTemplate, referralTemplate } from "@/lib/templates";
import EmailLog from "@/models/EmailLog";
import { toTitleCase } from "@/lib/utils";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { contacts, type } = await req.json();

    // ✅ Validation
    if (!contacts || contacts.length === 0) {
      return NextResponse.json(
        { success: false, message: "No contacts provided" },
        { status: 400 }
      );
    }

    if (!["direct", "referral"].includes(type)) {
      return NextResponse.json(
        { success: false, message: "Invalid type" },
        { status: 400 }
      );
    }

    const results = [];

    for (const contact of contacts) {
      const { hr_name, name, email } = contact;

      if (!email) continue;

      // 🔥 Format names properly
      const formattedHR = toTitleCase(hr_name);
      const formattedCompany = toTitleCase(name);

      // ✅ Choose correct template
      const content =
        type === "direct"
          ? directTemplate(formattedHR, formattedCompany)
          : referralTemplate(formattedHR, formattedCompany);

      try {
        // 📧 Send Email
        const info = await transporter.sendMail({
          from: `"Sameer" <${process.env.EMAIL_USER}>`,
          to: email,
          subject:
            type === "direct"
              ? `Application for Software Engineer / Full Stack Developer at ${formattedCompany} | Immediate Joiner`
              : `Referral Request for Software Engineer Role at ${formattedCompany}`,
          html: content,
        });

        // ✅ Save log
        await EmailLog.create({
          email,
          hr_name: formattedHR,
          company: formattedCompany,
          status: "sent",
          type,
          messageId: info.messageId,
          followUpCount: 0,
          lastSentAt: new Date(),
        });

        results.push({ email, status: "sent" });

      } catch (error: any) {
        console.error("Mail error:", error);

        // ❌ Save failure
        await EmailLog.create({
          email,
          hr_name: formattedHR,
          company: formattedCompany,
          status: "failed",
          type,
          error: error.message,
        });

        results.push({ email, status: "failed" });
      }

      // ⏳ Rate limit
      await delay(2000);
    }

    return NextResponse.json({
      success: true,
      results,
    });

  } catch (error) {
    console.error("API Error:", error);

    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}