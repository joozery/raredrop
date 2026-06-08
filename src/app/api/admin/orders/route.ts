import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Order from "@/models/Order";
import User from "@/models/User";
import Item from "@/models/Item";
import Rarity from "@/models/Rarity";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    await connectToDatabase();
    
    let query: any = {};
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate({ path: 'sellerId', model: User, select: 'name avatar' })
      .populate({ path: 'buyerId', model: User, select: 'name avatar' })
      .populate({ 
        path: 'itemId', 
        model: Item, 
        select: 'name image price rarityId',
        populate: { path: 'rarityId', model: Rarity, select: 'name color' }
      })
      .sort({ createdAt: -1 })
      .limit(200);

    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
