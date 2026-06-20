import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Item from "@/models/Item";
import Category from "@/models/Category"; // To ensure model is registered for populate
import Rarity from "@/models/Rarity";     // To ensure model is registered for populate
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { sendDiscordNewProductBroadcast } from "@/lib/discord";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');

    await connectToDatabase();
    
    let query: any = {};
    if (categoryId) query.categoryId = categoryId;

    const items = await Item.find(query)
      .populate('categoryId', 'name')
      .populate('rarityId', 'name color')
      .sort({ createdAt: -1 });

    return NextResponse.json(items);
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
    const { name, description, image, rarityId, categoryId, price, sellPrice, stock, unlimitedStock, contactChannels, isActive, type, coinRewardAmount } = body;
    const isCoinReward = type === "coin_reward";

    if (!name || (!isCoinReward && !image) || !rarityId || price === undefined) {
      return NextResponse.json({ error: "Name, image (for item type), rarity, and price are required" }, { status: 400 });
    }

    await connectToDatabase();
    const newItem = await Item.create({
      name,
      description,
      image: image || (isCoinReward ? "coin_reward" : ""),
      rarityId,
      categoryId: categoryId || undefined,
      price: Number(price),
      sellPrice: (sellPrice === undefined || sellPrice === null || sellPrice === "") ? undefined : Number(sellPrice),
      stock: isCoinReward ? 0 : (Number(stock) || 0),
      unlimitedStock: isCoinReward ? false : !!unlimitedStock,
      contactChannels: {
        discord: contactChannels?.discord !== false,
        livechat: contactChannels?.livechat !== false,
      },
      isActive: isActive !== undefined ? isActive : true,
      type: type || "item",
      coinRewardAmount: Number(coinRewardAmount) || 0,
    });

    const populatedItem = await Item.findById(newItem._id)
      .populate('categoryId', 'name')
      .populate('rarityId', 'name color');

    if (!isCoinReward && populatedItem?.isActive) {
      await sendDiscordNewProductBroadcast({
        name: populatedItem.name,
        price: populatedItem.price,
        image: populatedItem.image,
        productType: "item",
        stock: populatedItem.stock,
        unlimitedStock: populatedItem.unlimitedStock,
      });
    }

    return NextResponse.json(populatedItem, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
