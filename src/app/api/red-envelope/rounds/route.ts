import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import RedEnvelopeRound from "@/models/RedEnvelopeRound";
import User from "@/models/User";
// จำเป็นต้อง import ไว้เพื่อให้ mongoose ลงทะเบียน schema ก่อน populate "itemId" ด้านล่าง
import "@/models/RedEnvelopeItem";
import { ensureRoundStatus, getTodaySpend, startOfTodayThai } from "@/lib/redEnvelope";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    await connectToDatabase();

    const todayStart = startOfTodayThai();
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    let rounds = await RedEnvelopeRound.find({
      scheduledAt: { $lt: todayEnd },
      endsAt: { $gte: todayStart },
      status: { $ne: "cancelled" },
      isActive: true,
    })
      .populate("itemId", "name image")
      .sort({ scheduledAt: 1 });

    rounds = await Promise.all(rounds.map((r) => ensureRoundStatus(r)));
    // แสดง resolved rounds ต่อจนหมดเวลา endsAt — ให้ผู้เข้าร่วมเห็นผลรางวัล
    // หายเองเมื่อ endsAt ผ่านไปแล้ว (query ด้านบนจะไม่ดึงมาอีก)
    const now = new Date();
    rounds = rounds.filter((r) => r.status !== "resolved" || r.endsAt >= now);

    const todaySpend = userId ? await getTodaySpend(userId) : 0;
    const myLevel = userId ? ((await User.findById(userId).select("vipLevel").lean<any>())?.vipLevel || 1) : 0;

    const result = rounds.map((r: any) => {
      const myEntry = userId ? r.participants.find((p: any) => String(p.userId) === String(userId)) : null;
      return {
        _id: r._id,
        label: r.label,
        image: r.image,
        rewardType: r.rewardType,
        totalAmount: r.totalAmount,
        item: r.itemId ? { name: r.itemId.name, image: r.itemId.image } : null,
        conditionAmount: r.conditionAmount,
        conditionLevel: r.conditionLevel,
        maxPeople: r.maxPeople,
        currentPeople: r.participants.length,
        scheduledAt: r.scheduledAt,
        endsAt: r.endsAt,
        status: r.status,
        joined: !!myEntry,
        // จับรางวัลพร้อมกันทีเดียวตอนครบคน/หมดเวลา — จะมีผลก็ต่อเมื่อรอบถูกจับรางวัลไปแล้วเท่านั้น
        myResult: myEntry && (myEntry.rewardAmount !== undefined || myEntry.isWinner !== undefined)
          ? { rewardAmount: myEntry.rewardAmount, isWinner: myEntry.isWinner }
          : null,
      };
    });

    return NextResponse.json({ rounds: result, todaySpend, myLevel });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
