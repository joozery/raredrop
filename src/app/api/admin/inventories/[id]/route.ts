import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Inventory from "@/models/Inventory";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { status } = body;

    await connectToDatabase();
    
    // Only allow updating status for now
    const updatedInventory = await Inventory.findByIdAndUpdate(id, { status }, { new: true });
    
    if (!updatedInventory) {
      return NextResponse.json({ error: "Inventory record not found" }, { status: 404 });
    }

    return NextResponse.json(updatedInventory);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes(session.user?.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    await connectToDatabase();
    
    const deletedInventory = await Inventory.findByIdAndDelete(id);
    if (!deletedInventory) {
      return NextResponse.json({ error: "Inventory record not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
