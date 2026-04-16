import cron from "node-cron";
import EmailLog from "@/models/EmailLog";
import { sendFollowUp } from "./sendFollowUp";
import { connectDB } from "./db";

cron.schedule("0 */6 * * *", async () => {
  console.log("🔁 Checking follow-ups...");

  await connectDB();

  const now = new Date();

  const logs = await EmailLog.find({
    status: "sent",
    nextFollowUpAt: { $lte: now },
    followUpCount: { $lt: 2 }, // max 2 follow-ups
  });

  for (const log of logs) {
    try {
      await sendFollowUp(log);

      log.followUpCount += 1;
      log.lastSentAt = new Date();

      // schedule next follow-up
      log.nextFollowUpAt = new Date(
        Date.now() + (log.followUpCount === 1 ? 3 : 5) * 24 * 60 * 60 * 1000
      );

      await log.save();

      console.log("✅ Follow-up sent to:", log.email);
    } catch (err) {
      console.error("❌ Follow-up failed:", log.email);
    }
  }
});