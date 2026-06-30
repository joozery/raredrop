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
    const matchScheduledAt = searchParams.get("matchScheduledAt");

    await connectToDatabase();

    const todayStart = startOfTodayThai();
    const rangeStart = day === "today" ? todayStart : new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const rangeEnd = day === "today" ? new Date(todayStart.getTime() + 24 * 60 * 60 * 1000) : todayStart;

    const matchQuery: any = { "participants.joinedAt": { $gte: rangeStart, $lt: rangeEnd } };

    if (day === "today" && roundId) {
      // today: กรองเฉพาะ round นั้น
      matchQuery._id = roundId;
    } else if (day === "yesterday" && matchScheduledAt) {
      // yesterday: หา round เมื่อวานที่ scheduledAt ตรงกับ round วันนี้ (±60 นาที)
      const todayTime = new Date(matchScheduledAt);
      if (!isNaN(todayTime.getTime())) {
        const yesterdayTime = new Date(todayTime.getTime() - 24 * 60 * 60 * 1000);
        const window = 60 * 60 * 1000;
        matchQuery.scheduledAt = { $gte: new Date(yesterdayTime.getTime() - window), $lte: new Date(yesterdayTime.getTime() + window) };
      }
    }

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
        if (!p.joinedAt) continue;
        const joinedAt = new Date(p.joinedAt);
        if (joinedAt < rangeStart || joinedAt >= rangeEnd) continue;
        const pending = p.rewardAmount === undefined && p.isWinner === undefined;
        entries.push({
          userId: p.userId._id,
          name: p.userId.name,
          avatar: p.userId.avatar,
          vipLevel: p.userId.vipLevel,
          tagImage: p.userId.vipLevel ? tagImageMap.get(p.userId.vipLevel) : undefined,
          time: joinedAt,
          rewardType: r.rewardType,
          pending,
          rewardAmount: p.rewardAmount,
          isWinner: r.rewardType === "item" ? !!p.isWinner : undefined,
          itemName: r.itemId?.name,
        });
      }
    }

    entries.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    const res = NextResponse.json({ entries: entries.slice(0, 100), total: entries.length });
    res.headers.set("Cache-Control", "no-store, max-age=0");
    return res;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
