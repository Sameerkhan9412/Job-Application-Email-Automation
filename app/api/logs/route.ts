import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import EmailLog from "@/models/EmailLog";

export async function GET() {
  try {
    await connectDB();

    const logs = await EmailLog.find()
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json({
      success: true,
      logs,
    });
  } catch (error) {
    console.error("Logs API Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}