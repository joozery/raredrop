import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import HoneycombReward from "@/models/HoneycombReward";
import ShopListing from "@/models/ShopListing";
import Box from "@/models/Box";
import Item from "@/models/Item";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectToDatabase();
    const rewards = await HoneycombReward.find()
      .populate("boxId", "name image price")
      .populate("itemId", "name image type coinRewardAmount rarityId")
      .populate({ path: "shopListingId", model: ShopListing, select: "title images price accounts" })
      .sort({ createdAt: -1 });
    return NextResponse.json(rewards);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { name, description, image, type, boxId, boxOpenTimes, itemId, shopListingId, honeyCost, stock, isActive } = body;

    if (!name || !type || !honeyCost) {
      return NextResponse.json({ error: "กรุณากรอก ชื่อ, ประเภท และค่าเหรียญ" }, { status: 400 });
    }
    if (type === "box" && !boxId) return NextResponse.json({ error: "กรุณาเลือกกล่องสุ่ม" }, { status: 400 });
    if (type === "item" && !itemId) return NextResponse.json({ error: "กรุณาเลือกไอเทม" }, { status: 400 });
    if (type === "shop" && !shopListingId) return NextResponse.json({ error: "กรุณาเลือกสินค้าจากร้านค้า" }, { status: 400 });

    await connectToDatabase();
    const reward = await HoneycombReward.create({
      name, description, image,
      type,
      boxId: type === "box" ? boxId : undefined,
      boxOpenTimes: type === "box" ? (Number(boxOpenTimes) || 1) : undefined,
      itemId: type === "item" ? itemId : undefined,
      shopListingId: type === "shop" ? shopListingId : undefined,
      honeyCost: Number(honeyCost),
      stock: Number(stock) || 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    const populated = await HoneycombReward.findById(reward._id)
      .populate("boxId", "name image price")
      .populate("itemId", "name image type coinRewardAmount rarityId")
      .populate({ path: "shopListingId", model: ShopListing, select: "title images price accounts" });

    return NextResponse.json(populated, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
