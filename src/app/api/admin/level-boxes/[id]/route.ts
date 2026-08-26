import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import LevelBoxReward from "@/models/LevelBoxReward";
import "@/models/Box";

function isAdmin(session: any) {
  return session && ["admin", "super_admin"].includes(session.user?.role);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { minLevel, boxId, isActive } = await req.json();

    await connectToDatabase();
    if (minLevel !== undefined) {
      const dup = await LevelBoxReward.findOne({ minLevel: Number(minLevel), _id: { $ne: id } });
      if (dup) return NextResponse.json({ error: `มีการตั้งค่าเลเวล ${minLevel} อยู่แล้ว` }, { status: 400 });
    }

    const update: any = {};
    if (minLevel !== undefined) update.minLevel = Number(minLevel);
    if (boxId !== undefined) update.boxId = boxId;
    if (isActive !== undefined) update.isActive = isActive;

    const reward = await LevelBoxReward.findByIdAndUpdate(id, update, { new: true })
      .populate("boxId", "name image price isActive");
    if (!reward) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(reward);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectToDatabase();
    const reward = await LevelBoxReward.findByIdAndDelete(id);
    if (!reward) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
