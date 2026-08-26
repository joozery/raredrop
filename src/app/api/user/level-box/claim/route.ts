import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";
import Box from "@/models/Box";
import LevelBoxReward from "@/models/LevelBoxReward";
import LevelBoxClaim from "@/models/LevelBoxClaim";
import BoxCredit from "@/models/BoxCredit";
import { startOfTodayThai } from "@/lib/redEnvelope";
import { notify } from "@/lib/notify";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });

    await connectToDatabase();

    const user = await User.findById(userId).select("vipLevel");
    if (!user) return NextResponse.json({ error: "ไม่พบข้อมูลผู้ใช้" }, { status: 404 });
    const level = user.vipLevel || 1;

    const eligible = await LevelBoxReward.find({ isActive: true, minLevel: { $lte: level } })
      .populate("boxId", "name isActive")
      .sort({ minLevel: -1 })
      .limit(1);
    const reward = eligible[0];
    if (!reward || !reward.boxId || (reward.boxId as any).isActive === false) {
      return NextResponse.json({ error: "คุณยังไม่ปลดล็อกกล่องสุ่มฟรีประจำวัน" }, { status: 400 });
    }

    const alreadyClaimed = await LevelBoxClaim.findOne({
      userId,
      createdAt: { $gte: startOfTodayThai() },
    });
    if (alreadyClaimed) {
      return NextResponse.json({ error: "คุณรับสิทธิ์เปิดฟรีวันนี้ไปแล้ว กรุณากลับมาใหม่หลัง 00:00 น." }, { status: 400 });
    }

    const boxId = (reward.boxId as any)._id;
    const boxName = (reward.boxId as any).name || "กล่องสุ่ม";

    await LevelBoxClaim.create({ userId, boxId, level });
    await BoxCredit.findOneAndUpdate(
      { userId, boxId },
      { $inc: { credits: 1 } },
      { upsert: true }
    );
    await notify(
      userId,
      "รับสิทธิ์เปิดกล่องสุ่มฟรีประจำวัน!",
      `ได้สิทธิ์เปิดฟรี "${boxName}" 1 ครั้ง จากเลเวล ${level} — ไปเปิดได้เลย`,
      "success",
      `/boxes/${boxId}`
    );

    return NextResponse.json({ success: true, boxId: String(boxId), boxName });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
