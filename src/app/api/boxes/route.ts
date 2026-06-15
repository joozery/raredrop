import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Box from "@/models/Box";
import "@/models/Category";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const featured = searchParams.get("featured");
    const limit = parseInt(searchParams.get("limit") || "20");

    await connectToDatabase();

    const query: any = { isActive: true };
    if (categoryId) query.categoryId = categoryId;
    if (featured === "true") query.isFeatured = true;

    const boxes = await Box.find(query)
      .populate("categoryId", "name")
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json(boxes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
