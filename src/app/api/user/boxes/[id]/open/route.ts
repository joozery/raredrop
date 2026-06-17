import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import Box from "@/models/Box";
import Item from "@/models/Item";
import Rarity from "@/models/Rarity";
import User from "@/models/User";
import Inventory from "@/models/Inventory";
import Transaction from "@/models/Transaction";
import PityCounter from "@/models/PityCounter";
import BoxCredit from "@/models/BoxCredit";
import { notify } from "@/lib/notify";

const PITY_MIN_RARITY_ORDER = 3; // rarity.order >= 3 ถือว่า "rare"

function weightedRandom(items: { itemId: any; probability: number }[]): string {
  const total = items.reduce((sum, i) => sum + i.probability, 0);
  let rand = Math.random() * total;
  for (const item of items) {
    rand -= item.probability;
    if (rand <= 0) return item.itemId.toString();
  }
  return items[items.length - 1].itemId.toString();
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.id) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });
    }

    const { id: boxId } = await params;
    const body = await req.json().catch(() => ({}));
    const times = Math.min(Math.max(parseInt(body.times) || 1, 1), 10);

    await connectToDatabase();

    const box = await Box.findById(boxId).populate({
      path: "items.itemId",
      model: Item,
      populate: { path: "rarityId", model: Rarity, select: "name color order" },
    });

    if (!box || !box.isActive) {
      return NextResponse.json({ error: "ไม่พบกล่องสุ่มนี้" }, { status: 404 });
    }

    if (!box.items || box.items.length === 0) {
      return NextResponse.json({ error: "กล่องนี้ยังไม่มีไอเทม" }, { status: 400 });
    }

    const userId = (session.user as any).id;

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });

    // เช็ค BoxCredit (สิทธิ์เปิดฟรีจากการแลก GemCoin)
    const boxCredit = await BoxCredit.findOne({ userId, boxId });
    const freeOpens = boxCredit ? Math.min(boxCredit.credits, times) : 0;
    const paidOpens = times - freeOpens;
    const actualCost = box.price * paidOpens;

    if (user.coins < actualCost) {
      return NextResponse.json({ error: "เหรียญไม่เพียงพอ กรุณาเติมเงิน" }, { status: 400 });
    }

    const totalCost = actualCost;
    const PITY_THRESHOLD = box.pityThreshold ?? 100;

    // ดึง/สร้าง pity counter
    let pityDoc = await PityCounter.findOne({ userId, boxId });
    if (!pityDoc) {
      pityDoc = await PityCounter.create({ userId, boxId, count: 0 });
    }

    // แยก items เป็น rare+ และ common สำหรับ pity
    const rareItems = box.items.filter(
      (bi: any) => bi.itemId?.rarityId?.order >= PITY_MIN_RARITY_ORDER
    );

    const results: any[] = [];
    const inventoryDocs: any[] = [];
    let totalGemCoinsEarned = 0;

    for (let i = 0; i < times; i++) {
      let chosenItemId: string;

      // ตรวจสอบ pity
      if (pityDoc.count + 1 >= PITY_THRESHOLD && rareItems.length > 0) {
        // force rare
        chosenItemId = weightedRandom(
          rareItems.map((bi: any) => ({ itemId: bi.itemId._id, probability: bi.probability }))
        );
        pityDoc.count = 0;
      } else {
        chosenItemId = weightedRandom(
          box.items.map((bi: any) => ({ itemId: bi.itemId._id, probability: bi.probability }))
        );
        const chosenItem = box.items.find((bi: any) => bi.itemId._id.toString() === chosenItemId);
        const isRare = chosenItem?.itemId?.rarityId?.order >= PITY_MIN_RARITY_ORDER;
        pityDoc.count = isRare ? 0 : pityDoc.count + 1;
      }

      const fullItem = box.items.find((bi: any) => bi.itemId._id.toString() === chosenItemId)?.itemId;

      if (fullItem?.type === "coin_reward") {
        const gemAmount = fullItem.coinRewardAmount || 0;
        totalGemCoinsEarned += gemAmount;
        results.push({
          itemId: chosenItemId,
          name: fullItem?.name,
          image: fullItem?.image,
          price: fullItem?.price,
          rarity: fullItem?.rarityId,
          type: "coin_reward",
          coinRewardAmount: gemAmount,
        });
      } else {
        inventoryDocs.push({ userId, itemId: chosenItemId, boxId: box._id, status: "kept" });
        results.push({
          itemId: chosenItemId,
          name: fullItem?.name,
          image: fullItem?.image,
          price: fullItem?.price,
          rarity: fullItem?.rarityId,
          type: "item",
        });
      }
    }

    // นับว่าแต่ละ item ถูกสุ่มได้กี่ครั้ง เพื่อหักสต็อกรวมครั้งเดียว (เฉพาะ item ปกติ)
    const stockDeductions: Record<string, number> = {};
    for (const inv of inventoryDocs) {
      const id = inv.itemId.toString();
      stockDeductions[id] = (stockDeductions[id] || 0) + 1;
    }

    // หักเหรียญ + เพิ่ม gemCoins + XP
    await User.findByIdAndUpdate(userId, {
      $inc: { coins: -totalCost, xp: times, gemCoins: totalGemCoinsEarned },
    });

    // หัก BoxCredit ที่ใช้ไป
    if (freeOpens > 0) {
      await BoxCredit.findOneAndUpdate(
        { userId, boxId },
        { $inc: { credits: -freeOpens } }
      );
    }

    if (inventoryDocs.length > 0) {
      await Inventory.insertMany(inventoryDocs);
    }

    // หัก stock ทีละ item (เฉพาะ item ปกติที่มี stock > 0) — floor ที่ 0 ไม่ให้ติดลบ
    await Promise.all(
      Object.entries(stockDeductions).map(([itemId, count]) =>
        Item.findOneAndUpdate(
          { _id: itemId, stock: { $gt: 0 } },
          [{ $set: { stock: { $max: [{ $subtract: ["$stock", count] }, 0] } } }]
        )
      )
    );

    const updatedUser = await User.findById(userId);
    await Transaction.create({
      userId,
      type: "buy_box",
      amount: -totalCost,
      balanceAfter: updatedUser!.coins,
      description: `เปิดกล่อง "${box.name}" ${times} ครั้ง${freeOpens > 0 ? ` (ฟรี ${freeOpens} ครั้ง)` : ""}`,
      referenceId: box._id,
    });

    await pityDoc.save();

    // สร้าง notification สรุปผลการเปิดกล่อง
    const itemNames = results
      .map((r) => r.type === "coin_reward" ? `💎 +${r.coinRewardAmount} GEM` : r.name)
      .slice(0, 3)
      .join(", ");
    const more = results.length > 3 ? ` และอีก ${results.length - 3} รายการ` : "";
    const freeNote = freeOpens > 0 ? ` (ใช้สิทธิ์ฟรี ${freeOpens} ครั้ง)` : "";
    await notify(
      userId,
      `เปิดกล่อง "${box.name}" ${times} ครั้ง${freeNote}`,
      `ได้รับ: ${itemNames}${more}`,
      "success",
      "/inventory"
    );
    if (totalGemCoinsEarned > 0) {
      await notify(
        userId,
        `ได้รับ +${totalGemCoinsEarned} GemCoin!`,
        `จากการเปิดกล่อง "${box.name}"`,
        "success",
        "/exchange"
      );
    }

    return NextResponse.json({
      success: true,
      results,
      pityCount: pityDoc.count,
      pityThreshold: box.pityThreshold ?? 100,
      coinsSpent: totalCost,
      coinsLeft: updatedUser!.coins,
      gemCoinsEarned: totalGemCoinsEarned,
      gemCoinsTotal: updatedUser!.gemCoins,
      freeOpensUsed: freeOpens,
    });
  } catch (error: any) {
    console.error("Box open error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
