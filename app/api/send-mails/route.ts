import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { transporter } from "@/lib/mailer";
import Template from "@/models/Template";
import EmailLog from "@/models/EmailLog";
import { toTitleCase, verifyAuth } from "@/lib/utils";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const stripHTML = (html: string) => {
  return html
    .replace(/<p[^>]*>/gi, "")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<strong>/gi, "")
    .replace(/<\/strong>/gi, "")
    .replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, "$2 ($1)")
    .replace(/<[^>]*>/g, "")
    .trim();
};

const wrapText = (greeting: string, bodyText: string) => {
  return `${greeting}

${bodyText}

Best regards,
Sameer
Email: ${process.env.MAIL_USER || "sameerkhan.cse1@gmail.com"}
Phone: +91 9412803911
Portfolio: https://sameerwork.vercel.app/
GitHub: https://github.com/sameerkhan9412
LinkedIn: https://linkedin.com/in/sameerkhn
Resume: https://drive.google.com/file/d/1_Ky8_5W-IkpzoDCGfBNu1sVPCalUOtab`.trim();
};

const wrapHTML = (greeting: string, bodyHTML: string) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Application</title>
</head>
<body style="margin: 0; padding: 20px 0; background: #ffffff; font-family: Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #111827;">
  <div style="max-width: 600px; margin: 0 auto; padding: 0 10px;">
    <p style="margin: 0 0 16px 0;">${greeting}</p>
    
    ${bodyHTML}
    
    <p style="margin: 24px 0 0 0; color: #111827;">
      Best regards,<br/>
      <strong>Sameer</strong><br/>
      Email: <a href="mailto:${process.env.MAIL_USER || "sameerkhan.cse1@gmail.com"}" style="color: #2563eb; text-decoration: underline;">${process.env.MAIL_USER || "sameerkhan.cse1@gmail.com"}</a><br/>
      Phone: <a href="tel:+919412803911" style="color: #2563eb; text-decoration: underline;">+91 9412803911</a><br/>
      Portfolio: <a href="https://sameerwork.vercel.app" style="color: #2563eb; text-decoration: underline;">sameerwork.netlify.app</a><br/>
      GitHub: <a href="https://github.com/sameerkhan9412" style="color: #2563eb; text-decoration: underline;">github.com/sameerkhan9412</a><br/>
      LinkedIn: <a href="https://linkedin.com/in/sameerkhn" style="color: #2563eb; text-decoration: underline;">linkedin.com/in/sameerkhn</a><br/>
      Resume: <a href="https://drive.google.com/file/d/1_Ky8_5W-IkpzoDCGfBNu1sVPCalUOtab" style="color: #2563eb; text-decoration: underline;">View Resume</a>
    </p>
  </div>
</body>
</html>
  `.trim();
};

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    if (!(await verifyAuth(req))) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { contacts, type, role = "fullstack", customSubject, format = "html" } = await req.json();

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

    // Load template from MongoDB
    const template = await Template.findOne({ key: role });
    if (!template) {
      return NextResponse.json(
        { success: false, message: `Template role "${role}" not found in database.` },
        { status: 400 }
      );
    }

    const results = [];

    for (const contact of contacts) {
      const { hr_name, company_name, name, email, phone } = contact;
      const rawCompany = company_name || name || "";

      if (!email) continue;

      // 🔥 Format names properly
      const formattedHR = toTitleCase(hr_name || (type === "referral" ? "there" : "Hiring Team"));
      const formattedCompany = toTitleCase(rawCompany || "your company");

      // Replace placeholders in the DB template body
      const templateBody = type === "direct" ? template.bodyDirect : template.bodyReferral;
      const evaluatedBody = templateBody
        .replace(/\{\{company\}\}/gi, formattedCompany)
        .replace(/\{\{company_name\}\}/gi, formattedCompany)
        .replace(/\{\{hr\}\}/gi, formattedHR)
        .replace(/\{\{hr_name\}\}/gi, formattedHR);

      let content = "";
      if (format === "text") {
        const strippedBody = stripHTML(evaluatedBody);
        content = wrapText(
          type === "referral" ? `Dear ${formattedHR} sir,` : `Dear ${formattedHR},`,
          strippedBody
        );
      } else {
        content = wrapHTML(
          type === "referral" ? `Hi ${formattedHR} sir,` : `Dear ${formattedHR},`,
          evaluatedBody
        );
      }

      // Determine subject line (custom or default template-based subject)
      let subject = "";
      if (customSubject) {
        subject = customSubject
          .replace(/\{\{company\}\}/gi, formattedCompany)
          .replace(/\{\{company_name\}\}/gi, formattedCompany)
          .replace(/\{\{hr\}\}/gi, formattedHR)
          .replace(/\{\{hr_name\}\}/gi, formattedHR);
      } else {
        const defaultSub = type === "direct" ? template.subjectDirect : template.subjectReferral;
        subject = defaultSub
          .replace(/\{\{company\}\}/gi, formattedCompany)
          .replace(/\{\{company_name\}\}/gi, formattedCompany)
          .replace(/\{\{hr\}\}/gi, formattedHR)
          .replace(/\{\{hr_name\}\}/gi, formattedHR);
      }

      try {
        // 📧 Send Email
        const info = await transporter.sendMail({
          from: `"Sameer" <${process.env.MAIL_USER}>`,
          to: email,
          subject: subject,
          ...(format === "text" ? { text: content } : { html: content }),
        });

        // ✅ Save log (with subject and body content)
        await EmailLog.create({
          email,
          hr_name: formattedHR,
          company: formattedCompany,
          phone: phone || undefined,
          status: "sent",
          type,
          subject,
          message: content,
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
          phone: phone || undefined,
          status: "failed",
          type,
          subject,
          message: content,
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