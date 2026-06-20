import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import RedEnvelopeRound from "@/models/RedEnvelopeRound";
import { generateAllocations } from "@/lib/redEnvelope";

function isAdmin(session: any) {
  return session && ["admin", "super_admin"].includes(session.user?.role);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { label, image, rewardType, totalAmount, itemId, conditionAmount, conditionLevel, maxPeople, scheduledAt, endsAt } = body;

    await connectToDatabase();
    const existing = await RedEnvelopeRound.findById(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.participants.length > 0) {
      return NextResponse.json({ error: "แก้ไขไม่ได้ มีคนเข้าร่วมรอบนี้แล้ว" }, { status: 400 });
    }

    const people = Math.max(1, Number(maxPeople) || existing.maxPeople);
    const update: any = {};
    if (label !== undefined) update.label = label;
    if (image !== undefined) update.image = image || null;
    if (rewardType !== undefined) update.rewardType = rewardType;
    const effectiveType = rewardType !== undefined ? rewardType : existing.rewardType;
    if (effectiveType === "cash") {
      const amt = totalAmount !== undefined ? Number(totalAmount) : existing.totalAmount;
      if (!amt || amt < people * 0.01) {
        return NextResponse.json({ error: `ยอดเงินรวมต้องมากกว่าหรือเท่ากับ ${(people * 0.01).toFixed(2)} บาท` }, { status: 400 });
      }
      update.totalAmount = amt;
      update.itemId = null;
    } else if (effectiveType === "item") {
      const it = itemId !== undefined ? itemId : existing.itemId;
      if (!it) return NextResponse.json({ error: "กรุณาเลือกไอเทมรางวัล" }, { status: 400 });
      update.itemId = it;
      update.totalAmount = null;
    }
    if (conditionAmount !== undefined) update.conditionAmount = Number(conditionAmount) || 0;
    if (conditionLevel !== undefined) update.conditionLevel = Number(conditionLevel) || 0;
    if (maxPeople !== undefined) update.maxPeople = people;
    if (scheduledAt !== undefined) update.scheduledAt = new Date(scheduledAt);
    if (endsAt !== undefined) update.endsAt = new Date(endsAt);

    const finalEndsAt = update.endsAt || existing.endsAt;
    const finalStartsAt = update.scheduledAt || existing.scheduledAt;
    if (new Date(finalEndsAt) <= new Date(finalStartsAt)) {
      return NextResponse.json({ error: "เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม" }, { status: 400 });
    }

    // ไม่มีคนเข้าร่วมเลย (เช็คไว้ด้านบนแล้ว) — สุ่มผลลัพธ์ใหม่ทั้งหมดให้ตรงกับ totalAmount/maxPeople/ประเภทล่าสุดเสมอ
    const { allocations, winnerSlot } = generateAllocations(effectiveType, update.totalAmount ?? undefined, people);
    update.allocations = allocations ?? null;
    update.winnerSlot = winnerSlot ?? null;

    const round = await RedEnvelopeRound.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    const safeRound = round!.toObject();
    delete safeRound.allocations;
    delete safeRound.winnerSlot;
    return NextResponse.json(safeRound);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectToDatabase();
    const existing = await RedEnvelopeRound.findById(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (existing.participants.length > 0) {
      return NextResponse.json({ error: "ลบไม่ได้ มีคนเข้าร่วมรอบนี้แล้ว" }, { status: 400 });
    }
    await RedEnvelopeRound.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
