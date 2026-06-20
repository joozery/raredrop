import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import ShopListing from "@/models/ShopListing";

export async function GET() {
  try {
    await connectToDatabase();
    const listings = await ShopListing.find({ status: "active" }).sort({ order: 1, createdAt: -1 });

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
      createdAt: l.createdAt,
    }));

    return NextResponse.json(safe);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
