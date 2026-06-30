import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";
import Inventory from "@/models/Inventory";
import Transaction from "@/models/Transaction";

function maskName(name: string): string {
  if (!name) return "***";
  const show = Math.min(2, name.length);
  return name.slice(0, show) + "*".repeat(Math.max(3, name.length - show));
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "spent";
    const period = searchParams.get("period") || "all"; // all | month | week

    await connectToDatabase();

    if (type === "items") {
      const rows = await Inventory.aggregate([
        { $group: { _id: "$userId", itemCount: { $sum: 1 } } },
        { $sort: { itemCount: -1 } },
        { $limit: 20 },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
        { $unwind: "$user" },
        { $project: { _id: 0, userId: "$_id", name: "$user.name", avatar: "$user.avatar", hideFromLeaderboard: "$user.hideFromLeaderboard", itemCount: 1 } },
      ]);
      const data = rows.map((r: any) => ({
        userId: r.userId,
        name: r.hideFromLeaderboard ? maskName(r.name) : r.name,
        avatar: r.hideFromLeaderboard ? null : r.avatar,
        itemCount: r.itemCount,
        isHidden: !!r.hideFromLeaderboard,
      }));
      return NextResponse.json(data);
    }

    if (type === "topup") {
      const THAI_OFFSET_MS = 7 * 60 * 60 * 1000;
      const nowUtc = Date.now();
      // nowThai ใช้ getUTC* เพื่ออ่านวัน/เดือน/ปีในเวลาไทย โดยไม่พึ่ง server locale
      const nowThai = new Date(nowUtc + THAI_OFFSET_MS);

      let dateFilter: any = {};
      if (period === "week") {
        // 7 วันย้อนหลังนับจากเที่ยงคืนไทยของวันนี้
        const todayThaiMidnightUtc = Date.UTC(nowThai.getUTCFullYear(), nowThai.getUTCMonth(), nowThai.getUTCDate()) - THAI_OFFSET_MS;
        const weekStartUtc = todayThaiMidnightUtc - 6 * 24 * 60 * 60 * 1000;
        dateFilter = { createdAt: { $gte: new Date(weekStartUtc) } };
      } else if (period === "month") {
        // วันที่ 1 ของเดือนนี้ เที่ยงคืนเวลาไทย → แปลงกลับเป็น UTC
        const monthStartUtc = Date.UTC(nowThai.getUTCFullYear(), nowThai.getUTCMonth(), 1) - THAI_OFFSET_MS;
        dateFilter = { createdAt: { $gte: new Date(monthStartUtc) } };
      }

      const rows = await Transaction.aggregate([
        { $match: { type: "topup", amount: { $gt: 0 }, ...dateFilter } },
        { $group: { _id: "$userId", totalTopup: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $sort: { totalTopup: -1 } },
        { $limit: 50 },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
        { $unwind: "$user" },
        { $project: { _id: 0, userId: "$_id", name: "$user.name", avatar: "$user.avatar", hideFromLeaderboard: "$user.hideFromLeaderboard", totalTopup: 1, count: 1 } },
      ]);

      const data = rows.map((r: any) => ({
        userId: r.userId,
        name: r.hideFromLeaderboard ? maskName(r.name) : r.name,
        avatar: r.hideFromLeaderboard ? null : r.avatar,
        totalTopup: r.totalTopup,
        count: r.count,
        isHidden: !!r.hideFromLeaderboard,
      }));
      return NextResponse.json(data);
    }

    // default: top by coins spent (buy_box transactions)
    const rows = await Transaction.aggregate([
      { $match: { type: "buy_box" } },
      { $group: { _id: "$userId", totalSpent: { $sum: { $abs: "$amount" } }, openCount: { $sum: 1 } } },
      { $sort: { totalSpent: -1 } },
      { $limit: 20 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $project: { _id: 0, userId: "$_id", name: "$user.name", avatar: "$user.avatar", hideFromLeaderboard: "$user.hideFromLeaderboard", totalSpent: 1, openCount: 1 } },
    ]);
    const data = rows.map((r: any) => ({
      userId: r.userId,
      name: r.hideFromLeaderboard ? maskName(r.name) : r.name,
      avatar: r.hideFromLeaderboard ? null : r.avatar,
      totalSpent: r.totalSpent,
      openCount: r.openCount,
      isHidden: !!r.hideFromLeaderboard,
    }));
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
