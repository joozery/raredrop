import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import ShopListing from "@/models/ShopListing";

function isAdmin(session: any) {
  return session && ["admin", "super_admin"].includes(session.user?.role);
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { listings } = await req.json();
    if (!Array.isArray(listings) || listings.length === 0) {
      return NextResponse.json({ error: "ไม่มีข้อมูล listings" }, { status: 400 });
    }

    await connectToDatabase();

    const docs = listings.map((it: any) => {
      const stockCount = Math.max(0, Number(it.stockCount) || 0);
      const accounts = Array.from({ length: stockCount }, () => ({ data: "—", sold: false }));
      return {
      title: String(it.title || "").trim(),
      description: it.description || undefined,
      images: Array.isArray(it.images) ? it.images : (it.image ? [it.image] : []),
      price: Number(it.price) || 0,
      accounts,
      status: it.status || "active",
      liveChatEnabled: false,
      categoryId: it.categoryId || undefined,
      isFeatured: false,
      requireUid: false,
      uidLabel: "UID / ไอดีผู้เล่น",
    };});

    const created = await ShopListing.insertMany(docs, { ordered: false });

    return NextResponse.json({ created: created.length }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
