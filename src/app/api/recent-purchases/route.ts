import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Purchase from "@/models/Purchase";
import User from "@/models/User";

export async function GET() {
  try {
    await connectToDatabase();

    const purchases = await Purchase.find()
      .populate({ path: "userId", model: User, select: "name avatar" })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("-deliveredData")
      .lean();

    return NextResponse.json(purchases);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
