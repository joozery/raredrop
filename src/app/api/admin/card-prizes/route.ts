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

export async function GET() {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectToDatabase();
    const prizes = await CardPrize.find().sort({ order: 1, createdAt: 1 }).lean();
    return NextResponse.json(prizes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json();
    if (!body.name || !body.title) {
      return NextResponse.json({ error: "กรุณากรอกชื่อรางวัลและประเภทให้ครบ" }, { status: 400 });
    }
    await connectToDatabase();
    const prize = await CardPrize.create({
      name: body.name,
      title: body.title,
      icon: body.icon || "",
      type: ["coin", "gemcoin", "item", "custom"].includes(body.type) ? body.type : "custom",
      amount: Number(body.amount) || 0,
      itemId: body.type === "item" && body.itemId ? body.itemId : undefined,
      weight: Number(body.weight) || 1,
      isSpecial: !!body.isSpecial,
      isActive: body.isActive !== false,
      order: Number(body.order) || 0,
    });
    // รางวัลพิเศษมีได้ตัวเดียว — ตั้งตัวใหม่แล้วปลดตัวเดิมออกอัตโนมัติ
    if (prize.isSpecial) {
      await CardPrize.updateMany({ _id: { $ne: prize._id } }, { $set: { isSpecial: false } });
    }
    return NextResponse.json(prize);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
