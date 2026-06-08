import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Order from "@/models/Order";
import Item from "@/models/Item";
import Rarity from "@/models/Rarity";
import User from "@/models/User";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "newest";

    await connectToDatabase();

    const orders = await Order.find({ status: "active" })
      .populate({ path: "sellerId", model: User, select: "name avatar" })
      .populate({
        path: "itemId",
        model: Item,
        populate: { path: "rarityId", model: Rarity, select: "name color order" },
      })
      .sort(sort === "price_asc" ? { price: 1 } : sort === "price_desc" ? { price: -1 } : { createdAt: -1 });

    const filtered = search
      ? orders.filter((o: any) =>
          (o.itemId as any)?.name?.toLowerCase().includes(search.toLowerCase())
        )
      : orders;

    return NextResponse.json(filtered);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
