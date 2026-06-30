import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";
import LevelConfig from "@/models/LevelConfig";
import "@/models/Item";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const [user, levels] = await Promise.all([
      User.findById(userId).select("xp vipLevel").lean(),
      LevelConfig.find()
        .sort({ xpRequired: 1 })
        .populate({ path: "rewardItems.itemId", select: "name image" })
        .lean(),
    ]);

    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const xp = (user as any).xp || 0;
    const currentLevel = (user as any).vipLevel || 1;

    return NextResponse.json({ xp, currentLevel, levels });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
