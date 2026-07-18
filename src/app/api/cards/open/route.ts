import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import CardRound from "@/models/CardRound";
import Inventory from "@/models/Inventory";
import Setting from "@/models/Setting";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import { notify } from "@/lib/notify";
import { serializeRound } from "@/lib/cardGame";

// เปิดการ์ด 1 ใบ — สุ่ม/ตัดเงิน/แจกของ ทำฝั่ง server ทั้งหมด client แค่เล่นอนิเมชันตามผล
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนเปิดการ์ด" }, { status: 401 });

    const { index } = await req.json();
    if (typeof index !== "number" || !Number.isInteger(index) || index < 0) {
      return NextResponse.json({ error: "ตำแหน่งการ์ดไม่ถูกต้อง" }, { status: 400 });
    }

    await connectToDatabase();

    const costSetting = await Setting.findOne({ key: "cards_open_cost" }).lean();
    const cost = Number((costSetting as any)?.value) || 50;

    // ต้องมีรอบที่แอดมินเปิดไว้เท่านั้น — รอบใหม่ไม่สร้างอัตโนมัติ
    const round = await CardRound.findOne({ status: "active" }).sort({ roundNumber: -1 });
    if (!round) {
      return NextResponse.json({ error: "ยังไม่เปิดรอบ กรุณารอแอดมินเปิดรอบใหม่" }, { status: 400 });
    }
    // จำนวนการ์ดต่อรอบตั้งได้จากหลังบ้าน — เช็คขอบเขตกับรอบจริง
    if (index >= round.cards.length) {
      return NextResponse.json({ error: "ตำแหน่งการ์ดไม่ถูกต้อง" }, { status: 400 });
    }

    // 1) หักเหรียญแบบ atomic — ยอดไม่พอจะไม่ตัดอะไรเลย
    const paidUser = await User.findOneAndUpdate(
      { _id: userId, coins: { $gte: cost } },
      { $inc: { coins: -cost } },
      { new: true }
    );
    if (!paidUser) {
      return NextResponse.json({ error: "เหรียญไม่เพียงพอ กรุณาเติมเงิน" }, { status: 400 });
    }

    // 2) จองการ์ดใบนี้แบบ atomic — แพ้ race (คนอื่นชิงเปิดก่อน) = คืนเงินทันที
    const claimed = await CardRound.findOneAndUpdate(
      { _id: round._id, status: "active", [`cards.${index}.opened`]: { $ne: true } },
      {
        $set: {
          [`cards.${index}.opened`]: true,
          [`cards.${index}.openedBy`]: userId,
          [`cards.${index}.openedByName`]: paidUser.name || "ผู้เล่น",
          [`cards.${index}.openedAt`]: new Date(),
        },
      },
      { new: true }
    );
    if (!claimed) {
      await User.findByIdAndUpdate(userId, { $inc: { coins: cost } });
      return NextResponse.json({ error: "การ์ดใบนี้ถูกเปิดไปแล้ว กรุณาเลือกใบอื่น" }, { status: 409 });
    }

    // 3) รางวัลประจำใบ — คละไว้แล้วตั้งแต่แอดมินเปิดรอบ (1 รางวัล : 1 ใบ ไม่ซ้ำ)
    const chosen: any = (claimed.cards[index] as any)?.assigned;
    if (!chosen) {
      // รอบเก่าก่อนระบบ 1:1 หรือข้อมูลเพี้ยน — คืนเงิน + ปลดการ์ดคืน
      await Promise.all([
        User.findByIdAndUpdate(userId, { $inc: { coins: cost } }),
        CardRound.updateOne(
          { _id: round._id },
          { $set: { [`cards.${index}.opened`]: false }, $unset: { [`cards.${index}.openedBy`]: "", [`cards.${index}.openedByName`]: "", [`cards.${index}.openedAt`]: "" } }
        ),
      ]);
      return NextResponse.json({ error: "รอบนี้ข้อมูลรางวัลไม่พร้อม กรุณาติดต่อแอดมิน" }, { status: 409 });
    }

    // 4) เข้ารางวัลให้ผู้เล่น — สต็อกไอเทมถูกจองไว้แล้วตอนเปิดรอบ ไม่ต้องตัดซ้ำ
    if (chosen.type === "coin" && chosen.amount > 0) {
      await User.findByIdAndUpdate(userId, { $inc: { coins: chosen.amount } });
    } else if (chosen.type === "gemcoin" && chosen.amount > 0) {
      await User.findByIdAndUpdate(userId, { $inc: { gemCoins: chosen.amount } });
    } else if (chosen.type === "item" && chosen.itemId) {
      await Inventory.create({ userId, itemId: chosen.itemId, status: "kept" });
    }

    // 5) บันทึก snapshot รางวัลลงฝั่งสาธารณะของการ์ด
    const prizeSnapshot = {
      title: chosen.title,
      name: chosen.name,
      icon: chosen.icon,
      type: chosen.type,
      amount: chosen.amount || 0,
      itemId: chosen.type === "item" ? chosen.itemId : undefined,
    };
    let updatedRound = await CardRound.findOneAndUpdate(
      { _id: round._id },
      { $set: { [`cards.${index}.prize`]: prizeSnapshot } },
      { new: true }
    );

    // 6) ปิดรอบเมื่อครบ 10 ใบ — รอบถัดไปแอดมินต้องกดเปิดเองจากหลังบ้าน
    if (updatedRound && updatedRound.cards.every((c: any) => c.opened)) {
      updatedRound.status = "completed";
      updatedRound.completedAt = new Date();
      await updatedRound.save();
    }

    // 7) ประวัติธุรกรรม + แจ้งเตือน
    const finalUser = await User.findById(userId);
    await Transaction.create({
      userId,
      type: "card_game",
      amount: -cost,
      balanceAfter: finalUser!.coins,
      description: `เปิดการ์ดใบที่ ${index + 1} (รอบ #${round.roundNumber}) — ได้รับ ${chosen.title} ${chosen.name}`,
      referenceId: round._id,
    });
    await notify(
      userId,
      "เปิดการ์ดสำเร็จ! 🎴",
      `ได้รับ ${chosen.title} ${chosen.name}${chosen.type === "item" ? " — เข้าคอลเลกชันของคุณแล้ว" : ""}`,
      "success",
      chosen.type === "item" ? "/inventory" : undefined
    );

    return NextResponse.json({
      prize: { title: prizeSnapshot.title, name: prizeSnapshot.name, icon: prizeSnapshot.icon, type: prizeSnapshot.type, amount: prizeSnapshot.amount },
      coins: finalUser!.coins,
      gemCoins: finalUser!.gemCoins,
      round: serializeRound(updatedRound),
    });
  } catch (error: any) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด: " + error.message }, { status: 500 });
  }
}
