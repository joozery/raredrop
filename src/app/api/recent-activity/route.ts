import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import RecentActivity from "@/models/RecentActivity";

// Initial snapshot for the homepage live feed. New items arrive via Socket.IO
// ("activity:new"); this endpoint just seeds the list on first load.
export async function GET(req: Request) {
  try {
    await connectToDatabase();

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "12", 10);

    const activities = await RecentActivity.find()
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 50))
      .lean();

    return NextResponse.json(activities);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
