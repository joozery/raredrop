import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import ShopListing from "@/models/ShopListing";
import ShopCategory from "@/models/ShopCategory";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    await connectToDatabase();

    const query: any = { status: "active" };
    if (slug) {
      let cat = await ShopCategory.findOne({ slug, isActive: { $ne: false } });
      if (!cat) {
        const all = await ShopCategory.find({ isActive: { $ne: false } }).select("_id name slug");
        cat = all.find((c: any) =>
          (c.slug || c.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")) === slug
        ) || null;
      }
      if (cat) query.categoryId = cat._id;
      else return NextResponse.json([]);
    }

    const listings = await ShopListing.find(query).sort({ order: 1, createdAt: -1 });

    // strip account data — only expose stock count
    const safe = listings.map((l: any) => ({
      _id: l._id,
      title: l.title,
      description: l.description,
      images: l.images,
      price: l.price,
      stock: l.accounts.filter((a: any) => !a.sold).length,
      totalStock: l.accounts.length,
      liveChatEnabled: l.liveChatEnabled,
      youtubeUrl: l.youtubeUrl,
      categoryId: l.categoryId ? String(l.categoryId) : null,
      isFeatured: !!l.isFeatured,
      requireUid: !!l.requireUid,
      uidLabel: l.uidLabel || "UID / ไอดีผู้เล่น",
      installmentEnabled: !!l.installmentEnabled,
      order: l.order ?? 0,
      createdAt: l.createdAt,
    }));

    return NextResponse.json(safe);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
