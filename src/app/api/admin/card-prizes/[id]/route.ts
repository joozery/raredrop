import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import CardPrize from "@/models/CardPrize";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) return null;
  return session;
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const body = await req.json();
    await connectToDatabase();
    const updated = await CardPrize.findByIdAndUpdate(
      id,
      {
        $set: {
          name: body.name,
          title: body.title,
          icon: body.icon || "",
          type: ["coin", "gemcoin", "item", "custom"].includes(body.type) ? body.type : "custom",
          amount: Number(body.amount) || 0,
          itemId: body.type === "item" && body.itemId ? body.itemId : null,
          weight: Number(body.weight) || 1,
          isSpecial: !!body.isSpecial,
          isActive: body.isActive !== false,
          order: Number(body.order) || 0,
        },
      },
      { new: true }
    );
    if (!updated) return NextResponse.json({ error: "ไม่พบรางวัลนี้" }, { status: 404 });
    // รางวัลพิเศษมีได้ตัวเดียว — ตั้งตัวนี้แล้วปลดตัวอื่นออกอัตโนมัติ
    if (updated.isSpecial) {
      await CardPrize.updateMany({ _id: { $ne: updated._id } }, { $set: { isSpecial: false } });
    }
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    await connectToDatabase();
    const deleted = await CardPrize.findByIdAndDelete(id);
    if (!deleted) return NextResponse.json({ error: "ไม่พบรางวัลนี้" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
