import mongoose, { Schema, Document } from "mongoose";

export interface IEmailLog extends Document {
  email: string;
  hr_name: string;
  company: string;
  type: "direct" | "referral";
  status: "sent" | "failed";
  subject: string;
  message: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmailLogSchema = new Schema<IEmailLog>(
  {
    email: {
      type: String,
      required: true,
    },
    hr_name: {
      type: String,
    },
    company: {
      type: String,
    },
    type: {
      type: String,
      enum: ["direct", "referral"],
      required: true,
    },
    status: {
      type: String,
      enum: ["sent", "failed"],
      required: true,
    },
    subject: {
      type: String,
    },
    message: {
      type: String,
    },
    messageId: {
      type: String,
    },

    followUpCount: {
      type: Number,
      default: 0,
    },

    lastSentAt: {
      type: Date,
      default: Date.now,
    },

    nextFollowUpAt: {
      type: Date,
    },
    error: {
      type: String,
    },
  },
  {
    timestamps: true, // ✅ adds createdAt & updatedAt automatically
  },
);

// ✅ Prevent model overwrite in Next.js (important)
const EmailLog =
  mongoose.models.EmailLog ||
  mongoose.model<IEmailLog>("EmailLog", EmailLogSchema);

export default EmailLog;
