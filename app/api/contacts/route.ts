import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import EmailLog from "@/models/EmailLog";

export async function GET() {
  try {
    console.log("URL:", process.env.SHEET_API_URL);

    const res = await fetch(process.env.SHEET_API_URL!, {
      cache: "no-store",
    });

    console.log("STATUS:", res.status);

    const text = await res.text();
    console.log("RAW RESPONSE:", text);

    // Try parsing
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error("JSON PARSE ERROR:", err);
      return NextResponse.json(
        { success: false, message: "Invalid JSON from Apps Script" },
        { status: 500 }
      );
    }

    console.log("PARSED:", data);

    // Fetch latest sent dates from MongoDB
    let latestSentDates: Record<string, string> = {};
    try {
      await connectDB();
      const logs = await EmailLog.aggregate([
        {
          $group: {
            _id: { $toLower: "$email" },
            lastSentAt: { $max: "$lastSentAt" },
          },
        },
      ]);
      logs.forEach((log) => {
        if (log._id && log.lastSentAt) {
          latestSentDates[log._id] = log.lastSentAt.toISOString();
        }
      });
    } catch (dbErr) {
      console.error("Error fetching latest sent dates from DB:", dbErr);
    }

    return NextResponse.json({
      success: true,
      count: data.data?.length || 0,
      contacts: data.data || [],
      latestSentDates,
    });

  } catch (error) {
    console.error("Contacts API Error:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}