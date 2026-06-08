import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import Inventory from "@/models/Inventory";
import Item from "@/models/Item";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import Order from "@/models/Order";

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
    const { action, price } = await req.json();

    await connectToDatabase();

    const inv = await Inventory.findOne({ _id: id, userId }).populate({
      path: "itemId",
      model: Item,
      select: "name price",
    });

    if (!inv) return NextResponse.json({ error: "ไม่พบไอเทมนี้" }, { status: 404 });

    const item = inv.itemId as any;

    if (action === "sell") {
      // ขายคืนระบบ ได้ coins ตามราคาไอเทม
      if (inv.status !== "kept") {
        return NextResponse.json({ error: "สามารถขายได้เฉพาะไอเทมที่เก็บไว้เท่านั้น" }, { status: 400 });
      }

      const sellPrice = item.price;
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

      return NextResponse.json({ success: true, coinsEarned: sellPrice, coinsLeft: user!.coins });
    }

    if (action === "deliver") {
      if (inv.status !== "kept") {
        return NextResponse.json({ error: "สามารถขอรับของได้เฉพาะไอเทมที่เก็บไว้เท่านั้น" }, { status: 400 });
      }
      inv.status = "delivered";
      await inv.save();
      return NextResponse.json({ success: true });
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
