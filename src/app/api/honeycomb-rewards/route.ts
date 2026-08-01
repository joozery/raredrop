import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import HoneycombReward from "@/models/HoneycombReward";
import Item from "@/models/Item";
import Rarity from "@/models/Rarity";
import Box from "@/models/Box";
import ShopListing from "@/models/ShopListing";

export async function GET() {
  try {
    await connectToDatabase();
    const rewards = await HoneycombReward.find({ isActive: true })
      .populate("boxId", "name image price")
      .populate({
        path: "itemId",
        model: Item,
        populate: { path: "rarityId", model: Rarity, select: "name color" },
      })
      .populate({ path: "shopListingId", model: ShopListing, select: "title images price accounts" })
      .sort({ honeyCost: 1 });

    const result = rewards.map((r: any) => {
      const obj = r.toObject();
      if (obj.type === "shop" && obj.shopListingId) {
        const unsold = (obj.shopListingId.accounts || []).filter((a: any) => !a.sold).length;
        obj.shopStock = unsold;
        delete obj.shopListingId.accounts;
      }
      return obj;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
