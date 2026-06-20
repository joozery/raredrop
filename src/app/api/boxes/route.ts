import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Box from "@/models/Box";
import Item from "@/models/Item";
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
      .populate({
        path: "items.itemId",
        model: Item,
      })
      .sort({ isFeatured: -1, createdAt: -1 })
      .lean();

    const mappedBoxes = boxes.map((box) => {
      const isOutOfStock = box.items?.some((bi: any) => {
        const item = bi.itemId as any;
        return item?.type !== "coin_reward" && !item?.unlimitedStock && item?.stock <= 0;
      });
      return { ...box, isOutOfStock };
    }).slice(0, limit);

    return NextResponse.json(mappedBoxes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
