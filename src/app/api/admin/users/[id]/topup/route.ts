import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { amount } = body;

    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
    }

    await connectToDatabase();
    
    // Top up coins and also add xp (1 coin = 1 xp as a basic rule, or just add coins)
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { 
        $inc: { 
          coins: amount,
          xp: amount // Give them some XP for topping up
        } 
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Log the transaction
    await Transaction.create({
      userId: updatedUser._id,
      type: "admin_adjust",
      amount: amount,
      balanceAfter: updatedUser.coins,
      description: "แอดมินเติมเงินให้"
    });

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
