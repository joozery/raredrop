import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import HoneycombItem from "@/models/HoneycombItem";
import HoneycombBox from "@/models/HoneycombBox";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) return null;
  return session;
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    await connectToDatabase();
    const body = await req.json();
    const item = await HoneycombItem.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    );
    if (!item) return NextResponse.json({ error: "ไม่พบไอเทม" }, { status: 404 });
    return NextResponse.json(item);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id } = await params;
    await connectToDatabase();
    await HoneycombBox.updateMany(
      { "items.itemId": id },
      { $pull: { items: { itemId: id } } }
    );
    await HoneycombItem.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
