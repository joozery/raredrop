import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import GemReward from "@/models/GemReward";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await req.json();
    const { name, description, image, type, boxId, boxOpenTimes, itemId, gemCost, stock, isActive } = body;

    await connectToDatabase();
    const updated = await GemReward.findByIdAndUpdate(id, {
      name, description, image, type,
      boxId: type === "box" ? boxId : undefined,
      boxOpenTimes: type === "box" ? (Number(boxOpenTimes) || 1) : undefined,
      itemId: type === "item" ? itemId : undefined,
      gemCost: Number(gemCost),
      stock: Number(stock) || 0,
      isActive,
    }, { new: true })
      .populate("boxId", "name image price")
      .populate("itemId", "name image type coinRewardAmount rarityId");

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
    const deleted = await GemReward.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
