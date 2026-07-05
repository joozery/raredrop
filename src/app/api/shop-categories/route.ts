import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import ShopCategory from "@/models/ShopCategory";

export async function GET() {
  try {
    await connectToDatabase();
    const categories = await ShopCategory.find({ isActive: { $ne: false } })
      .select("name slug image order")
      .sort({ order: 1, createdAt: -1 });

    const result = categories.map((c) => ({
      ...c.toObject(),
      slug: c.slug || c.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
