import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import GemReward from "@/models/GemReward";
import BoxCredit from "@/models/BoxCredit";
import Inventory from "@/models/Inventory";
import User from "@/models/User";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
    }
    const { id: rewardId } = await params;
    const userId = (session.user as any).id;

    await connectToDatabase();

    const reward = await GemReward.findById(rewardId);
    if (!reward || !reward.isActive) {
      return NextResponse.json({ error: "ไม่พบรางวัลนี้" }, { status: 404 });
    }

    // เช็ค stock
    if (reward.stock > 0) {
      const fresh = await GemReward.findOneAndUpdate(
        { _id: rewardId, stock: { $gt: 0 } },
        { $inc: { stock: -1 } },
        { new: true }
      );
      if (!fresh) {
        return NextResponse.json({ error: "รางวัลนี้หมดแล้ว" }, { status: 400 });
      }
    }

    // เช็ค gemCoins
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    if (user.gemCoins < reward.gemCost) {
      // คืน stock ถ้าหักไปแล้ว
      if (reward.stock > 0) {
        await GemReward.findByIdAndUpdate(rewardId, { $inc: { stock: 1 } });
      }
      return NextResponse.json({ error: `GemCoin ไม่เพียงพอ (มี ${user.gemCoins} / ต้องการ ${reward.gemCost})` }, { status: 400 });
    }

    // หัก gemCoins
    await User.findByIdAndUpdate(userId, { $inc: { gemCoins: -reward.gemCost } });

    // มอบรางวัล
    if (reward.type === "box") {
      const times = reward.boxOpenTimes || 1;
      await BoxCredit.findOneAndUpdate(
        { userId, boxId: reward.boxId },
        { $inc: { credits: times } },
        { upsert: true, new: true }
      );
    } else if (reward.type === "item") {
      await Inventory.create({ userId, itemId: reward.itemId, status: "kept" });
    }

    const updatedUser = await User.findById(userId);

    return NextResponse.json({
      success: true,
      reward: { name: reward.name, type: reward.type },
      gemCoinsLeft: updatedUser!.gemCoins,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
