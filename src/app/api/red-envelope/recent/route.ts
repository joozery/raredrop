import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import RedEnvelopeRound from "@/models/RedEnvelopeRound";
// จำเป็นต้อง import ไว้เพื่อให้ mongoose ลงทะเบียน schema ก่อน populate "itemId" ด้านล่าง
import "@/models/RedEnvelopeItem";
import LevelConfig from "@/models/LevelConfig";
import { startOfTodayThai } from "@/lib/redEnvelope";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const day = searchParams.get("day") === "yesterday" ? "yesterday" : "today";
    const roundId = searchParams.get("roundId");

    await connectToDatabase();

    const todayStart = startOfTodayThai();
    const rangeStart = day === "today" ? todayStart : new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const rangeEnd = day === "today" ? new Date(todayStart.getTime() + 24 * 60 * 60 * 1000) : todayStart;

    // แจกสดทันทีตอนกดรับ — ไม่ต้องรอรอบปิด
    // ถ้าระบุ roundId มา ให้ดูเฉพาะรอบนั้นรอบเดียว (ผู้เข้าร่วมของซองที่กำลังเปิดดูอยู่) ไม่ปนกับรอบอื่น
    const matchQuery: any = { "participants.joinedAt": { $gte: rangeStart, $lt: rangeEnd } };
    if (roundId) matchQuery._id = roundId;

    const rounds = await RedEnvelopeRound.find(matchQuery)
      .populate("itemId", "name")
      .populate("participants.userId", "name avatar vipLevel")
      .lean();

    const levelConfigs = await LevelConfig.find({}, "level tagImage").lean();
    const tagImageMap = new Map(levelConfigs.map((c: any) => [c.level, c.tagImage]));

    const entries: any[] = [];
    for (const r of rounds as any[]) {
      for (const p of r.participants) {
        if (!p.userId) continue;
        if (new Date(p.joinedAt) < rangeStart || new Date(p.joinedAt) >= rangeEnd) continue;
        if (r.rewardType === "cash" && p.rewardAmount === undefined) continue;
        entries.push({
          userId: p.userId._id,
          name: p.userId.name,
          avatar: p.userId.avatar,
          vipLevel: p.userId.vipLevel,
          tagImage: p.userId.vipLevel ? tagImageMap.get(p.userId.vipLevel) : undefined,
          time: p.joinedAt,
          rewardType: r.rewardType,
          rewardAmount: p.rewardAmount,
          isWinner: r.rewardType === "item" ? !!p.isWinner : undefined,
          itemName: r.itemId?.name,
        });
      }
    }

    entries.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return NextResponse.json({ entries: entries.slice(0, 100), total: entries.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
