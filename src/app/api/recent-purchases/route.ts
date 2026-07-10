import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Purchase from "@/models/Purchase";
import User from "@/models/User";

export async function GET(req: Request) {
  try {
    await connectToDatabase();

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);

    const purchases = await Purchase.find()
      .populate({ path: "userId", model: User, select: "name avatar" })
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 100))
      .select("-deliveredData")
      .lean();

    return NextResponse.json(purchases);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
