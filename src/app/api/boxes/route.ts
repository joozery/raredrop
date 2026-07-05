import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Box from "@/models/Box";
import Item from "@/models/Item";
import FlashSale from "@/models/FlashSale";
import Category from "@/models/Category";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("categoryId");
    const categorySlug = searchParams.get("slug");
    const featured = searchParams.get("featured");
    const limit = parseInt(searchParams.get("limit") || "20");

    await connectToDatabase();

    const query: any = { isActive: true };
    if (categoryId) query.categoryId = categoryId;
    if (featured === "true") query.isFeatured = true;

    if (categorySlug) {
      // หา category จาก slug field ก่อน ถ้าไม่เจอ fallback ด้วย auto-generated slug จากชื่อ
      let cat = await Category.findOne({ slug: categorySlug, isActive: { $ne: false } });
      if (!cat) {
        const allCats = await Category.find({ isActive: { $ne: false } }).select("_id name slug");
        cat = allCats.find((c: any) =>
          (c.slug || c.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")) === categorySlug
        ) || null;
      }
      if (cat) query.categoryId = cat._id;
      else return NextResponse.json([]);
    }

    const boxes = await Box.find(query)
      .populate("categoryId", "name")
      .populate({
        path: "items.itemId",
        model: Item,
      })
      .sort({ isFeatured: -1, createdAt: -1 })
      .lean();

    const now = new Date();
    const boxIds = boxes.map((b) => b._id);
    const flashSales = await FlashSale.find({ boxId: { $in: boxIds }, isActive: true, endsAt: { $gt: now } }).lean();
    const flashMap = new Map(flashSales.map((f: any) => [String(f.boxId), f]));

    const mappedBoxes = boxes.map((box) => {
      const isOutOfStock = box.items?.some((bi: any) => {
        const item = bi.itemId as any;
        return item?.type !== "coin_reward" && !item?.unlimitedStock && item?.stock <= 0;
      });
      const fs = flashMap.get(String(box._id));
      return {
        ...box,
        isOutOfStock,
        flashSale: fs ? { salePrice: (fs as any).salePrice, endsAt: (fs as any).endsAt } : null,
      };
    });

    mappedBoxes.sort((a, b) => {
      if (a.isOutOfStock === b.isOutOfStock) return 0;
      return a.isOutOfStock ? 1 : -1;
    });

    return NextResponse.json(mappedBoxes.slice(0, limit));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
