import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";
import LevelConfig from "@/models/LevelConfig";
import Inventory from "@/models/Inventory";
import Setting from "@/models/Setting";
// จำเป็นต้อง import ไว้เพื่อให้ mongoose ลงทะเบียน schema ก่อน populate "rewardItems.itemId" ด้านล่าง
import "@/models/Item";
import { notify } from "@/lib/notify";

export async function getExpPerBaht(): Promise<number> {
  await connectToDatabase();
  const setting = await Setting.findOne({ key: "exp_per_baht" }).lean();
  return Number((setting as any)?.value ?? 1);
}

export async function awardXp(userId: string, xpToAdd: number) {
  if (xpToAdd <= 0) return null;

  await connectToDatabase();

  const [user, levels] = await Promise.all([
    User.findById(userId),
    LevelConfig.find().sort({ xpRequired: 1 }).populate({ path: "rewardItems.itemId", select: "name image" }),
  ]);

  if (!user) return null;

  const oldLevel = user.vipLevel || 1;
  const newXp = (user.xp || 0) + xpToAdd;

  // Find highest level where xpRequired <= newXp
  let newLevel = 1;
  for (const lv of levels) {
    if (newXp >= lv.xpRequired) newLevel = lv.level;
  }

  // Collect reward items for every level gained
  const levelsGained = (levels as any[]).filter(
    (lv) => lv.level > oldLevel && lv.level <= newLevel
  );

  const inventoryEntries: { userId: any; itemId: any; status: string }[] = [];
  for (const lv of levelsGained) {
    for (const reward of lv.rewardItems) {
      for (let i = 0; i < reward.quantity; i++) {
        inventoryEntries.push({ userId: user._id, itemId: reward.itemId._id ?? reward.itemId, status: "kept" });
      }
    }
  }

  if (inventoryEntries.length > 0) {
    await Inventory.insertMany(inventoryEntries);
  }

  const gainedLevelNums = levelsGained.map((l: any) => l.level);

  await User.findByIdAndUpdate(userId, {
    $inc: { xp: xpToAdd },
    $set: { vipLevel: newLevel },
    ...(gainedLevelNums.length > 0 ? { $addToSet: { claimedLevels: { $each: gainedLevelNums } } } : {}),
  });

  if (levelsGained.length > 0) {
    const itemNames = levelsGained
      .flatMap((lv: any) => lv.rewardItems.map((r: any) => `${r.itemId?.name ?? "ไอเทม"} x${r.quantity}`))
      .join(", ");
    await notify(
      userId,
      `เลเวลอัป! 🎉 ขึ้นเป็น Lv.${newLevel}`,
      itemNames ? `ได้รับของรางวัล: ${itemNames}` : `ยินดีด้วย! คุณขึ้นเป็นเลเวล ${newLevel} แล้ว`,
      "success"
    );
  }

  return { xpAdded: xpToAdd, newXp, oldLevel, newLevel, levelsGained: levelsGained.length, itemsRewarded: inventoryEntries.length };
}
