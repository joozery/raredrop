import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();
  const user = await User.findById(userId).select("hideFromLeaderboard").lean();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ hideFromLeaderboard: !!(user as any).hideFromLeaderboard });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const allowed = ["hideFromLeaderboard"] as const;
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body && typeof body[key] === "boolean") update[key] = body[key];
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "ไม่มีข้อมูลที่จะอัปเดต" }, { status: 400 });
  }

  await connectToDatabase();
  await User.findByIdAndUpdate(userId, { $set: update });
  return NextResponse.json({ success: true, ...update });
}
