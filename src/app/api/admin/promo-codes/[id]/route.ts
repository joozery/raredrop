import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import PromoCode from "@/models/PromoCode";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await req.json();
    const { code, description, rewardType, rewardAmount, itemId, boxId, boxOpenTimes, maxUses, expiresAt, isActive } = body;

    await connectToDatabase();

    let updated;
    try {
      updated = await PromoCode.findByIdAndUpdate(
        id,
        {
          code: code ? String(code).trim().toUpperCase() : undefined,
          description,
          rewardType,
          rewardAmount: ["coins", "gemCoins"].includes(rewardType) ? Number(rewardAmount) : undefined,
          itemId: rewardType === "item" ? itemId : undefined,
          boxId: rewardType === "box" ? boxId : undefined,
          boxOpenTimes: rewardType === "box" ? Number(boxOpenTimes) || 1 : undefined,
          maxUses: Number(maxUses) || 0,
          expiresAt: expiresAt || null,
          isActive,
        },
        { new: true }
      )
        .populate("boxId", "name image price")
        .populate("itemId", "name image type coinRewardAmount rarityId");
    } catch (err: any) {
      if (err?.code === 11000) return NextResponse.json({ error: "โค้ดนี้มีอยู่แล้ว" }, { status: 400 });
      throw err;
    }

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
    const deleted = await PromoCode.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
