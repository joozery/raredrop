import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";
import Box from "@/models/Box";
import Item from "@/models/Item";
import Transaction from "@/models/Transaction";
import Order from "@/models/Order";
import Inventory from "@/models/Inventory";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      newUsersToday,
      totalBoxes,
      totalItems,
      // รายได้จากการซื้อกล่องวันนี้
      todayBoxRevenue,
      // ยอดเติมเงินวันนี้
      todayTopups,
      // จำนวนกล่องที่เปิดวันนี้
      boxOpenedToday,
      // ออเดอร์ค้างส่ง (inventory ที่ status = delivered แต่ยังต้องดำเนินการ)
      pendingDeliveries,
      // มูลค่าตลาดวันนี้
      todayMarketVolume,
      // ยอดเหรียญรวมในระบบ
      totalCoins,
      // กราฟรายได้ 7 วันล่าสุด
      revenueChart,
      // กล่องยอดนิยม
      topBoxes,
      // กิจกรรมล่าสุด
      recentActivity,
      // ออเดอร์ล่าสุด (marketplace)
      recentOrders,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "user", createdAt: { $gte: todayStart } }),
      Box.countDocuments({ isActive: true }),
      Item.countDocuments({ isActive: true }),
      Transaction.aggregate([
        { $match: { type: "buy_box", createdAt: { $gte: todayStart } } },
        { $group: { _id: null, total: { $sum: { $abs: "$amount" } } } },
      ]),
      Transaction.aggregate([
        { $match: { type: "topup", createdAt: { $gte: todayStart } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Inventory.countDocuments({ acquiredAt: { $gte: todayStart } }),
      Inventory.countDocuments({ status: "delivered" }),
      Transaction.aggregate([
        { $match: { type: { $in: ["market_buy", "market_sell"] }, createdAt: { $gte: todayStart } } },
        { $group: { _id: null, total: { $sum: { $abs: "$amount" } } } },
      ]),
      User.aggregate([{ $group: { _id: null, total: { $sum: "$coins" } } }]),
      // Revenue chart 7 วัน
      Transaction.aggregate([
        {
          $match: {
            type: "buy_box",
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: { $abs: "$amount" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // Top boxes by inventory count
      Inventory.aggregate([
        { $match: { boxId: { $ne: null } } },
        { $group: { _id: "$boxId", openCount: { $sum: 1 } } },
        { $sort: { openCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "boxes",
            localField: "_id",
            foreignField: "_id",
            as: "box",
          },
        },
        { $unwind: "$box" },
        {
          $project: {
            name: "$box.name",
            image: "$box.image",
            price: "$box.price",
            openCount: 1,
            revenue: { $multiply: ["$openCount", "$box.price"] },
          },
        },
      ]),
      // Recent activity (transactions)
      Transaction.find()
        .populate({ path: "userId", model: User, select: "name avatar" })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      // Recent marketplace orders
      Order.find({ status: { $in: ["active", "sold"] } })
        .populate({ path: "sellerId", model: User, select: "name avatar" })
        .populate({ path: "buyerId", model: User, select: "name" })
        .populate({
          path: "itemId",
          model: Item,
          select: "name image price rarityId",
          populate: { path: "rarityId", select: "name color" },
        })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const todayRevenue = todayBoxRevenue[0]?.total || 0;
    const todayTopupAmount = todayTopups[0]?.total || 0;
    const todayMarket = todayMarketVolume[0]?.total || 0;
    const systemCoins = totalCoins[0]?.total || 0;

    return NextResponse.json({
      kpi: {
        todayRevenue,
        boxOpenedToday,
        newUsersToday,
        pendingDeliveries,
        todayMarketVolume: todayMarket,
        todayTopups: todayTopupAmount,
      },
      overview: {
        totalUsers,
        totalBoxes,
        totalItems,
        systemCoins,
      },
      revenueChart,
      topBoxes,
      recentActivity,
      recentOrders,
    });
  } catch (error: any) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
