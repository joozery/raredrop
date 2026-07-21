import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import Item from "@/models/Item";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) return null;
  return session;
}

export async function POST(req: Request) {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { items } = await req.json();
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "ไม่มีข้อมูล items" }, { status: 400 });
    }

    await connectToDatabase();

    const docs = items.map((it: any) => ({
      name: String(it.name || "").trim(),
      image: String(it.image || ""),
      rarityId: it.rarityId,
      categoryId: it.categoryId || undefined,
      price: Number(it.price) || 0,
      sellPrice: it.sellPrice != null && it.sellPrice !== "" ? Number(it.sellPrice) : undefined,
      stock: Number(it.stock) || 0,
      unlimitedStock: !!it.unlimitedStock,
      isActive: true,
      type: "item",
      coinRewardAmount: 0,
      contactChannels: { discord: true, livechat: true },
    }));

    const created = await Item.insertMany(docs, { ordered: false });

    return NextResponse.json({ created: created.length }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
