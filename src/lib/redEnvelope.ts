import { Types, HydratedDocument } from "mongoose";
import RedEnvelopeRound, { IRedEnvelopeRound } from "@/models/RedEnvelopeRound";
import RedEnvelopeItem from "@/models/RedEnvelopeItem";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { notify } from "@/lib/notify";

type RoundDoc = HydratedDocument<IRedEnvelopeRound>;

// เวลาไทย (UTC+7 ไม่มี DST) — เที่ยงคืนของ "วันนี้" ตามเวลาไทย แปลงเป็น UTC instant
export function startOfTodayThai(): Date {
  const thaiNow = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const y = thaiNow.getUTCFullYear();
  const m = thaiNow.getUTCMonth();
  const d = thaiNow.getUTCDate();
  return new Date(Date.UTC(y, m, d) - 7 * 60 * 60 * 1000);
}

const SPEND_TYPES = ["buy_box", "market_buy", "shop_buy"];

export async function getTodaySpend(userId: string): Promise<number> {
  const result = await Transaction.aggregate([
    { $match: { userId: new Types.ObjectId(userId), type: { $in: SPEND_TYPES }, createdAt: { $gte: startOfTodayThai() } } },
    { $group: { _id: null, total: { $sum: { $abs: "$amount" } } } },
  ]);
  return result[0]?.total || 0;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// อัลกอริทึมสุ่มแจกซองแดงแบบ "double average" (เหมือนหงเปาจีน) — สุ่มจำนวนต่อช่อง รวมแล้วเท่ายอดที่ตั้งไว้เป๊ะ
// generate ตามลำดับ index ก่อน (มี bias ตามลำดับเล็กน้อยตามธรรมชาติของอัลกอริทึม) แล้วสับลำดับทิ้ง — กันไม่ให้กดก่อน/หลังได้เปรียบเสียเปรียบ
function generateCashAllocations(totalBaht: number, n: number): number[] {
  let remainingSatang = Math.round(totalBaht * 100);
  const amountsSatang: number[] = [];
  for (let i = 0; i < n; i++) {
    const peopleLeft = n - i;
    if (peopleLeft === 1) {
      amountsSatang.push(remainingSatang);
      break;
    }
    const doubleAvg = Math.max(1, Math.floor((remainingSatang / peopleLeft) * 2));
    const safeMax = Math.max(1, Math.min(doubleAvg, remainingSatang - (peopleLeft - 1)));
    const amt = Math.floor(Math.random() * safeMax) + 1;
    amountsSatang.push(amt);
    remainingSatang -= amt;
  }
  return shuffle(amountsSatang);
}

// เรียกตอนสร้างรอบ — เตรียมผลลัพธ์ของทุกช่องไว้ล่วงหน้า (เก็บเป็นความลับ ไม่ส่งออก public API)
// กดรับครั้งที่ N ก็ได้ผลช่องที่ N ทันที ไม่ต้องรอครบคน/รอใครก่อน
export function generateAllocations(rewardType: "cash" | "item" | "gemcoin", totalAmount: number | undefined, maxPeople: number, winnerCount = 1): { allocations?: number[]; winnerSlots?: number[] } {
  if (rewardType === "cash") {
    return { allocations: generateCashAllocations(totalAmount || 0, maxPeople) };
  }
  if (rewardType === "gemcoin") {
    return { allocations: generateCashAllocations(totalAmount || 0, maxPeople) };
  }
  // item — สุ่ม winnerCount indices ที่ไม่ซ้ำกัน
  const count = Math.min(winnerCount, maxPeople);
  const indices = Array.from({ length: maxPeople }, (_, i) => i);
  const winners: number[] = [];
  for (let i = 0; i < count; i++) {
    const j = i + Math.floor(Math.random() * (indices.length - i));
    [indices[i], indices[j]] = [indices[j], indices[i]];
    winners.push(indices[i]);
  }
  return { winnerSlots: winners };
}

// จับรางวัลให้ "ทุกคนที่ยังไม่มีผล" พร้อมกันทีเดียว — เรียกตอนครบคนหรือหมดเวลา
// ข้าม participant ที่มีผลอยู่แล้ว (กันแจกซ้ำ/เครดิตซ้ำ) — ต้อง round ที่ .select("+allocations +winnerSlot") มาแล้วเท่านั้น
export async function resolveRoundRewards(round: RoundDoc) {
  let itemDoc: { name: string; image?: string } | null = null;
  if (round.rewardType === "item") {
    itemDoc = await RedEnvelopeItem.findById(round.itemId).select("name image").lean<any>();
  }

  for (let i = 0; i < round.participants.length; i++) {
    const p = round.participants[i];
    if (p.rewardAmount !== undefined || p.isWinner !== undefined) continue; // จับไปแล้ว (เช่น ข้อมูลเก่าก่อนเปลี่ยน logic)

    if (round.rewardType === "cash") {
      const amountSatang = round.allocations?.[i] ?? 0;
      const amountBaht = amountSatang / 100;
      p.rewardAmount = amountBaht;
      await creditCashReward(String(p.userId), amountBaht, round.label, round._id as any);
    } else if (round.rewardType === "gemcoin") {
      const amountSatang = round.allocations?.[i] ?? 0;
      const gemAmount = Math.round(amountSatang / 100);
      p.rewardAmount = gemAmount;
      await creditGemCoinReward(String(p.userId), gemAmount, round.label);
    } else {
      // รองรับทั้ง winnerSlots (ใหม่) และ winnerSlot (เก่า backward compat)
      const slots: number[] = round.winnerSlots?.length
        ? round.winnerSlots
        : round.winnerSlot !== undefined ? [round.winnerSlot] : [];
      const isWinner = slots.includes(i);
      p.isWinner = isWinner;
      if (isWinner && itemDoc) {
        await creditItemReward(String(p.userId), itemDoc.name, round.label);
      }
    }
  }

  round.status = "resolved";
  round.resolvedAt = new Date();
  await round.save();
}

// เช็คและอัปเดตสถานะรอบให้ตรงกับเวลาจริงแบบ lazy (ไม่ต้องมี cron) — เรียกทุกครั้งก่อนแสดงผล/ก่อนให้เข้าร่วม
export async function ensureRoundStatus(round: RoundDoc): Promise<RoundDoc> {
  const now = new Date();
  if (round.status === "scheduled" && now >= round.scheduledAt) {
    round.status = "open";
    await round.save();
  }
  // ครบคนแล้ว หรือหมดเวลาแล้วแต่ยังไม่ถูกจับรางวัล (กันเคสตกค้าง) — จับรางวัลให้ทุกคนพร้อมกันทีเดียว
  if (round.status === "open" && (round.participants.length >= round.maxPeople || now >= round.endsAt)) {
    // allocations/winnerSlot เป็น select:false เสมอ — ต้องโหลดใหม่ให้ครบก่อนจับรางวัล ป้องกันรั่วผ่าน query อื่นที่ไม่ได้ select มา
    const full = await RedEnvelopeRound.findById(round._id).select("+allocations +winnerSlot");
    if (full && full.status === "open") {
      await resolveRoundRewards(full);
      round.status = full.status;
      round.resolvedAt = full.resolvedAt;
      round.participants = full.participants;
    }
  }
  return round;
}

// แจกรางวัลเงินให้ "คนเดียว" — เรียกจาก resolveRoundRewards ตอนจับรางวัลพร้อมกันทั้งรอบ
export async function creditCashReward(userId: string, amountBaht: number, roundLabel: string, roundId: Types.ObjectId) {
  const user = await User.findByIdAndUpdate(userId, { $inc: { coins: amountBaht } }, { new: true });
  if (!user) return;
  await Transaction.create({
    userId,
    type: "red_envelope",
    amount: amountBaht,
    balanceAfter: user.coins,
    description: `เปิดซองแดง "${roundLabel}"`,
    referenceId: roundId,
  });
  await notify(userId, "เปิดซองแดงได้เงิน! 🧧", `ได้รับ ฿${amountBaht.toLocaleString()} จากซองแดง "${roundLabel}"`, "success", "/red-envelope");
}

// แจกรางวัลไอเทมให้ผู้โชคดี — ไอเทมซองแดงเป็นคนละชุดกับไอเทมร้านค้า/กล่องสุ่ม จึงไม่เข้า Inventory ผู้เล่น
// ผลรางวัลถูกบันทึกไว้ใน participants ของรอบเองอยู่แล้ว ดูได้จากประวัติการรับซองแดง
export async function creditItemReward(userId: string, itemName: string, roundLabel: string) {
  await notify(userId, "เปิดซองแดงได้ไอเทม! 🧧", `ยินดีด้วย! คุณคือผู้โชคดีได้รับ "${itemName}" จากซองแดง "${roundLabel}"`, "success", "/red-envelope");
}

export async function creditGemCoinReward(userId: string, amount: number, roundLabel: string) {
  await User.findByIdAndUpdate(userId, { $inc: { gemCoins: amount } });
  await notify(userId, "เปิดซองแดงได้ GemCoin! 🧧", `ได้รับ ${amount} GemCoin จากซองแดง "${roundLabel}"`, "success", "/red-envelope");
}
