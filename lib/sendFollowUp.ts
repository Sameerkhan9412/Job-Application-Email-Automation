import { transporter } from "./mailer";
import EmailLog from "@/models/EmailLog";

export const sendFollowUp = async (log: any) => {
  const { email, hr_name, company, messageId, followUpCount, subject } = log;

  const followUpText =
    followUpCount === 0
      ? `Hi ${hr_name},

Just following up on my previous email regarding opportunities at ${company}.

Looking forward to your response.

Best regards,
Sameer`
      : `Hi ${hr_name},

I wanted to check in again regarding my application at ${company}.

Would really appreciate your response.

Best regards,
Sameer`;

  const info = await transporter.sendMail({
    from: `"Sameer" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: subject.startsWith("Re:") ? subject : `Re: ${subject}`,
    text: followUpText,
    headers: {
      "In-Reply-To": messageId,
      References: messageId,
    },
  });

  return info;
};