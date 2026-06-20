import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import RedEnvelopeRound from "@/models/RedEnvelopeRound";
import RedEnvelopeItem from "@/models/RedEnvelopeItem";
import User from "@/models/User";
import { ensureRoundStatus, getTodaySpend, creditCashReward, creditItemReward } from "@/lib/redEnvelope";

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
    const me = updated.participants[mySlot];

    let result: any = { joined: true, rewardType: updated.rewardType };
    let amountBaht = 0;
    let isWinner = false;

    if (updated.rewardType === "cash") {
      const amountSatang = updated.allocations?.[mySlot] ?? 0;
      amountBaht = amountSatang / 100;
      me.rewardAmount = amountBaht;
      result.rewardAmount = amountBaht;
    } else {
      isWinner = mySlot === updated.winnerSlot;
      me.isWinner = isWinner;
      const itemDoc = await RedEnvelopeItem.findById(updated.itemId).select("name image");
      result.isWinner = isWinner;
      result.itemName = itemDoc?.name;
      result.itemImage = itemDoc?.image;
    }

    // ปิดรอบทันทีถ้าช่องเต็มแล้ว หรือไอเทมมีคนได้ไปแล้ว — ไม่ต้องรอใครอีก แล้วบันทึกทุกอย่างในครั้งเดียว
    const shouldClose = updated.participants.length >= updated.maxPeople || (updated.rewardType === "item" && isWinner);
    if (shouldClose) {
      updated.status = "resolved";
      updated.resolvedAt = new Date();
    }
    await updated.save();

    if (updated.rewardType === "cash") {
      await creditCashReward(userId, amountBaht, updated.label, updated._id as any);
    } else if (isWinner && result.itemName) {
      await creditItemReward(userId, result.itemName, updated.label);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด: " + error.message }, { status: 500 });
  }
}
