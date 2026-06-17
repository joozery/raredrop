import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import GemReward from "@/models/GemReward";
import Rarity from "@/models/Rarity";
import Item from "@/models/Item";
import Box from "@/models/Box";
import ShopListing from "@/models/ShopListing";

export async function GET() {
  try {
    await connectToDatabase();
    const rewards = await GemReward.find({ isActive: true })
      .populate("boxId", "name image price")
      .populate({
        path: "itemId",
        model: Item,
        populate: { path: "rarityId", model: Rarity, select: "name color" },
      })
      .populate("shopListingId", "title images price accounts")
      .sort({ gemCost: 1 });

    // คำนวณ stock จริงสำหรับ type=shop (นับ account ที่ยังไม่ขาย)
    const result = rewards.map((r: any) => {
      const obj = r.toObject();
      if (obj.type === "shop" && obj.shopListingId) {
        const unsold = (obj.shopListingId.accounts || []).filter((a: any) => !a.sold).length;
        obj.shopStock = unsold;
        // ซ่อน account data ไม่ให้ client เห็น
        delete obj.shopListingId.accounts;
      }
      return obj;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
