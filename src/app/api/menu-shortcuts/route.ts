import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import MenuShortcut from "@/models/MenuShortcut";

export async function GET() {
  try {
    await connectToDatabase();
    const shortcuts = await MenuShortcut.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
    return NextResponse.json(shortcuts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
