import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB } from "@/lib/db";
import Admin from "@/models/Admin";

const hashPassword = (pwd: string): string => {
  return crypto.createHash("sha256").update(pwd).digest("hex");
};

export async function GET(req: NextRequest) {
  try {
    const authRequired = process.env.DISABLE_AUTH !== "true";
    return NextResponse.json({
      success: true,
      authRequired,
    });
  } catch (error) {
    console.error("Auth GET Error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username and password are required" },
        { status: 400 }
      );
    }

    const envUsername = (process.env.ADMIN_USERNAME || "sameer").trim();
    const envPassword = process.env.ADMIN_PASSWORD || "Sameer@9412";
    const envPasswordHash = hashPassword(envPassword);

    // Auto-seed/sync admin in database with environment variables
    let currentAdmin = await Admin.findOne({ username: envUsername });
    if (!currentAdmin) {
      // Clear other admins to keep credentials synchronized with environment config
      await Admin.deleteMany({});
      currentAdmin = await Admin.create({
        username: envUsername,
        passwordHash: envPasswordHash,
      });
    } else if (currentAdmin.passwordHash !== envPasswordHash) {
      currentAdmin.passwordHash = envPasswordHash;
      await currentAdmin.save();
    }

    const admin = await Admin.findOne({ username: username.trim() });
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Invalid username or password" },
        { status: 401 }
      );
    }

    const inputHash = hashPassword(password);
    if (inputHash !== admin.passwordHash) {
      return NextResponse.json(
        { success: false, message: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Generate secure session token:
    // JSON containing username & expiry timestamp signed with the passwordHash
    const payload = JSON.stringify({
      username: admin.username,
      exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours expiry
    });
    
    // We sign it using the admin's passwordHash as the HMAC secret
    const signature = crypto
      .createHmac("sha256", admin.passwordHash)
      .update(payload)
      .digest("hex");

    const token = Buffer.from(
      JSON.stringify({
        payload,
        signature,
      })
    ).toString("base64");

    return NextResponse.json({
      success: true,
      token,
    });
  } catch (error: any) {
    console.error("Auth POST Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
