import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import ShopListing from "@/models/ShopListing";

function isAdmin(session: any) {
  return session && ["admin", "super_admin"].includes(session.user?.role);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { title, description, images, price, status, liveChatEnabled, youtubeUrl, categoryId, isFeatured, requireUid, uidLabel, installmentEnabled, installmentMonthlyDisabled } = body;

    const update: any = { title, description, images, price: Number(price), status };
    // อัปเดตเฉพาะเมื่อส่งมา (toggleStatus ไม่ได้ส่ง → คงค่าเดิม)
    if (liveChatEnabled !== undefined) update.liveChatEnabled = !!liveChatEnabled;
    if (youtubeUrl !== undefined) update.youtubeUrl = youtubeUrl || "";
    if (categoryId !== undefined) update.categoryId = categoryId || null;
    if (isFeatured !== undefined) update.isFeatured = !!isFeatured;
    if (requireUid !== undefined) update.requireUid = !!requireUid;
    if (uidLabel !== undefined) update.uidLabel = uidLabel || "UID / ไอดีผู้เล่น";
    if (installmentEnabled !== undefined) update.installmentEnabled = !!installmentEnabled;
    if (installmentMonthlyDisabled !== undefined) update.installmentMonthlyDisabled = !!installmentMonthlyDisabled;

    await connectToDatabase();
    const listing = await ShopListing.findByIdAndUpdate(
      id,
      update,
      { new: true, runValidators: true }
    );

    if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(listing);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectToDatabase();
    await ShopListing.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
