import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Banner from "@/models/Banner";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

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
    const { image, link, page, order, isActive } = body;

    const update: any = {};
    if (image !== undefined) update.image = image;
    if (link !== undefined) update.link = link || "";
    if (page !== undefined) update.page = page;
    if (order !== undefined) update.order = Number(order) || 0;
    if (isActive !== undefined) update.isActive = !!isActive;

    await connectToDatabase();
    const banner = await Banner.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!banner) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(banner);
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
    await Banner.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
