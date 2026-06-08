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

const PITY_THRESHOLD = 100; // การันตีของ rare ทุก 100 ครั้ง
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
    const totalCost = box.price * times;

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    if (user.coins < totalCost) {
      return NextResponse.json({ error: "เหรียญไม่เพียงพอ กรุณาเติมเงิน" }, { status: 400 });
    }

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

      inventoryDocs.push({ userId, itemId: chosenItemId, boxId: box._id, status: "kept" });
      results.push({
        itemId: chosenItemId,
        name: fullItem?.name,
        image: fullItem?.image,
        price: fullItem?.price,
        rarity: fullItem?.rarityId,
      });
    }

    // Atomic: หักเหรียญ + บันทึก inventory + transaction
    await User.findByIdAndUpdate(userId, { $inc: { coins: -totalCost, xp: times } });
    const inventories = await Inventory.insertMany(inventoryDocs);

    const updatedUser = await User.findById(userId);
    await Transaction.create({
      userId,
      type: "buy_box",
      amount: -totalCost,
      balanceAfter: updatedUser!.coins,
      description: `เปิดกล่อง "${box.name}" ${times} ครั้ง`,
      referenceId: box._id,
    });

    await pityDoc.save();

    return NextResponse.json({
      success: true,
      results,
      pityCount: pityDoc.count,
      pityThreshold: PITY_THRESHOLD,
      coinsSpent: totalCost,
      coinsLeft: updatedUser!.coins,
    });
  } catch (error: any) {
    console.error("Box open error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
