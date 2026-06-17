import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import GemReward from "@/models/GemReward";
import Box from "@/models/Box";
import Item from "@/models/Item";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectToDatabase();
    const rewards = await GemReward.find()
      .populate("boxId", "name image price")
      .populate("itemId", "name image type coinRewardAmount rarityId")
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
    const { name, description, image, type, boxId, boxOpenTimes, itemId, gemCost, stock, isActive } = body;

    if (!name || !type || !gemCost) {
      return NextResponse.json({ error: "กรุณากรอก ชื่อ, ประเภท และค่า GemCoin" }, { status: 400 });
    }
    if (type === "box" && !boxId) {
      return NextResponse.json({ error: "กรุณาเลือกกล่องสุ่ม" }, { status: 400 });
    }
    if (type === "item" && !itemId) {
      return NextResponse.json({ error: "กรุณาเลือกไอเทม" }, { status: 400 });
    }

    await connectToDatabase();
    const reward = await GemReward.create({
      name, description, image,
      type,
      boxId: type === "box" ? boxId : undefined,
      boxOpenTimes: type === "box" ? (Number(boxOpenTimes) || 1) : undefined,
      itemId: type === "item" ? itemId : undefined,
      gemCost: Number(gemCost),
      stock: Number(stock) || 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    const populated = await GemReward.findById(reward._id)
      .populate("boxId", "name image price")
      .populate("itemId", "name image type coinRewardAmount rarityId");

    return NextResponse.json(populated, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
