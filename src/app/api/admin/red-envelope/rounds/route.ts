import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import RedEnvelopeRound from "@/models/RedEnvelopeRound";
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
    const { label, image, rewardType, totalAmount, totalGemCoins, itemId, conditionAmount, conditionLevel, maxPeople, scheduledAt, endsAt } = body;

    if (!label || !scheduledAt || !endsAt) {
      return NextResponse.json({ error: "กรุณากรอกชื่อรอบและช่วงเวลาให้ครบ" }, { status: 400 });
    }
    if (!["cash", "item", "gemcoin"].includes(rewardType)) {
      return NextResponse.json({ error: "ประเภทรางวัลไม่ถูกต้อง" }, { status: 400 });
    }
    const people = Math.max(1, Number(maxPeople) || 1);
    if (rewardType === "cash") {
      const amt = Number(totalAmount);
      if (!amt || amt < people * 0.01) {
        return NextResponse.json({ error: `ยอดเงินรวมต้องอย่างน้อย ${(people * 0.01).toFixed(2)} บาท` }, { status: 400 });
      }
    } else if (rewardType === "gemcoin") {
      const gem = Number(totalGemCoins);
      if (!gem || gem < people) {
        return NextResponse.json({ error: `GemCoin รวมต้องอย่างน้อย ${people} (ให้ทุกคนได้อย่างน้อย 1 GEM)` }, { status: 400 });
      }
    } else if (!itemId) {
      return NextResponse.json({ error: "กรุณาเลือกไอเทมรางวัล" }, { status: 400 });
    }
    if (new Date(endsAt) <= new Date(scheduledAt)) {
      return NextResponse.json({ error: "เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม" }, { status: 400 });
    }

    await connectToDatabase();
    const allocTotal = rewardType === "cash" ? Number(totalAmount) : rewardType === "gemcoin" ? Number(totalGemCoins) : undefined;
    const { allocations, winnerSlot } = generateAllocations(rewardType, allocTotal, people);
    const round = await RedEnvelopeRound.create({
      label,
      image: image || undefined,
      rewardType,
      totalAmount: rewardType === "cash" ? Number(totalAmount) : undefined,
      totalGemCoins: rewardType === "gemcoin" ? Number(totalGemCoins) : undefined,
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

    const safeRound = round.toObject();
    delete safeRound.allocations;
    delete safeRound.winnerSlot;

    return NextResponse.json(safeRound, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
