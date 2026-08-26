import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import ShopListing from "@/models/ShopListing";
import { sendDiscordStockUpdateBroadcast } from "@/lib/discord";

function isAdmin(session: any) {
  return session && ["admin", "super_admin"].includes(session.user?.role);
}

// POST — add one account to listing
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { data, quantity, dataList } = await req.json();

    let newAccounts: { data: string; sold: boolean }[];
    if (Array.isArray(dataList) && dataList.length > 0) {
      // วางหลายบัญชีทีเดียว — 1 รายการ = 1 Account/สต็อก
      const cleaned = dataList.map((d: string) => String(d).trim()).filter(Boolean).slice(0, 500);
      if (cleaned.length === 0) return NextResponse.json({ error: "dataList is required" }, { status: 400 });
      newAccounts = cleaned.map((d: string) => ({ data: d, sold: false }));
    } else {
      if (!data?.trim()) return NextResponse.json({ error: "data is required" }, { status: 400 });
      const qty = Math.min(Math.max(1, Number(quantity) || 1), 500);
      newAccounts = Array.from({ length: qty }, () => ({ data: data.trim(), sold: false }));
    }

    await connectToDatabase();
    const listing = await ShopListing.findByIdAndUpdate(
      id,
      { $push: { accounts: { $each: newAccounts } } },
      { new: true }
    );
    if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (listing.status === "active") {
      const newStock = listing.accounts.filter((a) => !a.sold).length;
      await sendDiscordStockUpdateBroadcast({
        name: listing.title,
        newStock,
        addedQty: newAccounts.length,
        image: listing.images?.[0],
        productType: "shop",
      });
    }

    return NextResponse.json(listing);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE — remove account by accountId
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { accountId } = await req.json();

    await connectToDatabase();
    const listing = await ShopListing.findByIdAndUpdate(
      id,
      { $pull: { accounts: { _id: accountId } } },
      { new: true }
    );
    if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(listing);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
