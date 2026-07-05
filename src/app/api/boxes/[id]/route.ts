import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Box from "@/models/Box";
import Item from "@/models/Item";
import Rarity from "@/models/Rarity";
import Category from "@/models/Category";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import PityCounter from "@/models/PityCounter";
import BoxCredit from "@/models/BoxCredit";
import FlashSale from "@/models/FlashSale";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const box = await Box.findById(id)
      .populate("categoryId", "name")
      .populate({
        path: "items.itemId",
        model: Item,
        populate: { path: "rarityId", model: Rarity, select: "name color order backgroundImage" },
      });

    if (!box || !box.isActive) {
      return NextResponse.json({ error: "ไม่พบกล่องสุ่มนี้" }, { status: 404 });
    }

    // ดึง pity counter และ box credit ถ้า login อยู่
    let pityCount = 0;
    let freeCredits = 0;
    try {
      const session = await getServerSession(authOptions);
      const userId = (session?.user as any)?.id;
      if (userId) {
        const [pity, credit] = await Promise.all([
          PityCounter.findOne({ userId, boxId: id }),
          BoxCredit.findOne({ userId, boxId: id }),
        ]);
        pityCount = pity?.count || 0;
        freeCredits = credit?.credits || 0;
      }
    } catch {}

    const now = new Date();
    const flashSale = await FlashSale.findOne({ boxId: id, isActive: true, endsAt: { $gt: now } });
    const flashSaleData = flashSale
      ? { salePrice: flashSale.salePrice, endsAt: flashSale.endsAt }
      : null;

    return NextResponse.json({ ...box.toObject(), pityCount, freeCredits, flashSale: flashSaleData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
