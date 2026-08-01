import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Auction from "@/models/Auction";
import AuctionBid from "@/models/AuctionBid";

// GET /api/auction/[id] — public detail + bid history
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const auction = await Auction.findById(id).lean();
    if (!auction) return NextResponse.json({ error: "ไม่พบรายการประมูล" }, { status: 404 });

    const bids = await AuctionBid.find({ auctionId: id })
      .sort({ amount: -1, createdAt: 1 })
      .select("displayName amount createdAt")
      .lean();

    return NextResponse.json({ auction, bids });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
