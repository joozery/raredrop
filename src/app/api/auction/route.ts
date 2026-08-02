import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Auction from "@/models/Auction";

// GET /api/auction — public list
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tab  = searchParams.get("tab")  || "all";
    const sort = searchParams.get("sort") || "ending_soon";
    const tag  = searchParams.get("tag")  || "";

    await connectToDatabase();

    const now = new Date();
    let query: any = {};

    if (tab === "active")      query = { status: "active", endsAt: { $gt: now }, totalBids: { $gt: 0 } };
    else if (tab === "ending_soon") query = { status: "active", endsAt: { $gt: now, $lte: new Date(now.getTime() + 3 * 3600_000) } };
    else if (tab === "ended")  query = { $or: [{ status: "ended" }, { status: "active", endsAt: { $lte: now } }] };
    else                       query = {}; // all

    if (tag && tag !== "all") query.tag = { $regex: new RegExp(`^${tag}$`, "i") };

    const sortObj: Record<string, 1 | -1> =
      sort === "highest_bid" ? { currentBid: -1 } :
      sort === "most_bids"   ? { totalBids: -1 }  :
                               { endsAt: 1 };

    const auctions = await Auction.find(query).sort(sortObj).lean();
    return NextResponse.json(auctions, { headers: { "x-server-time": Date.now().toString() } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
