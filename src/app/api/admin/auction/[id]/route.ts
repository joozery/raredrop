import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import Auction from "@/models/Auction";
import AuctionBid from "@/models/AuctionBid";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) return null;
  return session;
}

// GET /api/admin/auction/[id]
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await connectToDatabase();
  const auction = await Auction.findById(id).lean();
  if (!auction) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const bids = await AuctionBid.find({ auctionId: id }).sort({ amount: -1 }).lean();
  return NextResponse.json({ auction, bids });
}

// PUT /api/admin/auction/[id] — แก้ไข หรือ เปลี่ยน status (ended/cancelled)
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  await connectToDatabase();

  const auction = await Auction.findById(id);
  if (!auction) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // ถ้าเปลี่ยน status เป็น "ended" → set winner จาก top bid
  let winnerUserId: string | null = null;
  let winnerDisplayName: string | null = null;
  if (body.status === "ended" && auction.status !== "ended") {
    const topBid = await AuctionBid.findOne({ auctionId: id }).sort({ amount: -1 });
    if (topBid) {
      body.winnerId = topBid.userId;
      body.winnerBid = topBid.amount;
      body.winnerClaimed = false;
      winnerUserId = topBid.userId.toString();
      winnerDisplayName = topBid.displayName || null;
    }
  }

  // ถ้าเปลี่ยน status เป็น "cancelled" → คืนเงินผู้ประมูลสูงสุด
  if (body.status === "cancelled" && auction.status === "active") {
    const topBid = await AuctionBid.findOne({ auctionId: id }).sort({ amount: -1 });
    if (topBid) {
      const refunded = await User.findByIdAndUpdate(topBid.userId, { $inc: { coins: topBid.amount } }, { new: true });
      if (refunded) {
        await Transaction.create({
          userId: topBid.userId,
          type: "auction_refund",
          amount: topBid.amount,
          balanceAfter: refunded.coins,
          description: `คืนเหรียญ (ยกเลิกประมูล "${auction.title}")`,
          referenceId: auction._id,
        });
      }
    }
  }

  const updated = await Auction.findByIdAndUpdate(id, body, { new: true });

  // แจ้งผู้ชนะผ่าน Socket.IO ถ้ามี
  if (winnerUserId) {
    try {
      const io = (globalThis as any).__io;
      if (io) {
        io.emit("auction:winner", {
          auctionId: id,
          winnerId: winnerUserId,
          title: auction.title,
          winnerBid: body.winnerBid,
          topBidder: winnerDisplayName,
        });
      }
    } catch {}
  }

  return NextResponse.json(updated);
}

// DELETE /api/admin/auction/[id]
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await connectToDatabase();

  const auction = await Auction.findById(id);
  if (!auction) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // คืนเงินก่อนลบ
  if (auction.status === "active") {
    const topBid = await AuctionBid.findOne({ auctionId: id }).sort({ amount: -1 });
    if (topBid) {
      const refunded = await User.findByIdAndUpdate(topBid.userId, { $inc: { coins: topBid.amount } }, { new: true });
      if (refunded) {
        await Transaction.create({
          userId: topBid.userId,
          type: "auction_refund",
          amount: topBid.amount,
          balanceAfter: refunded.coins,
          description: `คืนเหรียญ (ลบประมูล "${auction.title}")`,
          referenceId: auction._id,
        });
      }
    }
  }

  await AuctionBid.deleteMany({ auctionId: id });
  await Auction.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
