import { NextRequest, NextResponse } from "next/server";
import { checkRepliesForLogs } from "@/lib/replyChecker";
import { verifyAuth } from "@/lib/utils";
import { connectDB } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    if (!(await verifyAuth(req))) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const result = await checkRepliesForLogs();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Check Replies API Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to check email replies." },
      { status: 500 }
    );
  }
}
