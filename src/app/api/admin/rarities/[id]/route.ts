import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Rarity from "@/models/Rarity";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    await connectToDatabase();
    const updatedRarity = await Rarity.findByIdAndUpdate(id, body, { new: true });

    if (!updatedRarity) {
      return NextResponse.json({ error: "Rarity not found" }, { status: 404 });
    }

    return NextResponse.json(updatedRarity);
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

    const deletedRarity = await Rarity.findByIdAndDelete(id);
    if (!deletedRarity) {
      return NextResponse.json({ error: "Rarity not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
