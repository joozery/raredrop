import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import PromoCode from "@/models/PromoCode";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await connectToDatabase();
    const codes = await PromoCode.find()
      .populate("boxId", "name image price")
      .populate("itemId", "name image type coinRewardAmount rarityId")
      .sort({ createdAt: -1 });
    return NextResponse.json(codes);
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
    const { code, description, rewardType, rewardAmount, itemId, boxId, boxOpenTimes, maxUses, expiresAt, isActive } = body;

    if (!code || !rewardType) {
      return NextResponse.json({ error: "กรุณากรอกโค้ดและประเภทรางวัล" }, { status: 400 });
    }
    if ((rewardType === "coins" || rewardType === "gemCoins") && !rewardAmount) {
      return NextResponse.json({ error: "กรุณาระบุจำนวน" }, { status: 400 });
    }
    if (rewardType === "item" && !itemId) return NextResponse.json({ error: "กรุณาเลือกไอเทม" }, { status: 400 });
    if (rewardType === "box" && !boxId) return NextResponse.json({ error: "กรุณาเลือกกล่องสุ่ม" }, { status: 400 });

    await connectToDatabase();

    let promoCode;
    try {
      promoCode = await PromoCode.create({
        code: String(code).trim().toUpperCase(),
        description,
        rewardType,
        rewardAmount: ["coins", "gemCoins"].includes(rewardType) ? Number(rewardAmount) : undefined,
        itemId: rewardType === "item" ? itemId : undefined,
        boxId: rewardType === "box" ? boxId : undefined,
        boxOpenTimes: rewardType === "box" ? Number(boxOpenTimes) || 1 : undefined,
        maxUses: Number(maxUses) || 0,
        expiresAt: expiresAt || null,
        isActive: isActive !== undefined ? isActive : true,
      });
    } catch (err: any) {
      if (err?.code === 11000) return NextResponse.json({ error: "โค้ดนี้มีอยู่แล้ว" }, { status: 400 });
      throw err;
    }

    const populated = await PromoCode.findById(promoCode._id)
      .populate("boxId", "name image price")
      .populate("itemId", "name image type coinRewardAmount rarityId");

    return NextResponse.json(populated, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
