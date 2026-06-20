import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import RedEnvelopeItem from "@/models/RedEnvelopeItem";
import RedEnvelopeRound from "@/models/RedEnvelopeRound";

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
    const { name, image, description } = body;

    const update: any = {};
    if (name !== undefined) update.name = name;
    if (image !== undefined) update.image = image || "";
    if (description !== undefined) update.description = description || "";

    await connectToDatabase();
    const item = await RedEnvelopeItem.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(item);
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

    const inUse = await RedEnvelopeRound.exists({ itemId: id });
    if (inUse) {
      return NextResponse.json({ error: "ลบไม่ได้ มีรอบซองแดงใช้ไอเทมนี้อยู่" }, { status: 400 });
    }

    await RedEnvelopeItem.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
