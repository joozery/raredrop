import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import HoneycombBox from "@/models/HoneycombBox";
import HoneycombItem from "@/models/HoneycombItem";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const box = await HoneycombBox.findById(id)
      .populate({ path: "items.itemId", model: HoneycombItem })
      .lean();

    if (!box) {
      return NextResponse.json({ error: "Honeycomb box not found" }, { status: 404 });
    }
    return NextResponse.json(box);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch box" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();
    const body = await req.json();

    const box = await HoneycombBox.findByIdAndUpdate(
      id,
      { $set: body },
      { new: true, runValidators: true }
    ).populate({ path: "items.itemId", model: HoneycombItem });

    if (!box) {
      return NextResponse.json({ error: "Honeycomb box not found" }, { status: 404 });
    }

    return NextResponse.json(box);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update box" }, { status: 500 });
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
    const box = await HoneycombBox.findByIdAndDelete(id);

    if (!box) {
      return NextResponse.json({ error: "Honeycomb box not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete box" }, { status: 500 });
  }
}
