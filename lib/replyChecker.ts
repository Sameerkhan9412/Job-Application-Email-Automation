import { ImapFlow } from "imapflow";
import { connectDB } from "./db";
import EmailLog from "@/models/EmailLog";

export const checkRepliesForLogs = async () => {
  await connectDB();

  // Find all logs that are sent and haven't been replied to yet
  const logsToCheck = await EmailLog.find({
    status: "sent",
    hasReplied: false,
    messageId: { $exists: true, $ne: null },
  });

  if (logsToCheck.length === 0) {
    return { success: true, updatedCount: 0, message: "No pending emails to check." };
  }

  const mailUser = process.env.MAIL_USER;
  const mailPass = process.env.MAIL_PASS;

  if (!mailUser || !mailPass) {
    throw new Error("MAIL_USER or MAIL_PASS not configured in environment variables.");
  }

  // Gmail IMAP configuration
  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: {
      user: mailUser,
      pass: mailPass,
    },
    logger: false,
  });

  await client.connect();

  let updatedCount = 0;
  const updatedLogs = [];

  // Select INBOX
  const lock = await client.getMailboxLock("INBOX");
  try {
    for (const log of logsToCheck) {
      if (!log.messageId) continue;

      // Extract message ID from angular brackets if they exist
      const cleanMessageId = log.messageId.trim();

      // Search inbox for any message replying to this message ID
      // We check In-Reply-To or References
      const searchResult = await client.search({
        or: [
          { header: { "In-Reply-To": cleanMessageId } },
          { header: { "References": cleanMessageId } }
        ]
      });

      if (searchResult && searchResult.length > 0) {
        log.hasReplied = true;
        log.isAutoFollowUpPaused = true;
        await log.save();
        updatedCount++;
        updatedLogs.push(log);
        console.log(`✉️ Reply detected for log to: ${log.email} (Message-ID: ${cleanMessageId})`);
      }
    }
  } catch (error) {
    console.error("IMAP Search Error:", error);
    throw error;
  } finally {
    lock.release();
    await client.logout();
  }

  return {
    success: true,
    updatedCount,
    updatedLogs,
  };
};
