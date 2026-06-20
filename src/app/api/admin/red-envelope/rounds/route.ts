import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import RedEnvelopeRound from "@/models/RedEnvelopeRound";
// จำเป็นต้อง import ไว้เพื่อให้ mongoose ลงทะเบียน schema ก่อน populate "itemId" ด้านล่าง
import "@/models/RedEnvelopeItem";
import { generateAllocations } from "@/lib/redEnvelope";

function isAdmin(session: any) {
  return session && ["admin", "super_admin"].includes(session.user?.role);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const rounds = await RedEnvelopeRound.find()
      .populate("itemId", "name image")
      .populate("participants.userId", "name avatar")
      .sort({ scheduledAt: -1 })
      .lean();

    return NextResponse.json(rounds);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { label, image, rewardType, totalAmount, itemId, conditionAmount, conditionLevel, maxPeople, scheduledAt, endsAt } = body;

    if (!label || !scheduledAt || !endsAt) {
      return NextResponse.json({ error: "กรุณากรอกชื่อรอบและช่วงเวลาให้ครบ" }, { status: 400 });
    }
    if (!["cash", "item"].includes(rewardType)) {
      return NextResponse.json({ error: "ประเภทรางวัลไม่ถูกต้อง" }, { status: 400 });
    }
    const people = Math.max(1, Number(maxPeople) || 1);
    if (rewardType === "cash") {
      const amt = Number(totalAmount);
      if (!amt || amt < people * 0.01) {
        return NextResponse.json({ error: `ยอดเงินรวมต้องมากกว่าหรือเท่ากับ ${(people * 0.01).toFixed(2)} บาท (เผื่อให้ทุกคนได้อย่างน้อยคนละ 0.01 บาท)` }, { status: 400 });
      }
    } else if (!itemId) {
      return NextResponse.json({ error: "กรุณาเลือกไอเทมรางวัล" }, { status: 400 });
    }
    if (new Date(endsAt) <= new Date(scheduledAt)) {
      return NextResponse.json({ error: "เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม" }, { status: 400 });
    }

    await connectToDatabase();
    const { allocations, winnerSlot } = generateAllocations(rewardType, rewardType === "cash" ? Number(totalAmount) : undefined, people);
    const round = await RedEnvelopeRound.create({
      label,
      image: image || undefined,
      rewardType,
      totalAmount: rewardType === "cash" ? Number(totalAmount) : undefined,
      itemId: rewardType === "item" ? itemId : undefined,
      conditionAmount: Number(conditionAmount) || 0,
      conditionLevel: Number(conditionLevel) || 0,
      maxPeople: people,
      scheduledAt: new Date(scheduledAt),
      endsAt: new Date(endsAt),
      status: "scheduled",
      participants: [],
      allocations,
      winnerSlot,
    });

    // ห้ามรั่วผลสุ่มที่เตรียมไว้ล่วงหน้าออกไปฝั่ง client (เฉลยรางวัลก่อนเวลา) — select:false ที่ schema ป้องกันได้แค่ตอน query ใหม่ ไม่ป้องกัน document ที่เพิ่ง create สดๆ
    const safeRound = round.toObject();
    delete safeRound.allocations;
    delete safeRound.winnerSlot;

    return NextResponse.json(safeRound, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
