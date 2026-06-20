import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import FlashSale from "@/models/FlashSale";
import Box from "@/models/Box";

export async function GET() {
  try {
    await connectToDatabase();

    const now = new Date();
    const sales = await FlashSale.find({ isActive: true, endsAt: { $gt: now } })
      .populate({ path: "boxId", model: Box, select: "name image price isActive" })
      .sort({ startsAt: 1, createdAt: -1 })
      .limit(8);

    const result = sales
      .filter((s: any) => s.boxId?.isActive)
      .map((s: any) => ({
        _id: s._id,
        boxId: s.boxId._id,
        name: s.boxId.name,
        image: s.boxId.image,
        originalPrice: s.boxId.price,
        salePrice: s.salePrice,
        startsAt: s.startsAt ?? null,
        endsAt: s.endsAt,
        discount: `-${Math.round((1 - s.salePrice / s.boxId.price) * 100)}%`,
      }));

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
