import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import HoneycombBox from "@/models/HoneycombBox";
import HoneycombItem from "@/models/HoneycombItem";
import User from "@/models/User";
import Inventory from "@/models/Inventory";
import Transaction from "@/models/Transaction";
import HoneycombHistory from "@/models/HoneycombHistory";
import { notify } from "@/lib/notify";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: "ต้องเข้าสู่ระบบก่อน" }, { status: 401 });

    const { id } = await params;
    const { count = 1 } = await req.json();

    if (count < 1 || count > 10) {
      return NextResponse.json({ error: "จำนวนครั้งไม่ถูกต้อง" }, { status: 400 });
    }

    await connectToDatabase();

    const box = await HoneycombBox.findById(id).populate({ path: "items.itemId", model: HoneycombItem });
    if (!box || !box.isActive) {
      return NextResponse.json({ error: "ไม่พบกล่องรังผึ้ง หรือกล่องถูกปิดอยู่" }, { status: 404 });
    }

    if (!box.items || box.items.length === 0) {
      return NextResponse.json({ error: "กล่องนี้ยังไม่มีการเพิ่มไอเทมรางวัล" }, { status: 400 });
    }

    // กรองเอาเฉพาะไอเทมที่ไม่ได้ถูกล็อคอยู่
    const availableItems = box.items.filter((item: any) => !item.isLocked && (item.rate || 0) > 0);
    if (availableItems.length === 0) {
      return NextResponse.json({ error: "ไม่มีไอเทมรางวัลที่สามารถสุ่มได้ (ไอเทมถูกล็อคหรือเรทเป็น 0 ทั้งหมด)" }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });

    const totalCost = box.price * count;
    if (user.coins < totalCost) {
      return NextResponse.json({ error: `เครดิตของคุณไม่เพียงพอ (ต้องการ ฿${totalCost.toLocaleString()})` }, { status: 400 });
    }

    // Roll items
    const results = [];
    const inventoryDocs = [];
    let totalHoneyCoinsEarned = 0;

    for (let i = 0; i < count; i++) {
      const totalRate = availableItems.reduce((acc: number, item: any) => acc + (item.rate || 0), 0);
      let rand = Math.random() * totalRate;
      let wonItem: any = null;

      for (const boxItem of availableItems) {
        if (rand < (boxItem.rate || 0)) {
          wonItem = boxItem.itemId;
          break;
        }
        rand -= (boxItem.rate || 0);
      }

      if (!wonItem) {
        wonItem = availableItems[0].itemId;
      }

      const isCoin = wonItem.type === "coin_reward";
      
      const resultObj = {
        id: wonItem._id,
        name: isCoin ? `${wonItem.coinAmount} เหรียญรังผึ้ง` : wonItem.name,
        category: wonItem.category || "common",
        type: isCoin ? "coin" : "item",
        value: isCoin ? (wonItem.coinAmount || 0) : (wonItem.value || 0),
        coinAmount: wonItem.coinAmount,
        image: wonItem.image || "",
        badgeText: isCoin ? `${wonItem.coinAmount} 🍯` : (wonItem.category?.toUpperCase() || "REWARD"),
        description: wonItem.description || "",
      };

      results.push(resultObj);

      if (isCoin) {
        totalHoneyCoinsEarned += (wonItem.coinAmount || 0);
      } else {
        inventoryDocs.push({
          userId,
          itemId: wonItem._id,
          boxId: box._id,
          status: "kept",
        });
      }
    }

    // Deduct coins and add honeyCoins
    await User.findByIdAndUpdate(userId, {
      $inc: { coins: -totalCost, honeyCoins: totalHoneyCoinsEarned },
    });

    if (inventoryDocs.length > 0) {
      await Inventory.insertMany(inventoryDocs);
    }

    // บันทึกประวัติการสุ่ม
    await HoneycombHistory.insertMany(
      results.map((r) => ({
        userId,
        boxId: box._id,
        rewardName:     r.name,
        rewardType:     r.type,
        rewardValue:    r.value,
        coinAmount:     r.coinAmount ?? 0,
        rewardCategory: r.category,
        rewardImage:    r.image,
        rewardBadgeText:r.badgeText,
      }))
    );

    const updatedUser = await User.findById(userId);
    await Transaction.create({
      userId,
      type: "buy_box",
      amount: -totalCost,
      balanceAfter: updatedUser!.coins,
      description: `เล่นวงล้อรังผึ้ง "${box.name}" ${count} ครั้ง`,
      referenceId: box._id,
    });

    // Notifications
    const itemNames = results
      .map((r) => r.type === "coin" ? `🍯 +${r.coinAmount} เหรียญรังผึ้ง` : r.name)
      .slice(0, 3)
      .join(", ");
    const more = results.length > 3 ? ` และอีก ${results.length - 3} รายการ` : "";
    await notify(
      userId,
      `เล่นเกมรังผึ้ง "${box.name}" ${count} ครั้ง`,
      `ได้รับ: ${itemNames}${more}`,
      "success",
      "/inventory"
    );

    return NextResponse.json({
      success: true,
      rewards: results,
      newBalance: {
        coins: updatedUser!.coins,
        honeyCoins: updatedUser?.honeyCoins ?? 0,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "เกิดข้อผิดพลาดในการสุ่ม" }, { status: 500 });
  }
}
