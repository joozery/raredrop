import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import PromoCode from "@/models/PromoCode";
import PromoCodeRedemption from "@/models/PromoCodeRedemption";
import User from "@/models/User";
import Inventory from "@/models/Inventory";
import BoxCredit from "@/models/BoxCredit";
import Item from "@/models/Item";
import Box from "@/models/Box";
import { notify } from "@/lib/notify";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { code } = await req.json();
    const normalized = typeof code === "string" ? code.trim().toUpperCase() : "";
    if (!normalized) return NextResponse.json({ error: "กรุณากรอกโค้ด" }, { status: 400 });

    await connectToDatabase();

    // จองสิทธิ์ใช้โค้ด (atomic) — กันใช้เกิน maxUses พร้อมกันหลายคน
    const promo = await PromoCode.findOneAndUpdate(
      {
        code: normalized,
        isActive: true,
        $or: [{ maxUses: 0 }, { $expr: { $lt: ["$usedCount", "$maxUses"] } }],
      },
      { $inc: { usedCount: 1 } },
      { new: true }
    );

    if (!promo) {
      return NextResponse.json({ error: "ไม่พบโค้ดนี้ หรือใช้ครบจำนวนแล้ว" }, { status: 400 });
    }

    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
      await PromoCode.findByIdAndUpdate(promo._id, { $inc: { usedCount: -1 } });
      return NextResponse.json({ error: "โค้ดนี้หมดอายุแล้ว" }, { status: 400 });
    }

    try {
      await PromoCodeRedemption.create({ codeId: promo._id, userId });
    } catch (err: any) {
      await PromoCode.findByIdAndUpdate(promo._id, { $inc: { usedCount: -1 } });
      if (err?.code === 11000) {
        return NextResponse.json({ error: "คุณใช้โค้ดนี้ไปแล้ว" }, { status: 400 });
      }
      throw err;
    }

    let message = "";
    if (promo.rewardType === "coins") {
      const updated = await User.findByIdAndUpdate(userId, { $inc: { coins: promo.rewardAmount } }, { new: true });
      message = `ได้รับ ฿${promo.rewardAmount?.toLocaleString()} เหรียญ`;
      await notify(userId, "แลกโค้ดสำเร็จ! 🎉", message, "success", "/profile");
    } else if (promo.rewardType === "gemCoins") {
      await User.findByIdAndUpdate(userId, { $inc: { gemCoins: promo.rewardAmount } });
      message = `ได้รับ ${promo.rewardAmount?.toLocaleString()} GemCoin`;
      await notify(userId, "แลกโค้ดสำเร็จ! 🎉", message, "success", "/exchange");
    } else if (promo.rewardType === "item") {
      await Inventory.create({ userId, itemId: promo.itemId, status: "kept" });
      const itemDoc = await Item.findById(promo.itemId).select("name");
      message = `ได้รับ "${itemDoc?.name || "ไอเทม"}" เข้า inventory แล้ว`;
      await notify(userId, "แลกโค้ดสำเร็จ! 📦", message, "success", "/inventory");
    } else if (promo.rewardType === "box") {
      const times = promo.boxOpenTimes || 1;
      await BoxCredit.findOneAndUpdate(
        { userId, boxId: promo.boxId },
        { $inc: { credits: times } },
        { upsert: true, new: true }
      );
      const boxDoc = await Box.findById(promo.boxId).select("name _id");
      message = `ได้สิทธิ์เปิดกล่อง "${boxDoc?.name || "กล่องสุ่ม"}" จำนวน ${times} ครั้ง`;
      await notify(userId, "แลกโค้ดสำเร็จ! 🎁", message, "success", boxDoc ? `/boxes/${boxDoc._id}` : undefined);
    }

    return NextResponse.json({ success: true, rewardType: promo.rewardType, message });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
