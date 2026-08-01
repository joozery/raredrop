import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import Auction from "@/models/Auction";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json([], { status: 200 });

    await connectToDatabase();

    const wins = await Auction.find({
      winnerId: userId,
      status: "ended",
      winnerClaimed: { $ne: true },
    }).select("title gameImages currentBid winnerBid endsAt").lean();

    return NextResponse.json(wins);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
