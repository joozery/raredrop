import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";
import Inventory from "@/models/Inventory";
import Item from "@/models/Item";
import Transaction from "@/models/Transaction";

export async function GET() {
  try {
    await connectToDatabase();

    const [totalUsers, totalBoxesOpened, totalItems, totalValueResult] = await Promise.all([
      User.countDocuments({ role: "user" }),
      Inventory.countDocuments(),
      Item.countDocuments({ isActive: true }),
      Transaction.aggregate([
        { $match: { type: "buy_box" } },
        { $group: { _id: null, total: { $sum: { $abs: "$amount" } } } },
      ]),
    ]);

    return NextResponse.json({
      totalUsers,
      totalBoxesOpened,
      totalItems,
      totalValue: totalValueResult[0]?.total || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
