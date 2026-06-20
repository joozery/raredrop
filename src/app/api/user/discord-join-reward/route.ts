import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";
import Setting from "@/models/Setting";
import { notify } from "@/lib/notify";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();

    const setting = await Setting.findOne({ key: "discord_join_reward_gemcoin" }).lean();
    const reward = typeof setting?.value === "number" ? setting.value : 0;

    if (reward <= 0) {
      return NextResponse.json({ claimed: false });
    }

    const updated = await User.findOneAndUpdate(
      { _id: userId, discordJoinClaimed: { $ne: true } },
      { $set: { discordJoinClaimed: true }, $inc: { gemCoins: reward } },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ claimed: false });
    }

    await notify(
      userId,
      `ได้รับ +${reward} GemCoin!`,
      "จากการกดลิงก์เข้า Discord ครั้งแรก",
      "success",
      "/exchange"
    );

    return NextResponse.json({ claimed: true, gemCoinsEarned: reward, gemCoinsTotal: updated.gemCoins });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
