import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import Order from "@/models/Order";
import Inventory from "@/models/Inventory";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import Item from "@/models/Item";

// POST /api/user/market/[id] — ซื้อสินค้าจาก marketplace
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const buyerId = (session?.user as any)?.id;
    if (!buyerId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });

    const { id: orderId } = await params;
    await connectToDatabase();

    const order = await Order.findById(orderId).populate({
      path: "itemId",
      model: Item,
      select: "name price",
    });

    if (!order || order.status !== "active") {
      return NextResponse.json({ error: "ไม่พบสินค้านี้หรือถูกซื้อไปแล้ว" }, { status: 404 });
    }

    if (order.sellerId.toString() === buyerId) {
      return NextResponse.json({ error: "ไม่สามารถซื้อสินค้าของตัวเองได้" }, { status: 400 });
    }

    const buyer = await User.findById(buyerId);
    if (!buyer || buyer.coins < order.price) {
      return NextResponse.json({ error: "เหรียญไม่เพียงพอ" }, { status: 400 });
    }

    const item = order.itemId as any;

    // หัก coins ผู้ซื้อ
    const updatedBuyer = await User.findByIdAndUpdate(
      buyerId,
      { $inc: { coins: -order.price } },
      { new: true }
    );

    // โอน coins ให้ผู้ขาย (หัก fee 5%)
    const fee = Math.floor(order.price * 0.05);
    const sellerEarns = order.price - fee;
    const updatedSeller = await User.findByIdAndUpdate(
      order.sellerId,
      { $inc: { coins: sellerEarns } },
      { new: true }
    );

    // โอน inventory ให้ผู้ซื้อ
    await Inventory.findByIdAndUpdate(order.inventoryId, {
      userId: buyerId,
      status: "kept",
    });

    // อัพเดท order
    order.buyerId = buyerId;
    order.status = "sold";
    await order.save();

    // บันทึก transactions
    await Transaction.create([
      {
        userId: buyerId,
        type: "market_buy",
        amount: -order.price,
        balanceAfter: updatedBuyer!.coins,
        description: `ซื้อ "${item?.name}" จากตลาด`,
        referenceId: order._id,
      },
      {
        userId: order.sellerId,
        type: "market_sell",
        amount: sellerEarns,
        balanceAfter: updatedSeller!.coins,
        description: `ขาย "${item?.name}" ในตลาด (หัก fee 5%)`,
        referenceId: order._id,
      },
    ]);

    return NextResponse.json({
      success: true,
      coinsSpent: order.price,
      coinsLeft: updatedBuyer!.coins,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
