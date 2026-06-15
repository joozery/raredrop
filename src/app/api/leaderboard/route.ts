import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";
import Inventory from "@/models/Inventory";
import Transaction from "@/models/Transaction";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "spent";

    await connectToDatabase();

    if (type === "items") {
      const data = await Inventory.aggregate([
        { $group: { _id: "$userId", itemCount: { $sum: 1 } } },
        { $sort: { itemCount: -1 } },
        { $limit: 20 },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
        { $unwind: "$user" },
        { $project: { _id: 0, userId: "$_id", name: "$user.name", avatar: "$user.avatar", itemCount: 1 } },
      ]);
      return NextResponse.json(data);
    }

    // default: top by coins spent (buy_box transactions)
    const data = await Transaction.aggregate([
      { $match: { type: "buy_box" } },
      { $group: { _id: "$userId", totalSpent: { $sum: { $abs: "$amount" } }, openCount: { $sum: 1 } } },
      { $sort: { totalSpent: -1 } },
      { $limit: 20 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $project: { _id: 0, userId: "$_id", name: "$user.name", avatar: "$user.avatar", totalSpent: 1, openCount: 1 } },
    ]);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
