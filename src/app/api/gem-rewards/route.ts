import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import GemReward from "@/models/GemReward";
import Rarity from "@/models/Rarity";
import Item from "@/models/Item";
import Box from "@/models/Box";

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
      .sort({ gemCost: 1 });
    return NextResponse.json(rewards);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
