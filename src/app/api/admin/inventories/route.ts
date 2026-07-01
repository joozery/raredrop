import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Inventory from "@/models/Inventory";
import User from "@/models/User";
import Item from "@/models/Item";
import Box from "@/models/Box";
import Rarity from "@/models/Rarity";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    await connectToDatabase();
    
    let query: any = {};
    if (status) query.status = status;
    if (userId) query.userId = userId;

    const inventories = await Inventory.find(query)
      .populate({ path: 'userId', model: User, select: 'name email avatar' })
      .populate({ 
        path: 'itemId', 
        model: Item, 
        select: 'name image price rarityId',
        populate: { path: 'rarityId', model: Rarity, select: 'name color' }
      })
      .populate({ path: 'boxId', model: Box, select: 'name' })
      .sort({ acquiredAt: -1 })
      .limit(200); // Limit to prevent massive payload

    return NextResponse.json(inventories);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userId, itemId, status = "kept" } = body;

    if (!userId || !itemId) {
      return NextResponse.json({ error: "userId and itemId are required" }, { status: 400 });
    }

    await connectToDatabase();

    const inv = await Inventory.create({ userId, itemId, status });
    const populated = await Inventory.findById(inv._id)
      .populate({
        path: "itemId",
        model: Item,
        select: "name image price rarityId",
        populate: { path: "rarityId", model: Rarity, select: "name color" },
      });

    return NextResponse.json(populated, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
