import { transporter } from "./mailer";

export const sendMail = async ({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) => {
  return await transporter.sendMail({
    from: `"Sameer" <${process.env.MAIL_USER}>`,
    to,
    subject,
    text,
    html,
  });
};