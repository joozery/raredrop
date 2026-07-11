import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import ShopListing from "@/models/ShopListing";
import Purchase from "@/models/Purchase";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import RecentActivity from "@/models/RecentActivity";
import { emitRecentActivity } from "@/lib/realtime";

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
    const quantity: number = Math.max(1, Math.floor(Number(body?.quantity) || 1));

    await connectToDatabase();

    const listing = await ShopListing.findById(id);
    if (!listing || listing.status !== "active") {
      return NextResponse.json({ error: "ไม่พบสินค้า" }, { status: 404 });
    }

    if (listing.requireUid && !buyerUid) {
      return NextResponse.json({ error: `กรุณากรอก ${listing.uidLabel || "UID"} ก่อนซื้อ` }, { status: 400 });
    }

    const availableAccounts = listing.accounts.filter((a: any) => !a.sold).slice(0, quantity);
    if (availableAccounts.length === 0) {
      return NextResponse.json({ error: "สินค้าหมดแล้ว" }, { status: 400 });
    }
    if (availableAccounts.length < quantity) {
      return NextResponse.json({ error: `สินค้าเหลือเพียง ${availableAccounts.length} ชิ้น` }, { status: 400 });
    }

    const totalPrice = listing.price * availableAccounts.length;

    const buyer = await User.findById(buyerId);
    if (!buyer || buyer.coins < totalPrice) {
      return NextResponse.json({ error: "เหรียญไม่เพียงพอ" }, { status: 400 });
    }

    // mark accounts as sold
    const now = new Date();
    for (const account of availableAccounts) {
      account.sold = true;
      account.soldTo = buyerId;
      account.soldAt = now;
    }
    await listing.save();

    // deduct coins
    const updatedBuyer = await User.findByIdAndUpdate(
      buyerId,
      { $inc: { coins: -totalPrice } },
      { new: true }
    );

    // save purchase records (one per item)
    const purchases = await Purchase.insertMany(
      availableAccounts.map((account: any) => ({
        userId: buyerId,
        shopListingId: listing._id,
        listingTitle: listing.title,
        listingImage: listing.images?.[0] || "",
        pricePaid: listing.price,
        deliveredData: account.data,
        ...(buyerUid && { buyerUid }),
      }))
    );

    // save transaction (one combined)
    await Transaction.create({
      userId: buyerId,
      type: "shop_buy",
      amount: -totalPrice,
      balanceAfter: updatedBuyer!.coins,
      description: availableAccounts.length > 1
        ? `ซื้อ "${listing.title}" x${availableAccounts.length} จากร้านค้า`
        : `ซื้อ "${listing.title}" จากร้านค้า`,
      referenceId: purchases[0]._id,
    });

    // realtime feed entry (one representative row per purchase action)
    const activity = await RecentActivity.create({
      userId: buyerId,
      userName: updatedBuyer!.name || "ผู้ใช้",
      userAvatar: updatedBuyer!.avatar,
      title: listing.title,
      image: listing.images?.[0] || "",
      price: listing.price,
      kind: "shop",
    });
    emitRecentActivity({
      _id: String(activity._id),
      userName: activity.userName,
      userAvatar: activity.userAvatar,
      title: activity.title,
      image: activity.image,
      price: activity.price,
      kind: "shop",
      createdAt: activity.createdAt.toISOString(),
    });

    return NextResponse.json({
      success: true,
      coinsLeft: updatedBuyer!.coins,
      purchaseId: purchases[0]._id,
      purchaseIds: purchases.map((p: any) => String(p._id)),
      quantity: availableAccounts.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
