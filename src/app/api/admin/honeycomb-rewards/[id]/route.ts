import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import HoneycombReward from "@/models/HoneycombReward";
import ShopListing from "@/models/ShopListing";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await req.json();
    const { name, description, image, type, boxId, boxOpenTimes, itemId, shopListingId, honeyCost, stock, isActive } = body;

    await connectToDatabase();
    const updated = await HoneycombReward.findByIdAndUpdate(id, {
      name, description, image, type,
      boxId: type === "box" ? boxId : undefined,
      boxOpenTimes: type === "box" ? (Number(boxOpenTimes) || 1) : undefined,
      itemId: type === "item" ? itemId : undefined,
      shopListingId: type === "shop" ? shopListingId : undefined,
      honeyCost: Number(honeyCost),
      stock: Number(stock) || 0,
      isActive,
    }, { new: true })
      .populate("boxId", "name image price")
      .populate("itemId", "name image type coinRewardAmount rarityId")
      .populate({ path: "shopListingId", model: ShopListing, select: "title images price accounts" });

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    await connectToDatabase();
    const deleted = await HoneycombReward.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
