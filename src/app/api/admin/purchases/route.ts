import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Purchase from "@/models/Purchase";
import Inventory from "@/models/Inventory";
import Item from "@/models/Item";
import User from "@/models/User";
import Setting from "@/models/Setting";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getOrCreateConversation, appendAdminMessage } from "@/lib/chat";
import { notify } from "@/lib/notify";

const DEFAULT_DONE_MESSAGE = "เติมเรียบร้อยแล้วครับ ✅ ขอบคุณที่อุดหนุนครับ 🙏";

function isAdmin(session: any) {
  return session && ["admin", "super_admin"].includes((session.user as any)?.role);
}

// GET — รายการออเดอร์รวม (ซื้อจากร้าน + ขอรับของจริง) สำหรับหน้า orders หลังบ้าน
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();

    // ออเดอร์จากร้านค้า — รวม record ที่ batchId เดียวกันเป็นออเดอร์เดียว
    const purchases = await Purchase.find()
      .populate({ path: "userId", model: User, select: "name avatar email" })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    const shopMap = new Map<string, any>();
    for (const p of purchases as any[]) {
      const key = p.batchId || String(p._id);
      if (!shopMap.has(key)) {
        shopMap.set(key, {
          id: key,
          type: "shop",
          createdAt: p.createdAt,
          user: p.userId,
          title: p.listingTitle,
          image: p.listingImage || "",
          buyerUid: p.buyerUid || "",
          quantity: 0,
          totalPrice: 0,
          deliveredData: [] as string[],
          fulfilled: true,
        });
      }
      const g = shopMap.get(key);
      g.quantity += 1;
      g.totalPrice += p.pricePaid || 0;
      g.deliveredData.push(p.deliveredData);
      g.fulfilled = g.fulfilled && !!p.fulfilled;
    }

    // ออเดอร์ "ขอรับของจริง" — inventory ที่ลูกค้ากดรับของ
    const delivers = await Inventory.find({ status: "delivered" })
      .populate({ path: "userId", model: User, select: "name avatar email" })
      .populate({ path: "itemId", model: Item, select: "name image price" })
      .sort({ updatedAt: -1 })
      .limit(500)
      .lean();

    const deliverOrders = (delivers as any[]).map((d) => ({
      id: String(d._id),
      type: "deliver",
      createdAt: d.updatedAt || d.acquiredAt,
      user: d.userId,
      title: d.itemId?.name || "ไอเทม",
      image: d.itemId?.image || "",
      uid: d.deliverUid || "",
      ign: d.deliverIgn || "",
      channel: d.deliverChannel || "livechat",
      fulfilled: !!d.fulfilled,
    }));

    const orders = [...shopMap.values(), ...deliverOrders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const doneSetting = await Setting.findOne({ key: "order_done_message" }).lean();
    const doneMessage = ((doneSetting as any)?.value as string) || DEFAULT_DONE_MESSAGE;

    return NextResponse.json({ orders, doneMessage });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — กด "จบงาน/จัดส่งแล้ว": mark fulfilled + ส่งข้อความ preset เข้าแชทลูกค้า
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const adminId = (session!.user as any).id;

    const { type, id } = await req.json();
    if (!id || !["shop", "deliver"].includes(type)) {
      return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
    }

    await connectToDatabase();

    let userId: string | null = null;

    if (type === "shop") {
      // id = batchId หรือ purchase _id (กรณีข้อมูลเก่าไม่มี batchId)
      const match = { $or: [{ batchId: id }, { _id: id }] };
      const first = await Purchase.findOne(match).lean();
      if (!first) return NextResponse.json({ error: "ไม่พบออเดอร์" }, { status: 404 });
      userId = String((first as any).userId);
      await Purchase.updateMany(match, { $set: { fulfilled: true, fulfilledAt: new Date() } });
    } else {
      const inv = await Inventory.findById(id);
      if (!inv) return NextResponse.json({ error: "ไม่พบออเดอร์" }, { status: 404 });
      userId = String(inv.userId);
      inv.fulfilled = true;
      inv.fulfilledAt = new Date();
      await inv.save();
    }

    if (!userId) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });

    const doneSetting = await Setting.findOne({ key: "order_done_message" }).lean();
    const message = (((doneSetting as any)?.value as string) || DEFAULT_DONE_MESSAGE).trim();

    if (message) {
      const convo = await getOrCreateConversation(userId, "แจ้งผลการจัดส่ง");
      await appendAdminMessage(convo, adminId, message);
      await notify(
        userId,
        "ทีมงานอัปเดตออเดอร์แล้ว 💬",
        message.length > 60 ? message.slice(0, 60) + "…" : message,
        "info"
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
