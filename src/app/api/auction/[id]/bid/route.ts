import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import Auction from "@/models/Auction";
import AuctionBid from "@/models/AuctionBid";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

// POST /api/auction/[id]/bid — วางเดิมพัน
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });

    const { amount } = await req.json();
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json({ error: "ราคาประมูลไม่ถูกต้อง" }, { status: 400 });
    }

    const { id } = await params;
    await connectToDatabase();

    const auction = await Auction.findById(id);
    if (!auction) return NextResponse.json({ error: "ไม่พบรายการประมูล" }, { status: 404 });
    if (auction.status !== "active") return NextResponse.json({ error: "การประมูลนี้สิ้นสุดแล้ว" }, { status: 400 });
    if (auction.endsAt <= new Date()) return NextResponse.json({ error: "หมดเวลาประมูลแล้ว" }, { status: 400 });

    const minRequired = auction.currentBid + auction.minBidStep;
    if (amount < minRequired) {
      return NextResponse.json({ error: `ต้องประมูลอย่างน้อย ฿${minRequired.toLocaleString()}` }, { status: 400 });
    }

    // ดึง previous highest bidder เพื่อ refund
    const prevTopBid = await AuctionBid.findOne({ auctionId: id })
      .sort({ amount: -1 })
      .lean();

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    if (user.coins < amount) return NextResponse.json({ error: "เหรียญไม่เพียงพอ" }, { status: 400 });

    // หักเหรียญจากผู้ประมูลคนใหม่
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, coins: { $gte: amount } },
      { $inc: { coins: -amount } },
      { new: true }
    );
    if (!updatedUser) return NextResponse.json({ error: "เหรียญไม่เพียงพอ" }, { status: 400 });

    // บันทึก transaction หัก
    await Transaction.create({
      userId,
      type: "auction_bid",
      amount: -amount,
      balanceAfter: updatedUser.coins,
      description: `วางเดิมพันประมูล "${auction.title}" ฿${amount.toLocaleString()}`,
      referenceId: auction._id,
    });

    // คืนเงินผู้ประมูลสูงสุดเดิม (ถ้ามีและไม่ใช่คนเดียวกัน)
    if (prevTopBid && prevTopBid.userId.toString() !== userId) {
      const refundedUser = await User.findByIdAndUpdate(
        prevTopBid.userId,
        { $inc: { coins: prevTopBid.amount } },
        { new: true }
      );
      if (refundedUser) {
        await Transaction.create({
          userId: prevTopBid.userId,
          type: "auction_refund",
          amount: prevTopBid.amount,
          balanceAfter: refundedUser.coins,
          description: `คืนเหรียญจากการถูก outbid "${auction.title}"`,
          referenceId: auction._id,
        });
      }
    }
    // ถ้าคนเดียวกันประมูลเพิ่ม คืนเงิน bid เก่าของตัวเอง
    if (prevTopBid && prevTopBid.userId.toString() === userId) {
      const refunded = await User.findByIdAndUpdate(
        userId,
        { $inc: { coins: prevTopBid.amount } },
        { new: true }
      );
      if (refunded) {
        await Transaction.create({
          userId,
          type: "auction_refund",
          amount: prevTopBid.amount,
          balanceAfter: refunded.coins,
          description: `คืนเหรียญ bid เดิม "${auction.title}" (ประมูลเพิ่ม)`,
          referenceId: auction._id,
        });
      }
    }

    // สร้าง masked display name
    const rawName = (session?.user as any)?.name || (session?.user as any)?.email?.split("@")[0] || "ผู้ใช้";
    const masked = rawName.length > 4
      ? rawName.slice(0, 3) + "***" + rawName.slice(-2)
      : rawName + "***";

    // บันทึก bid
    await AuctionBid.create({ auctionId: id, userId, displayName: masked, amount });

    // Anti-snipe: ถ้า bid ใน 2 นาทีสุดท้าย ต่อเวลาอีก 2 นาที
    const TWO_MIN = 2 * 60 * 1000;
    const timeLeft = auction.endsAt.getTime() - Date.now();
    if (timeLeft > 0 && timeLeft < TWO_MIN) {
      auction.endsAt = new Date(Date.now() + TWO_MIN);
    }

    // อัปเดต auction
    auction.currentBid = amount;
    auction.totalBids += 1;
    auction.topBidder = masked;
    await auction.save();

    // Realtime notify ถ้ามี Socket.IO
    try {
      const io = (globalThis as any).__io;
      if (io) io.emit("auction:bid", {
        auctionId: id,
        amount,
        displayName: masked,
        totalBids: auction.totalBids,
        newEndsAt: auction.endsAt.toISOString(),
      });
    } catch {}

    const freshUser = await User.findById(userId).select("coins").lean();
    return NextResponse.json({ success: true, currentBid: amount, newEndsAt: auction.endsAt.toISOString(), coinsLeft: (freshUser as any)?.coins ?? 0 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
