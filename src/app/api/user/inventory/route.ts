import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import Inventory from "@/models/Inventory";
import Item from "@/models/Item";
import Rarity from "@/models/Rarity";
import Box from "@/models/Box";
import HoneycombItem from "@/models/HoneycombItem";
import HoneycombBox from "@/models/HoneycombBox";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();

    const inventories = await Inventory.find({ userId, status: { $in: ["kept", "market"] } })
      .populate({
        path: "itemId",
        model: Item,
        populate: { path: "rarityId", model: Rarity, select: "name color order" },
      })
      .populate({ path: "boxId", model: Box, select: "name image" })
      .sort({ acquiredAt: -1 })
      .lean();

    // Fix missing items (likely HoneycombItems instead of standard Items)
    for (let i = 0; i < inventories.length; i++) {
      const inv: any = inventories[i];
      if (!inv.itemId && inv._id) {
        // Fetch raw inventory to get the raw itemId ObjectId
        const rawInv = await Inventory.findById(inv._id).select("itemId boxId");
        if (rawInv && rawInv.itemId) {
          const hcItem = await HoneycombItem.findById(rawInv.itemId);
          if (hcItem) {
            let color = "bg-slate-200 text-slate-700";
            let rName = "COMMON";
            if (hcItem.category === "legendary") { color = "bg-amber-100 text-amber-700 border-amber-300"; rName = "Legendary"; }
            if (hcItem.category === "epic") { color = "bg-purple-100 text-purple-700 border-purple-300"; rName = "Epic"; }
            if (hcItem.category === "rare") { color = "bg-blue-100 text-blue-700 border-blue-300"; rName = "Rare"; }

            inv.itemId = {
              _id: hcItem._id,
              name: hcItem.name,
              image: hcItem.image || "/product/pokemon.webp",
              price: hcItem.value || 0,
              sellPrice: hcItem.value || 0,
              contactChannels: { discord: true, livechat: true },
              type: hcItem.type,
              rarityId: {
                name: rName,
                color: color
              }
            };
          }
        }
        
        // Also populate HoneycombBox if boxId is missing
        if (!inv.boxId && rawInv && rawInv.boxId) {
          const hcBox = await HoneycombBox.findById(rawInv.boxId);
          if (hcBox) {
            inv.boxId = {
              _id: hcBox._id,
              name: hcBox.name,
              image: hcBox.image || "/product/pokemon.webp"
            };
          }
        }
      }
    }

    return NextResponse.json(inventories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
