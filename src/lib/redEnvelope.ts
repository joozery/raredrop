import { Types, HydratedDocument } from "mongoose";
import RedEnvelopeRound, { IRedEnvelopeRound } from "@/models/RedEnvelopeRound";
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
export function generateAllocations(rewardType: "cash" | "item", totalAmount: number | undefined, maxPeople: number): { allocations?: number[]; winnerSlot?: number } {
  if (rewardType === "cash") {
    return { allocations: generateCashAllocations(totalAmount || 0, maxPeople) };
  }
  return { winnerSlot: Math.floor(Math.random() * maxPeople) };
}

// เช็คและอัปเดตสถานะรอบให้ตรงกับเวลาจริงแบบ lazy (ไม่ต้องมี cron) — เรียกทุกครั้งก่อนแสดงผล/ก่อนให้เข้าร่วม
export async function ensureRoundStatus(round: RoundDoc): Promise<RoundDoc> {
  const now = new Date();
  if (round.status === "scheduled" && now >= round.scheduledAt) {
    round.status = "open";
    await round.save();
  }
  // ปิดรอบเมื่อหมดเวลา หรือช่องเต็มแล้วแต่สถานะยังไม่ถูกปิด (กันเคสตกค้าง) — ไม่มีใครต้องรอจับรางวัลแบบ batch อีกแล้ว เพราะแจกสดทันทีตอนกดรับไปแล้ว
  if (round.status === "open" && (round.participants.length >= round.maxPeople || now >= round.endsAt)) {
    round.status = "resolved";
    round.resolvedAt = new Date();
    await round.save();
  }
  return round;
}

// แจกรางวัลเงินให้ "คนเดียว" ทันทีตอนกดรับ — ไม่รอใคร
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

// แจกรางวัลไอเทมให้ผู้โชคดีทันทีตอนกดรับ — ไอเทมซองแดงเป็นคนละชุดกับไอเทมร้านค้า/กล่องสุ่ม จึงไม่เข้า Inventory ผู้เล่น
// ผลรางวัลถูกบันทึกไว้ใน participants ของรอบเองอยู่แล้ว ดูได้จากประวัติการรับซองแดง
export async function creditItemReward(userId: string, itemName: string, roundLabel: string) {
  await notify(userId, "เปิดซองแดงได้ไอเทม! 🧧", `ยินดีด้วย! คุณคือผู้โชคดีได้รับ "${itemName}" จากซองแดง "${roundLabel}"`, "success", "/red-envelope");
}
