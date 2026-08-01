import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";
import LevelConfig from "@/models/LevelConfig";
import Inventory from "@/models/Inventory";
import "@/models/Item";
import { notify } from "@/lib/notify";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนทำรายการ" }, { status: 401 });

    const { levelId } = await req.json();
    if (!levelId) return NextResponse.json({ error: "ไม่พบข้อมูลเลเวล" }, { status: 400 });

    await connectToDatabase();

    const [user, levelConfig] = await Promise.all([
      User.findById(userId),
      LevelConfig.findById(levelId).populate({ path: "rewardItems.itemId", select: "name image" }),
    ]);

    if (!user) return NextResponse.json({ error: "ไม่พบข้อมูลผู้ใช้" }, { status: 404 });
    if (!levelConfig) return NextResponse.json({ error: "ไม่พบข้อมูลเลเวลที่ระบุ" }, { status: 404 });

    const userXp = user.xp || 0;
    if (userXp < levelConfig.xpRequired) {
      return NextResponse.json({ error: `คุณยังมี XP ไม่ถึงเลเวล ${levelConfig.level} (ขาดอีก ${(levelConfig.xpRequired - userXp).toLocaleString()} XP)` }, { status: 400 });
    }

    const claimedLevels: number[] = user.claimedLevels || [];
    if (claimedLevels.includes(levelConfig.level)) {
      return NextResponse.json({ error: `คุณเคยรับของรางวัลเลเวล ${levelConfig.level} ไปแล้ว` }, { status: 400 });
    }

    if (!levelConfig.rewardItems || levelConfig.rewardItems.length === 0) {
      return NextResponse.json({ error: "เลเวลนี้ไม่มีของรางวัลให้กดรับ" }, { status: 400 });
    }

    const inventoryEntries: { userId: any; itemId: any; status: string }[] = [];
    const itemNames: string[] = [];

    for (const reward of levelConfig.rewardItems as any[]) {
      const item = reward.itemId;
      if (!item) continue;
      const itemId = item._id ?? item;
      const itemName = item.name ?? "ไอเทม";
      const quantity = reward.quantity || 1;

      for (let i = 0; i < quantity; i++) {
        inventoryEntries.push({ userId: user._id, itemId, status: "kept" });
      }
      itemNames.push(`${itemName} x${quantity}`);
    }

    if (inventoryEntries.length > 0) {
      await Inventory.insertMany(inventoryEntries);
    }

    await User.findByIdAndUpdate(userId, {
      $addToSet: { claimedLevels: levelConfig.level },
    });

    const rewardSummaryStr = itemNames.join(", ");

    await notify(
      userId,
      `รับรางวัลเลเวล ${levelConfig.level} สำเร็จ! 🎁`,
      `ได้รับของรางวัล: ${rewardSummaryStr} (ส่งเข้า Inventory แล้ว)`,
      "success",
      "/inventory"
    );

    return NextResponse.json({
      success: true,
      claimedLevel: levelConfig.level,
      items: itemNames,
      message: `รับของรางวัลเลเวล ${levelConfig.level} สำเร็จ! ไอเทมถูกส่งเข้า Inventory ของคุณเรียบร้อยแล้ว`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
