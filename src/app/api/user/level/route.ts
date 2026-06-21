import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";
import LevelConfig from "@/models/LevelConfig";
import "@/models/Item";
import "@/models/Rarity";

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
        .populate({ path: "rewardItems.itemId", select: "name image", populate: { path: "rarityId", select: "name color" } })
        .lean(),
    ]);

    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const xp = (user as any).xp || 0;
    const currentLevel = (user as any).vipLevel || 1;

    // Find current and next level config
    const sortedLevels = levels as any[];
    const currentConfig = sortedLevels.filter((l) => l.xpRequired <= xp).pop() ?? null;
    const nextConfig = sortedLevels.find((l) => l.xpRequired > xp) ?? null;

    const currentLevelXp = currentConfig?.xpRequired ?? 0;
    const nextLevelXp = nextConfig?.xpRequired ?? null;
    const progress = nextLevelXp != null
      ? Math.min(1, (xp - currentLevelXp) / (nextLevelXp - currentLevelXp))
      : 1;

    return NextResponse.json({
      xp,
      level: currentLevel,
      currentLevelXp,
      nextLevelXp,
      nextLevel: nextConfig?.level ?? null,
      nextRewards: nextConfig?.rewardItems ?? [],
      progress,
      xpToNext: nextLevelXp != null ? nextLevelXp - xp : 0,
      logoImage: currentConfig?.logoImage ?? null,
      tagImage: currentConfig?.tagImage ?? null,
      colorTheme: currentConfig?.colorTheme ?? "gray",
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
