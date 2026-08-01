import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import Auction from "@/models/Auction";
import AuctionBid from "@/models/AuctionBid";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) return null;
  return session;
}

// GET /api/admin/auction/winners — ประวัติผู้ชนะทั้งหมด + จำนวน unique bidders
export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();

  const auctions = await Auction.find({ status: "ended" })
    .sort({ endsAt: -1 })
    .lean();

  const results = await Promise.all(
    auctions.map(async (a) => {
      const uniqueBidders = await AuctionBid.distinct("userId", { auctionId: a._id });
      return {
        _id: a._id,
        title: a.title,
        gameImage: (a as any).gameImages?.[0] || a.gameImage || "",
        tag: a.tag,
        tagColor: a.tagColor,
        topBidder: a.topBidder || null,
        winnerBid: a.winnerBid || 0,
        winnerClaimed: a.winnerClaimed || false,
        totalBids: a.totalBids,
        uniqueBidders: uniqueBidders.length,
        endsAt: a.endsAt,
        startBid: a.startBid,
      };
    })
  );

  return NextResponse.json(results);
}
