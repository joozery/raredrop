import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Auction from "@/models/Auction";
import AuctionBid from "@/models/AuctionBid";

// POST /api/auction/[id]/end — client trigger ให้ปิดประมูลเมื่อหมดเวลา
// ใครก็เรียกได้ แต่ server validate เองว่า endsAt ผ่านไปแล้ว + idempotent
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await connectToDatabase();

  const auction = await Auction.findById(id);
  if (!auction) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

  // ถ้าปิดไปแล้ว ส่งข้อมูลผู้ชนะคืนเลย (idempotent)
  if (auction.status === "ended") {
    return NextResponse.json({
      ended: true,
      winnerId: auction.winnerId ? String(auction.winnerId) : null,
      winnerBid: auction.winnerBid || 0,
      topBidder: auction.topBidder || null,
    });
  }

  // validate ว่าหมดเวลาจริง (ป้องกัน abuse)
  if (auction.status !== "active" || auction.endsAt > new Date()) {
    return NextResponse.json({ ended: false, reason: "ยังไม่หมดเวลา" });
  }

  // หาผู้ชนะ
  const topBid = await AuctionBid.findOne({ auctionId: id }).sort({ amount: -1 });

  auction.status = "ended";
  if (topBid) {
    auction.winnerId    = topBid.userId;
    auction.winnerBid   = topBid.amount;
    auction.winnerClaimed = false;
  }
  await auction.save();

  // emit Socket.IO
  if (topBid) {
    try {
      const io = (globalThis as any).__io;
      if (io) {
        io.emit("auction:winner", {
          auctionId: id,
          winnerId: String(topBid.userId),
          title: auction.title,
          winnerBid: topBid.amount,
          topBidder: topBid.displayName,
        });
      }
    } catch {}
  }

  return NextResponse.json({
    ended: true,
    winnerId: topBid ? String(topBid.userId) : null,
    winnerBid: topBid?.amount || 0,
    topBidder: topBid?.displayName || null,
  });
}
