import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Inventory from "@/models/Inventory";
import User from "@/models/User";
import Item from "@/models/Item";
import Rarity from "@/models/Rarity";

export async function GET() {
  try {
    await connectToDatabase();

    const openings = await Inventory.find()
      .populate({ path: "userId", model: User, select: "name avatar" })
      .populate({
        path: "itemId",
        model: Item,
        select: "name image price",
        populate: { path: "rarityId", model: Rarity, select: "name color" },
      })
      .sort({ acquiredAt: -1 })
      .limit(10)
      .lean();

    return NextResponse.json(openings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
