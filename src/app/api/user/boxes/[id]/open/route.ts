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

    const isOutOfStock = box.items.some((bi: any) => {
      const item = bi.itemId as any;
      return item?.type !== "coin_reward" && !item?.unlimitedStock && item?.stock <= 0;
    });

    if (isOutOfStock) {
      return NextResponse.json({ error: "สินค้าบางชิ้นในกล่องนี้หมดสต็อกแล้ว ไม่สามารถสุ่มได้" }, { status: 400 });
    }

    const userId = (session.user as any).id;

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });

    // เช็ค BoxCredit (สิทธิ์เปิดฟรีจากการแลก GemCoin) — เช็คความสามารถจ่ายล่วงหน้าด้วย worst-case (ขอเท่าไหร่คิดเท่านั้น)
    // ค่าใช้จ่ายจริงจะคิดอีกทีหลังสุ่ม ตามจำนวนที่ได้ของจริง (actualRolls) เผื่อของหมดกลางอากาศได้น้อยกว่าที่ขอ
    const boxCredit = await BoxCredit.findOne({ userId, boxId });
    const worstCaseFreeOpens = boxCredit ? Math.min(boxCredit.credits, times) : 0;
    const worstCasePaidOpens = times - worstCaseFreeOpens;
    const worstCaseCost = box.price * worstCasePaidOpens;

    if (user.coins < worstCaseCost) {
      return NextResponse.json({ error: "เหรียญไม่เพียงพอ กรุณาเติมเงิน" }, { status: 400 });
    }

    const PITY_THRESHOLD = box.pityThreshold ?? 100;

    // ดึง/สร้าง pity counter
    let pityDoc = await PityCounter.findOne({ userId, boxId });
    if (!pityDoc) {
      pityDoc = await PityCounter.create({ userId, boxId, count: 0 });
    }

    const results: any[] = [];
    const inventoryDocs: any[] = [];
    let totalGemCoinsEarned = 0;
    // item ที่หมดสต็อกไปแล้วระหว่างเปิดล็อตนี้ (ตัดออกจากการสุ่มรอบถัดไป) — กันชนกับ request อื่นที่ชิงหน่วยสุดท้ายไปพร้อมกัน
    const depletedIds = new Set<string>();
    let actualRolls = 0;

    for (let i = 0; i < times; i++) {
      let granted = false;
      let attemptsLeft = box.items.length + 1; // กันวนซ้ำไม่จบถ้าของหมดพร้อมกันหมดทุกตัว

      while (!granted && attemptsLeft-- > 0) {
        const availableItems = box.items.filter((bi: any) => !depletedIds.has(bi.itemId._id.toString()));
        if (availableItems.length === 0) break; // ของหมดทั้งกล่องกลางอากาศ (race หายากมาก) — หยุดสุ่มรอบนี้

        const availableRare = availableItems.filter(
          (bi: any) => bi.itemId?.rarityId?.order >= PITY_MIN_RARITY_ORDER
        );

        let chosenItemId: string;
        if (pityDoc.count + 1 >= PITY_THRESHOLD && availableRare.length > 0) {
          chosenItemId = weightedRandom(
            availableRare.map((bi: any) => ({ itemId: bi.itemId._id, probability: bi.probability }))
          );
        } else {
          chosenItemId = weightedRandom(
            availableItems.map((bi: any) => ({ itemId: bi.itemId._id, probability: bi.probability }))
          );
        }

        const fullItem = availableItems.find((bi: any) => bi.itemId._id.toString() === chosenItemId)?.itemId;

        // ของจำกัดสต็อก — หักแบบ atomic ทันทีตอนสุ่มได้ ไม่ใช่ตอนจบล็อต กันสองคนชิงหน่วยสุดท้ายพร้อมกันได้ของซ้ำ
        if (fullItem?.type !== "coin_reward" && !fullItem?.unlimitedStock) {
          const decremented = await Item.findOneAndUpdate(
            { _id: fullItem._id, stock: { $gt: 0 } },
            { $inc: { stock: -1 } }
          );
          if (!decremented) {
            depletedIds.add(fullItem._id.toString()); // คนอื่นชิงไปก่อน — ตัดออกแล้วสุ่มใหม่
            continue;
          }
        }

        granted = true;
        const isRare = fullItem?.rarityId?.order >= PITY_MIN_RARITY_ORDER;
        pityDoc.count = isRare ? 0 : pityDoc.count + 1;

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

      if (!granted) break; // ของหมดทั้งกล่องกลางอากาศ — หยุดสุ่มที่เหลือ ไม่เก็บเงินส่วนที่ไม่ได้ของจริง
      actualRolls++;
    }

    if (actualRolls === 0) {
      return NextResponse.json({ error: "สินค้าในกล่องนี้หมดสต็อกพอดี กรุณาลองใหม่อีกครั้ง" }, { status: 400 });
    }

    // คิดเงิน/สิทธิ์ฟรีตามจำนวนที่สุ่มได้จริง (อาจน้อยกว่าที่ขอ ถ้าของหมดกลางอากาศ) ไม่เก็บเกินกว่าที่ได้ของจริง
    const actualFreeOpens = boxCredit ? Math.min(boxCredit.credits, actualRolls) : 0;
    const actualPaidOpens = actualRolls - actualFreeOpens;
    const actualTotalCost = box.price * actualPaidOpens;

    // หักเหรียญ + เพิ่ม gemCoins + XP
    await User.findByIdAndUpdate(userId, {
      $inc: { coins: -actualTotalCost, xp: actualRolls, gemCoins: totalGemCoinsEarned },
    });

    // หัก BoxCredit ที่ใช้ไป
    if (actualFreeOpens > 0) {
      await BoxCredit.findOneAndUpdate(
        { userId, boxId },
        { $inc: { credits: -actualFreeOpens } }
      );
    }

    if (inventoryDocs.length > 0) {
      await Inventory.insertMany(inventoryDocs);
    }

    const updatedUser = await User.findById(userId);
    await Transaction.create({
      userId,
      type: "buy_box",
      amount: -actualTotalCost,
      balanceAfter: updatedUser!.coins,
      description: `เปิดกล่อง "${box.name}" ${actualRolls} ครั้ง${actualFreeOpens > 0 ? ` (ฟรี ${actualFreeOpens} ครั้ง)` : ""}`,
      referenceId: box._id,
    });

    await pityDoc.save();

    // สร้าง notification สรุปผลการเปิดกล่อง
    const itemNames = results
      .map((r) => r.type === "coin_reward" ? `💎 +${r.coinRewardAmount} GEM` : r.name)
      .slice(0, 3)
      .join(", ");
    const more = results.length > 3 ? ` และอีก ${results.length - 3} รายการ` : "";
    const freeNote = actualFreeOpens > 0 ? ` (ใช้สิทธิ์ฟรี ${actualFreeOpens} ครั้ง)` : "";
    await notify(
      userId,
      `เปิดกล่อง "${box.name}" ${actualRolls} ครั้ง${freeNote}`,
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
      coinsSpent: actualTotalCost,
      coinsLeft: updatedUser!.coins,
      gemCoinsEarned: totalGemCoinsEarned,
      gemCoinsTotal: updatedUser!.gemCoins,
      freeOpensUsed: actualFreeOpens,
    });
  } catch (error: any) {
    console.error("Box open error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
