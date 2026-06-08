import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import Inventory from "@/models/Inventory";
import Order from "@/models/Order";
import Item from "@/models/Item";
import Box from "@/models/Box";
import Rarity from "@/models/Rarity";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [
      // Revenue breakdown by type this month
      revenueByType,
      // Daily revenue (buy_box) last 30 days
      dailyBoxRevenue,
      // Daily topup last 30 days
      dailyTopup,
      // User growth last 30 days
      userGrowth,
      // Top items by sold count
      topItems,
      // Top boxes by open count
      topBoxes,
      // Summary this month
      thisMonthSummary,
      // Summary last month
      lastMonthSummary,
      // Total counts
      totalUsers,
      totalOrders,
      totalInventories,
    ] = await Promise.all([
      // Revenue by type this month
      Transaction.aggregate([
        { $match: { createdAt: { $gte: thisMonthStart } } },
        {
          $group: {
            _id: "$type",
            total: { $sum: { $abs: "$amount" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]),

      // Daily box revenue 30 days
      Transaction.aggregate([
        { $match: { type: "buy_box", createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: { $abs: "$amount" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Daily topup 30 days
      Transaction.aggregate([
        { $match: { type: "topup", createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            revenue: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // User growth 30 days
      User.aggregate([
        { $match: { role: "user", createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Top 10 items by how many times pulled from boxes
      Inventory.aggregate([
        { $group: { _id: "$itemId", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "items",
            localField: "_id",
            foreignField: "_id",
            as: "item",
          },
        },
        { $unwind: { path: "$item", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "rarities",
            localField: "item.rarityId",
            foreignField: "_id",
            as: "rarity",
          },
        },
        { $unwind: { path: "$rarity", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            name: "$item.name",
            image: "$item.image",
            price: "$item.price",
            rarityName: "$rarity.name",
            rarityColor: "$rarity.color",
            count: 1,
          },
        },
      ]),

      // Top 10 boxes by open count
      Inventory.aggregate([
        { $match: { boxId: { $ne: null } } },
        { $group: { _id: "$boxId", openCount: { $sum: 1 } } },
        { $sort: { openCount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "boxes",
            localField: "_id",
            foreignField: "_id",
            as: "box",
          },
        },
        { $unwind: { path: "$box", preserveNullAndEmptyArrays: true } },
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

      // This month summary
      Transaction.aggregate([
        { $match: { createdAt: { $gte: thisMonthStart } } },
        {
          $group: {
            _id: null,
            boxRevenue: {
              $sum: { $cond: [{ $eq: ["$type", "buy_box"] }, { $abs: "$amount" }, 0] },
            },
            topups: {
              $sum: { $cond: [{ $eq: ["$type", "topup"] }, "$amount", 0] },
            },
            marketVolume: {
              $sum: { $cond: [{ $eq: ["$type", "market_buy"] }, { $abs: "$amount" }, 0] },
            },
          },
        },
      ]),

      // Last month summary
      Transaction.aggregate([
        { $match: { createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
        {
          $group: {
            _id: null,
            boxRevenue: {
              $sum: { $cond: [{ $eq: ["$type", "buy_box"] }, { $abs: "$amount" }, 0] },
            },
            topups: {
              $sum: { $cond: [{ $eq: ["$type", "topup"] }, "$amount", 0] },
            },
            marketVolume: {
              $sum: { $cond: [{ $eq: ["$type", "market_buy"] }, { $abs: "$amount" }, 0] },
            },
          },
        },
      ]),

      User.countDocuments({ role: "user" }),
      Order.countDocuments(),
      Inventory.countDocuments(),
    ]);

    const typeLabels: Record<string, string> = {
      topup: "เติมเงิน",
      withdraw: "ถอนเงิน",
      buy_box: "เปิดกล่อง",
      sell_item: "ขายคืน",
      market_buy: "ซื้อจากตลาด",
      market_sell: "ขายในตลาด",
      admin_adjust: "Admin ปรับ",
    };

    const thisMonth = thisMonthSummary[0] || { boxRevenue: 0, topups: 0, marketVolume: 0 };
    const lastMonth = lastMonthSummary[0] || { boxRevenue: 0, topups: 0, marketVolume: 0 };

    const changePct = (cur: number, prev: number) =>
      prev > 0 ? ((cur - prev) / prev) * 100 : cur > 0 ? 100 : 0;

    return NextResponse.json({
      summary: {
        thisMonth,
        lastMonth,
        changes: {
          boxRevenue: changePct(thisMonth.boxRevenue, lastMonth.boxRevenue),
          topups: changePct(thisMonth.topups, lastMonth.topups),
          marketVolume: changePct(thisMonth.marketVolume, lastMonth.marketVolume),
        },
        totalUsers,
        totalOrders,
        totalInventories,
      },
      revenueByType: revenueByType.map((r: any) => ({
        ...r,
        label: typeLabels[r._id] || r._id,
      })),
      dailyBoxRevenue,
      dailyTopup,
      userGrowth,
      topItems,
      topBoxes,
    });
  } catch (error: any) {
    console.error("Reports API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
