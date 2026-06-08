import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type');

    await connectToDatabase();
    
    let query: any = {};
    if (userId) query.userId = userId;
    if (type) query.type = type;

    const transactions = await Transaction.find(query)
      .populate({ path: 'userId', model: User, select: 'name email avatar' })
      .sort({ createdAt: -1 })
      .limit(300);

    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
