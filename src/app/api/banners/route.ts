import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Banner from "@/models/Banner";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = searchParams.get("page") || "shop";

    await connectToDatabase();
    const banners = await Banner.find({ page, isActive: true })
      .select("image link order")
      .sort({ order: 1, createdAt: -1 });

    return NextResponse.json(banners);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
