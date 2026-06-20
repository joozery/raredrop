import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Banner from "@/models/Banner";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

function isAdmin(session: any) {
  return session && ["admin", "super_admin"].includes(session.user?.role);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const banners = await Banner.find().sort({ order: 1, createdAt: -1 });
    return NextResponse.json(banners);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { image, link, page, order, isActive } = body;

    if (!image) {
      return NextResponse.json({ error: "กรุณาอัปโหลดรูปแบนเนอร์" }, { status: 400 });
    }

    await connectToDatabase();
    const banner = await Banner.create({
      image,
      link: link || undefined,
      page: page || "shop",
      order: Number(order) || 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    return NextResponse.json(banner, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
