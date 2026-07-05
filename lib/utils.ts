import crypto from "crypto";
import { connectDB } from "@/lib/db";
import Admin from "@/models/Admin";

export const formatEmail = (email: string) => {
  return email.trim().toLowerCase();
};

export const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const capitalize = (str: string) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const toTitleCase = (str: string) => {
  return str
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
};

export const verifyAuth = async (req: Request): Promise<boolean> => {
  // Check if authentication is bypassed via environment variables
  if (process.env.DISABLE_AUTH === "true") {
    return true;
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  const token = authHeader.substring(7);

  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
    const { payload, signature } = decoded;
    if (!payload || !signature) return false;

    const { username, exp } = JSON.parse(payload);
    if (!username || !exp) return false;

    // Verify expiration
    if (exp < Date.now()) {
      return false;
    }

    // Connect and verify in DB
    await connectDB();
    const admin = await Admin.findOne({ username });
    if (!admin) return false;

    // Verify hmac signature
    const expectedSignature = crypto
      .createHmac("sha256", admin.passwordHash)
      .update(payload)
      .digest("hex");

    return signature === expectedSignature;
  } catch (error) {
    console.error("Verification error:", error);
    return false;
  }
};