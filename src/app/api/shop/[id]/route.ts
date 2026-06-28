import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import ShopListing from "@/models/ShopListing";
import Purchase from "@/models/Purchase";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

// POST /api/shop/[id] — buy listing
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const buyerId = (session?.user as any)?.id;
    if (!buyerId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const buyerUid: string = typeof body?.buyerUid === "string" ? body.buyerUid.trim() : "";

    await connectToDatabase();

    const listing = await ShopListing.findById(id);
    if (!listing || listing.status !== "active") {
      return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 });
    }

    if (listing.requireUid && !buyerUid) {
      return NextResponse.json({ error: `กรุณากรอก ${listing.uidLabel || "UID"} ก่อนซื้อ` }, { status: 400 });
    }

    const availableAccount = listing.accounts.find((a: any) => !a.sold);
    if (!availableAccount) {
      return NextResponse.json({ error: "สินค้าหมดแล้ว" }, { status: 400 });
    }

    const buyer = await User.findById(buyerId);
    if (!buyer || buyer.coins < listing.price) {
      return NextResponse.json({ error: "เหรียญไม่เพียงพอ" }, { status: 400 });
    }

    // mark account as sold
    availableAccount.sold = true;
    availableAccount.soldTo = buyerId;
    availableAccount.soldAt = new Date();
    await listing.save();

    // deduct coins
    const updatedBuyer = await User.findByIdAndUpdate(
      buyerId,
      { $inc: { coins: -listing.price } },
      { new: true }
    );

    // save purchase record
    const purchase = await Purchase.create({
      userId: buyerId,
      shopListingId: listing._id,
      listingTitle: listing.title,
      listingImage: listing.images?.[0] || "",
      pricePaid: listing.price,
      deliveredData: availableAccount.data,
      ...(buyerUid && { buyerUid }),
    });

    // save transaction
    await Transaction.create({
      userId: buyerId,
      type: "shop_buy",
      amount: -listing.price,
      balanceAfter: updatedBuyer!.coins,
      description: `ซื้อ "${listing.title}" จากร้านค้า`,
      referenceId: purchase._id,
    });

    return NextResponse.json({
      success: true,
      coinsLeft: updatedBuyer!.coins,
      purchaseId: purchase._id,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
