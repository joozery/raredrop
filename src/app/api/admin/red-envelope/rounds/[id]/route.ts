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
    const {
      label, image, rewardType, totalAmount, totalGemCoins, itemId, winnerCount, conditionAmount, conditionLevel,
      maxPeople, scheduledAt, endsAt, isActive, resetConfirm,
    } = body;

    await connectToDatabase();
    const existing = await RedEnvelopeRound.findById(id);
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const hasParticipants = existing.participants.length > 0;

    const onlyTogglingActive =
      isActive !== undefined &&
      [label, image, rewardType, totalAmount, totalGemCoins, itemId, winnerCount, conditionAmount, conditionLevel, maxPeople, scheduledAt, endsAt]
        .every((v) => v === undefined);

    if (onlyTogglingActive) {
      const round = await RedEnvelopeRound.findByIdAndUpdate(id, { isActive: !!isActive }, { new: true });
      const safeRound = round!.toObject();
      delete safeRound.allocations;
      delete safeRound.winnerSlots;
      return NextResponse.json(safeRound);
    }

    if (hasParticipants && !resetConfirm) {
      return NextResponse.json(
        { error: "รอบนี้มีคนเข้าร่วมแล้ว การแก้ไขจะล้างผู้เข้าร่วมเดิมทั้งหมดและสุ่มผลใหม่ กรุณายืนยันเพื่อรีเซ็ตรอบนี้", needsResetConfirm: true },
        { status: 409 }
      );
    }

    const people = Math.max(1, Number(maxPeople) || existing.maxPeople);
    const update: any = {};
    if (label !== undefined) update.label = label;
    if (image !== undefined) update.image = image || null;
    if (isActive !== undefined) update.isActive = !!isActive;
    if (rewardType !== undefined) update.rewardType = rewardType;
    const effectiveType = rewardType !== undefined ? rewardType : existing.rewardType;

    if (effectiveType === "cash") {
      const amt = totalAmount !== undefined ? Number(totalAmount) : existing.totalAmount;
      if (!amt || amt < people * 0.01) {
        return NextResponse.json({ error: `ยอดเงินรวมต้องอย่างน้อย ${(people * 0.01).toFixed(2)} บาท` }, { status: 400 });
      }
      update.totalAmount = amt;
      update.totalGemCoins = null;
      update.itemId = null;
    } else if (effectiveType === "gemcoin") {
      const gem = totalGemCoins !== undefined ? Number(totalGemCoins) : (existing as any).totalGemCoins;
      if (!gem || gem < people) {
        return NextResponse.json({ error: `GemCoin รวมต้องอย่างน้อย ${people}` }, { status: 400 });
      }
      update.totalGemCoins = gem;
      update.totalAmount = null;
      update.itemId = null;
    } else if (effectiveType === "item") {
      const it = itemId !== undefined ? itemId : existing.itemId;
      if (!it) return NextResponse.json({ error: "กรุณาเลือกไอเทมรางวัล" }, { status: 400 });
      update.itemId = it;
      update.totalAmount = null;
      update.totalGemCoins = null;
      const wc = winnerCount !== undefined ? Math.min(Math.max(1, Number(winnerCount)), people) : (existing.winnerCount || 1);
      update.winnerCount = wc;
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

    const effectiveWinnerCount = update.winnerCount ?? existing.winnerCount ?? 1;
    const allocTotal = effectiveType === "cash" ? (update.totalAmount ?? existing.totalAmount)
      : effectiveType === "gemcoin" ? (update.totalGemCoins ?? (existing as any).totalGemCoins)
      : undefined;
    const { allocations, winnerSlots } = generateAllocations(effectiveType, allocTotal, people, effectiveWinnerCount);
    update.allocations = allocations ?? null;
    update.winnerSlots = winnerSlots ?? null;

    if (hasParticipants && resetConfirm) {
      update.participants = [];
      update.resolvedAt = null;
      update.status = "scheduled";
    }

    const round = await RedEnvelopeRound.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    const safeRound = round!.toObject();
    delete safeRound.allocations;
    delete safeRound.winnerSlots;
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
    await RedEnvelopeRound.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
