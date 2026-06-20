import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import ShopCategory from "@/models/ShopCategory";

export async function GET() {
  try {
    await connectToDatabase();
    const categories = await ShopCategory.find({ isActive: { $ne: false } })
      .select("name image order")
      .sort({ order: 1, createdAt: -1 });
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
