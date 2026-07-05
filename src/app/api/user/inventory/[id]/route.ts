import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import Inventory from "@/models/Inventory";
import Item from "@/models/Item";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import Order from "@/models/Order";
import Rarity from "@/models/Rarity";
import Box from "@/models/Box";
import { getOrCreateConversation, appendUserMessage } from "@/lib/chat";
import { notify } from "@/lib/notify";
import { createDeliveryTicket } from "@/lib/discordBot";
import { notifyDiscordChat } from "@/lib/discordNotify";

// action: "sell" | "deliver" | "market" | "unlist"
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { action, price, uid, ign, channel } = await req.json();

    await connectToDatabase();

    const inv = await Inventory.findOne({ _id: id, userId })
      .populate({
        path: "itemId",
        model: Item,
        select: "name price sellPrice rarityId image",
        populate: { path: "rarityId", model: Rarity, select: "name" },
      })
      .populate({ path: "boxId", model: Box, select: "name" });

    if (!inv) return NextResponse.json({ error: "ไม่พบไอเทมนี้" }, { status: 404 });

    const item = inv.itemId as any;

    if (action === "sell") {
      // ขายคืนระบบ ได้ coins ตามราคาไอเทม
      if (inv.status !== "kept") {
        return NextResponse.json({ error: "สามารถขายได้เฉพาะไอเทมที่เก็บไว้เท่านั้น" }, { status: 400 });
      }

      const sellPrice = (item.sellPrice != null && item.sellPrice >= 0) ? item.sellPrice : item.price;
      inv.status = "sold";
      await inv.save();

      const user = await User.findByIdAndUpdate(
        userId,
        { $inc: { coins: sellPrice } },
        { new: true }
      );

      await Transaction.create({
        userId,
        type: "sell_item",
        amount: sellPrice,
        balanceAfter: user!.coins,
        description: `ขายคืน "${item.name}"`,
        referenceId: inv._id,
      });

      await notify(
        userId,
        `ขายคืนสำเร็จ! 💰`,
        `ได้รับ ฿${sellPrice.toLocaleString()} จากการขาย "${item.name}"`,
        "success"
      );

      return NextResponse.json({ success: true, coinsEarned: sellPrice, coinsLeft: user!.coins });
    }

    if (action === "deliver") {
      if (inv.status !== "kept") {
        return NextResponse.json({ error: "สามารถขอรับของได้เฉพาะไอเทมที่เก็บไว้เท่านั้น" }, { status: 400 });
      }
      const uidValue = typeof uid === "string" ? uid.trim() : "";
      if (!uidValue) {
        return NextResponse.json({ error: "กรุณากรอก UID" }, { status: 400 });
      }
      const ignValue = typeof ign === "string" ? ign.trim() : "";
      if (!ignValue) {
        return NextResponse.json({ error: "กรุณากรอกชื่อในเกม" }, { status: 400 });
      }

      // ช่องทางที่ลูกค้าเลือก: "discord" หรือ "livechat" (ค่าเริ่มต้น)
      const deliverChannel = channel === "discord" ? "discord" : "livechat";

      // โค้ดอ่านง่ายแทน ObjectId ดิบ
      const ticketRef = `TK-${String(inv._id).slice(-6).toUpperCase()}`;
      const itemSku = `ITEM-${String(item._id).slice(-6).toUpperCase()}`;

      const user = await User.findById(userId).select("name email lineId");
      const box = inv.boxId as any;

      let conversationId: string | undefined;

      inv.status = "delivered";

      if (deliverChannel === "discord") {
        // เปิด ticket เป็น thread แยกใน Discord พร้อมปุ่มรับงาน/ปิด ticket
        const ticket = await createDeliveryTicket({
          inventoryId: String(inv._id),
          ref: ticketRef,
          itemName: item.name,
          itemSku,
          value: item.price,
          rarity: item.rarityId?.name,
          boxName: box?.name,
          customerName: user?.name || "ไม่ระบุ",
          customerContact: user?.email || user?.lineId || undefined,
          uid: uidValue,
          ign: ignValue,
          imageUrl: item.image,
        });
        if (ticket) {
          inv.discordThreadId = ticket.threadId;
          inv.discordThreadUrl = ticket.threadUrl;
          inv.ticketStatus = "open";
        }
      } else {
        // เปิดเคสใหม่ในแชทในเว็บอย่างเดียว (ไม่แตะ Discord)
        const ticketSummary = [
          `📦 คำขอรับของจริง (${ticketRef})`,
          `สินค้า: ${item.name}`,
          `เลขสินค้า: ${itemSku}`,
          `มูลค่า: ฿${Number(item.price || 0).toLocaleString()}`,
          `UID: ${uidValue}`,
          `ชื่อในเกม: ${ignValue}`,
        ].join("\n");

        const convo = await getOrCreateConversation(userId, `รับของจริง: ${item.name}`);
        await appendUserMessage(convo, ticketSummary, item.image);
        conversationId = String(convo._id);

        notifyDiscordChat({
          userName: user?.name,
          userEmail: user?.email,
          conversationId,
          text: ticketSummary,
          imageUrl: item.image,
          isNew: true,
        });
      }

      await inv.save();

      await notify(
        userId,
        `รับคำขอรับของจริงแล้ว 📦`,
        `ทีมงานได้รับคำขอรับ "${item.name}" แล้ว` +
          (deliverChannel === "discord"
            ? " กรุณาติดต่อทีมงานผ่าน Discord เพื่อยืนยันการจัดส่ง"
            : " ติดต่อทีมงานต่อผ่านแชทในเว็บเพื่อยืนยันการจัดส่ง"),
        "info"
      );

      return NextResponse.json({
        success: true,
        ticket: {
          ref: ticketRef,
          itemName: item.name,
          conversationId,
        },
      });
    }

    if (action === "market") {
      if (inv.status !== "kept") {
        return NextResponse.json({ error: "สามารถนำขายได้เฉพาะไอเทมที่เก็บไว้เท่านั้น" }, { status: 400 });
      }
      if (!price || typeof price !== "number" || price <= 0) {
        return NextResponse.json({ error: "กรุณาระบุราคาขาย" }, { status: 400 });
      }

      inv.status = "market";
      await inv.save();

      await Order.create({
        sellerId: userId,
        inventoryId: inv._id,
        itemId: item._id,
        price,
        status: "active",
      });

      return NextResponse.json({ success: true });
    }

    if (action === "unlist") {
      // ถอนออกจากตลาด
      if (inv.status !== "market") {
        return NextResponse.json({ error: "ไอเทมนี้ไม่ได้อยู่ในตลาด" }, { status: 400 });
      }

      await Order.findOneAndUpdate(
        { inventoryId: inv._id, status: "active" },
        { status: "cancelled" }
      );

      inv.status = "kept";
      await inv.save();

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "action ไม่ถูกต้อง" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
