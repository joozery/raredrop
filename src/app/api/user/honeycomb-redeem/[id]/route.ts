import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import HoneycombReward from "@/models/HoneycombReward";
import BoxCredit from "@/models/BoxCredit";
import Inventory from "@/models/Inventory";
import User from "@/models/User";
import ShopListing from "@/models/ShopListing";
import { notify } from "@/lib/notify";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
    }
    const { id: rewardId } = await params;
    const userId = (session.user as any).id;

    await connectToDatabase();

    const reward = await HoneycombReward.findById(rewardId);
    if (!reward || !reward.isActive) {
      return NextResponse.json({ error: "ไม่พบรางวัลนี้" }, { status: 404 });
    }

    // เช็คและจอง stock (atomic)
    if (reward.stock > 0) {
      const fresh = await HoneycombReward.findOneAndUpdate(
        { _id: rewardId, stock: { $gt: 0 } },
        { $inc: { stock: -1 } },
        { new: true }
      );
      if (!fresh) {
        return NextResponse.json({ error: "รางวัลนี้หมดแล้ว" }, { status: 400 });
      }
    }

    // เช็ค honeyCoins
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    if ((user.honeyCoins ?? 0) < reward.honeyCost) {
      if (reward.stock > 0) await HoneycombReward.findByIdAndUpdate(rewardId, { $inc: { stock: 1 } });
      return NextResponse.json({ error: `เหรียญไม่เพียงพอ (มี ${user.honeyCoins ?? 0} / ต้องการ ${reward.honeyCost})` }, { status: 400 });
    }

    // หัก honeyCoins
    await User.findByIdAndUpdate(userId, { $inc: { honeyCoins: -reward.honeyCost } });

    let rewardDetail: any = {};

    if (reward.type === "box") {
      const times = reward.boxOpenTimes || 1;
      await BoxCredit.findOneAndUpdate(
        { userId, boxId: reward.boxId },
        { $inc: { credits: times } },
        { upsert: true, new: true }
      );
      rewardDetail = { type: "box", times };
      const boxDoc = await (await import("@/models/Box")).default.findById(reward.boxId).select("name _id");
      await notify(
        userId,
        `แลกเหรียญสำเร็จ! 🎁`,
        `ได้สิทธิ์เปิดกล่อง "${boxDoc?.name || reward.name}" จำนวน ${times} ครั้ง`,
        "success",
        boxDoc ? `/boxes/${boxDoc._id}` : undefined
      );

    } else if (reward.type === "item") {
      await Inventory.create({ userId, itemId: reward.itemId, status: "kept" });
      rewardDetail = { type: "item" };
      const itemDoc = await (await import("@/models/Item")).default.findById(reward.itemId).select("name");
      await notify(
        userId,
        `แลกเหรียญสำเร็จ! 📦`,
        `ได้รับ "${itemDoc?.name || reward.name}" เข้า inventory แล้ว`,
        "success",
        "/inventory"
      );

    } else if (reward.type === "shop") {
      const listing = await ShopListing.findOneAndUpdate(
        { _id: reward.shopListingId, "accounts.sold": false },
        {
          $set: {
            "accounts.$.sold": true,
            "accounts.$.soldTo": userId,
            "accounts.$.soldAt": new Date(),
          },
        },
        { new: true }
      );

      if (!listing) {
        await User.findByIdAndUpdate(userId, { $inc: { honeyCoins: reward.honeyCost } });
        if (reward.stock > 0) await HoneycombReward.findByIdAndUpdate(rewardId, { $inc: { stock: 1 } });
        return NextResponse.json({ error: "สินค้านี้หมดแล้ว ไม่มี account เหลือ" }, { status: 400 });
      }

      const account = listing.accounts.find(
        (a: any) => a.sold && a.soldTo?.toString() === userId.toString() && a.soldAt
      );
      rewardDetail = { type: "shop", accountData: account?.data || "" };
      await notify(
        userId,
        `แลกเหรียญสำเร็จ! 🛍️`,
        `ได้รับสินค้า "${reward.name}" — ตรวจสอบข้อมูลได้จากหน้าแลกเหรียญ`,
        "success",
        "/honeycomb-exchange"
      );
    }

    const updatedUser = await User.findById(userId);

    return NextResponse.json({
      success: true,
      reward: { name: reward.name, type: reward.type },
      rewardDetail,
      honeyCoinsLeft: updatedUser?.honeyCoins ?? 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
