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
    const { data } = await req.json();
    if (!data?.trim()) return NextResponse.json({ error: "data is required" }, { status: 400 });

    await connectToDatabase();
    const listing = await ShopListing.findByIdAndUpdate(
      id,
      { $push: { accounts: { data: data.trim(), sold: false } } },
      { new: true }
    );
    if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (listing.status === "active") {
      const newStock = listing.accounts.filter((a) => !a.sold).length;
      await sendDiscordStockUpdateBroadcast({
        name: listing.title,
        newStock,
        addedQty: 1,
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
