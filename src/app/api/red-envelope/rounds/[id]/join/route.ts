import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import RedEnvelopeRound from "@/models/RedEnvelopeRound";
import RedEnvelopeItem from "@/models/RedEnvelopeItem";
import User from "@/models/User";
import { ensureRoundStatus, getTodaySpend, resolveRoundRewards } from "@/lib/redEnvelope";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนร่วมรับรางวัล" }, { status: 401 });

    const { id } = await params;
    await connectToDatabase();

    const round = await RedEnvelopeRound.findById(id);
    if (!round) return NextResponse.json({ error: "ไม่พบรอบนี้" }, { status: 404 });

    await ensureRoundStatus(round);
    if (round.status !== "open") {
      return NextResponse.json({ error: round.status === "scheduled" ? "รอบนี้ยังไม่เริ่ม" : "รอบนี้ปิดรับแล้ว" }, { status: 400 });
    }

    const todaySpend = await getTodaySpend(userId);
    if (todaySpend < round.conditionAmount) {
      return NextResponse.json({ error: `ต้องมียอดใช้จ่ายวันนี้อย่างน้อย ฿${round.conditionAmount.toLocaleString()} (ตอนนี้ ฿${todaySpend.toLocaleString()})` }, { status: 400 });
    }

    if (round.conditionLevel > 0) {
      const me = await User.findById(userId).select("vipLevel");
      const myLevel = me?.vipLevel || 1;
      if (myLevel < round.conditionLevel) {
        return NextResponse.json({ error: `ต้องมีเลเวลอย่างน้อย Lv.${round.conditionLevel} (ตอนนี้ Lv.${myLevel})` }, { status: 400 });
      }
    }

    // จองช่องแบบ atomic — ใครกดถึงก่อนได้ช่องก่อน กันชนกันด้วย $expr เช็คจำนวนช่องคงเหลือ ณ ตอนอัปเดตจริง
    // ยังไม่เฉลยผล — แค่จองที่ไว้เฉยๆ รอครบคนหรือหมดเวลาแล้วค่อยจับรางวัลพร้อมกันทีเดียว
    const updated = await RedEnvelopeRound.findOneAndUpdate(
      {
        _id: id,
        status: "open",
        "participants.userId": { $ne: userId },
        $expr: { $lt: [{ $size: "$participants" }, "$maxPeople"] },
      },
      { $push: { participants: { userId, joinedAt: new Date() } } },
      { new: true }
    ).select("+allocations +winnerSlot");

    if (!updated) {
      const recheck = await RedEnvelopeRound.findById(id);
      if (recheck?.participants.some((p: any) => String(p.userId) === String(userId))) {
        return NextResponse.json({ error: "คุณเข้าร่วมรอบนี้ไปแล้ว" }, { status: 400 });
      }
      return NextResponse.json({ error: "ซองแดงรอบนี้เต็มแล้ว หรือปิดรับแล้ว กรุณาลองรอบอื่น" }, { status: 400 });
    }

    const mySlot = updated.participants.length - 1; // ช่องที่เพิ่ง push เข้าไป

    // ถ้าครบคนแล้วพอดี (คือคนที่กดทำให้เต็ม) — จับรางวัลให้ทุกคนพร้อมกันทันที ไม่ต้องรอ request ถัดไป
    if (updated.participants.length >= updated.maxPeople) {
      await resolveRoundRewards(updated);
    }

    const me = updated.participants[mySlot];
    const result: any = { joined: true, rewardType: updated.rewardType, pending: me.rewardAmount === undefined && me.isWinner === undefined };

    if (!result.pending) {
      if (updated.rewardType === "cash") {
        result.rewardAmount = me.rewardAmount;
      } else {
        result.isWinner = me.isWinner;
        if (me.isWinner) {
          const itemDoc = await RedEnvelopeItem.findById(updated.itemId).select("name image");
          result.itemName = itemDoc?.name;
          result.itemImage = itemDoc?.image;
        }
      }
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด: " + error.message }, { status: 500 });
  }
}
