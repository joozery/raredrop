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

    const levelConfigs = await LevelConfig.find({}, "level tagImage").lean();
    const tagImageMap = new Map(levelConfigs.map((c: any) => [c.level, c.tagImage]));

    let targetRounds: any[] = [];

    if (day === "today") {
      const todayStart = startOfTodayThai();
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

      const matchQuery: any = {};
      if (roundId) {
        matchQuery._id = roundId;
      } else {
        matchQuery["participants.joinedAt"] = { $gte: todayStart, $lt: todayEnd };
      }

      targetRounds = await RedEnvelopeRound.find(matchQuery)
        .populate("itemId", "name")
        .populate("participants.userId", "name avatar vipLevel")
        .lean();
    } else {
      // day === "yesterday" / รอบก่อนหน้าของสล็อตเวลานั้น
      let currentScheduledAt: Date | null = null;

      if (matchScheduledAt) {
        const parsed = new Date(matchScheduledAt);
        if (!isNaN(parsed.getTime())) currentScheduledAt = parsed;
      }

      if (!currentScheduledAt && roundId) {
        const currentRound = await RedEnvelopeRound.findById(roundId, "scheduledAt").lean();
        if (currentRound?.scheduledAt) currentScheduledAt = new Date(currentRound.scheduledAt);
      }

      let prevRound: any = null;

      if (currentScheduledAt) {
        const curHour = currentScheduledAt.getHours();

        // 1. หา round ก่อนหน้าที่ scheduledAt < currentScheduledAt และมีผู้เข้าร่วม
        const allPrevRounds = await RedEnvelopeRound.find({
          scheduledAt: { $lt: currentScheduledAt },
          "participants.0": { $exists: true },
        })
          .sort({ scheduledAt: -1 })
          .populate("itemId", "name")
          .populate("participants.userId", "name avatar vipLevel")
          .lean();

        if (allPrevRounds.length > 0) {
          // พยายามหา round ที่เวลาใกล้เคียงช่วงเวลาเดียวกัน (เช่น 12:00 ±2 ชั่วโมง)
          const sameSlotRound = allPrevRounds.find((r: any) => {
            const h = new Date(r.scheduledAt).getHours();
            return Math.abs(h - curHour) <= 2;
          });

          prevRound = sameSlotRound || allPrevRounds[0];
        }
      }

      // ถ้ายังหาไม่เจอ (เช่น ไม่มี currentScheduledAt หรือไม่เจอรอบย้อนหลังที่มีผู้เข้าร่วม)
      if (!prevRound) {
        const fallbackQuery: any = { "participants.0": { $exists: true } };
        if (roundId) fallbackQuery._id = { $ne: roundId };

        prevRound = await RedEnvelopeRound.findOne(fallbackQuery)
          .sort({ scheduledAt: -1 })
          .populate("itemId", "name")
          .populate("participants.userId", "name avatar vipLevel")
          .lean();
      }

      if (prevRound) {
        targetRounds = [prevRound];
      }
    }

    const entries: any[] = [];
    for (const r of targetRounds) {
      if (!r.participants) continue;
      for (const p of r.participants) {
        if (!p.userId) continue;
        const joinedAt = p.joinedAt ? new Date(p.joinedAt) : new Date(r.scheduledAt);
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
