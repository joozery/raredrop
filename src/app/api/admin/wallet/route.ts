import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [
      systemCoins,
      usersWithCoins,
      totalTopups,
      totalWithdraws,
      thisMonthTopups,
      lastMonthTopups,
      totalBoxRevenue,
      totalMarketVolume,
      topTopupUsers,
      recentTopups,
      coinDistribution,
    ] = await Promise.all([
      User.aggregate([{ $match: { role: "user" } }, { $group: { _id: null, total: { $sum: "$coins" } } }]),
      User.countDocuments({ role: "user", coins: { $gt: 0 } }),
      Transaction.aggregate([
        { $match: { type: "topup" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        { $match: { type: "withdraw" } },
        { $group: { _id: null, total: { $sum: { $abs: "$amount" } }, count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        { $match: { type: "topup", createdAt: { $gte: thisMonthStart } } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        { $match: { type: "topup", createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        { $match: { type: "buy_box" } },
        { $group: { _id: null, total: { $sum: { $abs: "$amount" } }, count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        { $match: { type: "market_buy" } },
        { $group: { _id: null, total: { $sum: { $abs: "$amount" } }, count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        { $match: { type: "topup" } },
        { $group: { _id: "$userId", totalTopup: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $sort: { totalTopup: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            name: "$user.name",
            avatar: "$user.avatar",
            coins: "$user.coins",
            totalTopup: 1,
            count: 1,
          },
        },
      ]),
      Transaction.find({ type: "topup" })
        .populate({ path: "userId", model: User, select: "name avatar email" })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      User.aggregate([
        { $match: { role: "user" } },
        {
          $bucket: {
            groupBy: "$coins",
            boundaries: [0, 1, 101, 501, 2001],
            default: "2001+",
            output: { count: { $sum: 1 } },
          },
        },
      ]),
    ]);

    const totalCoinsInSystem = systemCoins[0]?.total || 0;
    const totalTopupsAmount = totalTopups[0]?.total || 0;
    const totalTopupsCount = totalTopups[0]?.count || 0;
    const totalWithdrawsAmount = totalWithdraws[0]?.total || 0;
    const totalWithdrawsCount = totalWithdraws[0]?.count || 0;
    const thisMonthTotal = thisMonthTopups[0]?.total || 0;
    const lastMonthTotal = lastMonthTopups[0]?.total || 0;

    const topupChangePercent =
      lastMonthTotal > 0
        ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100
        : thisMonthTotal > 0
        ? 100
        : 0;

    const withdrawPercent =
      totalTopupsAmount > 0 ? (totalWithdrawsAmount / totalTopupsAmount) * 100 : 0;

    const bucketLabels: Record<string, string> = {
      "0": "ไม่มีเหรียญ",
      "1": "1–100",
      "101": "101–500",
      "501": "501–2,000",
      "2001": "2,001+",
      "2001+": "2,001+",
    };

    const distribution = coinDistribution.map((b: any) => ({
      label: bucketLabels[String(b._id)] || String(b._id),
      count: b.count,
    }));

    return NextResponse.json({
      totalCoinsInSystem,
      usersWithCoins,
      totalTopups: { amount: totalTopupsAmount, count: totalTopupsCount },
      totalWithdraws: { amount: totalWithdrawsAmount, count: totalWithdrawsCount },
      thisMonthTopups: thisMonthTotal,
      lastMonthTopups: lastMonthTotal,
      topupChangePercent,
      withdrawPercent,
      boxRevenue: {
        amount: totalBoxRevenue[0]?.total || 0,
        count: totalBoxRevenue[0]?.count || 0,
      },
      marketVolume: {
        amount: totalMarketVolume[0]?.total || 0,
        count: totalMarketVolume[0]?.count || 0,
      },
      topTopupUsers,
      recentTopups,
      coinDistribution: distribution,
    });
  } catch (error: any) {
    console.error("Wallet API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
