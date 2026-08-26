import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";
import LevelBoxReward from "@/models/LevelBoxReward";
import LevelBoxClaim from "@/models/LevelBoxClaim";
import { startOfTodayThai } from "@/lib/redEnvelope";
import "@/models/Box";
import Item from "@/models/Item";
import Rarity from "@/models/Rarity";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });

    await connectToDatabase();

    const [user, rewards] = await Promise.all([
      User.findById(userId).select("vipLevel").lean(),
      LevelBoxReward.find({ isActive: true })
        .populate({
          path: "boxId",
          select: "name image price isActive items",
          populate: {
            path: "items.itemId",
            model: Item,
            select: "name image type coinRewardAmount rarityId",
            populate: { path: "rarityId", model: Rarity, select: "name color order" },
          },
        })
        .sort({ minLevel: 1 })
        .lean(),
    ]);
    if (!user) return NextResponse.json({ error: "ไม่พบข้อมูลผู้ใช้" }, { status: 404 });

    const level = (user as any).vipLevel || 1;
    const usable = rewards.filter((r: any) => r.boxId?.isActive !== false);
    const eligible = usable.filter((r: any) => r.minLevel <= level);
    const current = eligible.length > 0 ? eligible[eligible.length - 1] : null;
    const next = usable.find((r: any) => r.minLevel > level) || null;
    const milestones = usable.map((r: any) => ({
      minLevel: r.minLevel,
      box: r.boxId,
      unlocked: r.minLevel <= level,
      isCurrent: current ? r._id.toString() === current._id.toString() : false,
    }));

    let claimedToday = false;
    if (current) {
      const claim = await LevelBoxClaim.findOne({
        userId,
        createdAt: { $gte: startOfTodayThai() },
      }).lean();
      claimedToday = !!claim;
    }

    // เที่ยงคืนถัดไปตามเวลาไทย — สำหรับนับถอยหลังฝั่งหน้าบ้าน
    const resetAt = new Date(startOfTodayThai().getTime() + 24 * 60 * 60 * 1000);

    return NextResponse.json({
      level,
      reward: current
        ? { _id: current._id, minLevel: current.minLevel, box: current.boxId }
        : null,
      nextReward: next ? { minLevel: next.minLevel, box: next.boxId } : null,
      claimedToday,
      resetAt,
      milestones,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
