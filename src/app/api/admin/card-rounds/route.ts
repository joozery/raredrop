import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import CardRound from "@/models/CardRound";
import CardPrize from "@/models/CardPrize";
import Item from "@/models/Item";
import Setting from "@/models/Setting";
import { getCurrentRound, startNewRound, serializeRound, TOTAL_CARDS } from "@/lib/cardGame";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) return null;
  return session;
}

// สถานะรอบล่าสุด — ใช้โชว์ในหน้า /admin/cards
export async function GET() {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectToDatabase();
    const round = await getCurrentRound();
    return NextResponse.json(serializeRound(round), { headers: { "Cache-Control": "no-store" } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// เปิดรอบใหม่ (เริ่ม event) — เปิดได้ต่อเมื่อไม่มีรอบที่กำลังเล่นค้างอยู่
// รางวัล 1 ตัว : การ์ด 1 ใบ ไม่ซ้ำ — ต้องมีรางวัลเปิดใช้งานครบ 10 ตัวพอดี
// รางวัลไอเทมถูกจอง (ตัดสต็อก) ตั้งแต่ตอนเปิดรอบ จะได้ไม่มีเคสของหมดกลางรอบ
export async function POST() {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectToDatabase();
    const active = await CardRound.findOne({ status: "active" });
    if (active) {
      return NextResponse.json({ error: `รอบ #${active.roundNumber} ยังเปิดค้างอยู่ ต้องรอผู้เล่นเปิดการ์ดครบก่อน` }, { status: 400 });
    }

    // จำนวนการ์ดต่อรอบ ตั้งได้จากหลังบ้าน (1-50) — default 10
    const perRoundSetting = await Setting.findOne({ key: "cards_per_round" }).lean();
    const cardsPerRound = Math.min(50, Math.max(1, Math.floor(Number((perRoundSetting as any)?.value)) || TOTAL_CARDS));

    const prizes = await CardPrize.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean();
    if (prizes.length !== cardsPerRound) {
      return NextResponse.json(
        { error: `ต้องมีรางวัลเปิดใช้งานครบ ${cardsPerRound} รางวัลพอดี (1 รางวัลต่อการ์ด 1 ใบ) — ตอนนี้มี ${prizes.length} รางวัล` },
        { status: 400 }
      );
    }

    // จองสต็อกไอเทมทีละตัว — ถ้าตัวไหนไม่พอ คืนที่จองไปแล้วทั้งหมดแล้วแจ้ง error
    const reserved: any[] = [];
    const assigned: any[] = [];
    for (const p of prizes as any[]) {
      let icon = p.icon;
      if (p.type === "item") {
        if (!p.itemId) {
          await Promise.all(reserved.map((id) => Item.updateOne({ _id: id }, { $inc: { stock: 1 } })));
          return NextResponse.json({ error: `รางวัล "${p.name}" เป็นประเภทไอเทมแต่ยังไม่ได้เลือกไอเทมจากคลัง` }, { status: 400 });
        }
        const item = await Item.findById(p.itemId);
        if (!item) {
          await Promise.all(reserved.map((id) => Item.updateOne({ _id: id }, { $inc: { stock: 1 } })));
          return NextResponse.json({ error: `ไอเทมของรางวัล "${p.name}" ถูกลบไปแล้ว กรุณาแก้ไขรางวัลก่อนเปิดรอบ` }, { status: 400 });
        }
        if (!item.unlimitedStock) {
          const dec = await Item.findOneAndUpdate({ _id: item._id, stock: { $gt: 0 } }, { $inc: { stock: -1 } });
          if (!dec) {
            await Promise.all(reserved.map((id) => Item.updateOne({ _id: id }, { $inc: { stock: 1 } })));
            return NextResponse.json({ error: `สต็อกไอเทม "${item.name}" หมด — เติมสต็อกหรือปิดใช้งานรางวัลนี้ก่อนเปิดรอบ` }, { status: 400 });
          }
          reserved.push(item._id);
        }
        icon = p.icon || item.image;
      }
      assigned.push({
        title: p.title,
        name: p.name,
        icon,
        type: p.type || "custom",
        amount: p.amount || 0,
        itemId: p.type === "item" ? p.itemId : undefined,
      });
    }

    const round = await startNewRound(assigned);
    return NextResponse.json(serializeRound(round));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
