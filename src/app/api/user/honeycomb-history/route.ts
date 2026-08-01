import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import HoneycombHistory from "@/models/HoneycombHistory";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: "ต้องเข้าสู่ระบบก่อน" }, { status: 401 });

    await connectToDatabase();

    const history = await HoneycombHistory.find({ userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json(history);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
