import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Auction from "@/models/Auction";
import AuctionBid from "@/models/AuctionBid";

// POST /api/internal/auction/auto-end — ปิดการประมูลที่หมดเวลาอัตโนมัติ
export async function POST(req: Request) {
  const key = req.headers.get("x-internal-key");
  if (!key || key !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const expired = await Auction.find({
    status: "active",
    endsAt: { $lte: new Date() },
  });

  if (expired.length === 0) return NextResponse.json({ ended: 0 });

  let ended = 0;
  for (const auction of expired) {
    const topBid = await AuctionBid.findOne({ auctionId: auction._id }).sort({ amount: -1 });
    const update: any = { status: "ended" };
    if (topBid) {
      update.winnerId = topBid.userId;
      update.winnerBid = topBid.amount;
      update.winnerClaimed = false;
    }
    await Auction.findByIdAndUpdate(auction._id, update);

    // แจ้งผู้ชนะผ่าน Socket.IO
    if (topBid) {
      try {
        const io = (globalThis as any).__io;
        if (io) {
          io.emit("auction:winner", {
            auctionId: String(auction._id),
            winnerId: String(topBid.userId),
            title: auction.title,
            winnerBid: topBid.amount,
            topBidder: topBid.displayName,
          });
        }
      } catch {}
    }

    ended++;
  }

  return NextResponse.json({ ended });
}
