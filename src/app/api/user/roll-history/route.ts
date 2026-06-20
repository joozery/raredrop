import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import Inventory from "@/models/Inventory";
import Item from "@/models/Item";
import Rarity from "@/models/Rarity";
import Box from "@/models/Box";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();

    const history = await Inventory.find({ userId, boxId: { $ne: null } })
      .populate({
        path: "itemId",
        model: Item,
        select: "name image price rarityId",
        populate: { path: "rarityId", model: Rarity, select: "name color order" },
      })
      .populate({ path: "boxId", model: Box, select: "name image" })
      .sort({ acquiredAt: -1 })
      .limit(100);

    return NextResponse.json(history);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
