import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Box from "@/models/Box";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import Item from "@/models/Item";
import Rarity from "@/models/Rarity";
import { validateBoxItems } from "@/lib/validateBoxItems";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const box = await Box.findById(id)
      .populate("categoryId", "name")
      .populate({
        path: "items.itemId",
        model: Item,
        populate: { path: "rarityId", model: Rarity, select: "name color" },
      });

    if (!box) {
      return NextResponse.json({ error: "Box not found" }, { status: 404 });
    }

    return NextResponse.json(box);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    if (body.categoryId === "") {
      body.categoryId = null;
    }

    const itemsError = validateBoxItems(body.items);
    if (itemsError) {
      return NextResponse.json({ error: itemsError }, { status: 400 });
    }

    await connectToDatabase();
    const updatedBox = await Box.findByIdAndUpdate(id, body, { new: true })
      .populate("categoryId", "name");

    if (!updatedBox) {
      return NextResponse.json({ error: "Box not found" }, { status: 404 });
    }

    return NextResponse.json(updatedBox);
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

    const deletedBox = await Box.findByIdAndDelete(id);
    if (!deletedBox) {
      return NextResponse.json({ error: "Box not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
