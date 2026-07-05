import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import EmailLog from "@/models/EmailLog";
import { verifyAuth } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    if (!(await verifyAuth(req))) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const validPage = page > 0 ? page : 1;
    const validLimit = limit > 0 ? limit : 10;
    const skip = (validPage - 1) * validLimit;

    const total = await EmailLog.countDocuments();
    const logs = await EmailLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(validLimit);

    return NextResponse.json({
      success: true,
      logs,
      total,
      page: validPage,
      limit: validLimit,
      totalPages: Math.ceil(total / validLimit),
    });
  } catch (error) {
    console.error("Logs API Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch logs" },
      { status: 500 }
    );
  }
}