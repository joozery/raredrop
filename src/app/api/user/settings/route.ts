import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();
  const user = await User.findById(userId).select("hideFromLeaderboard").lean();
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  console.log("[settings GET] userId:", userId, "hideFromLeaderboard:", (user as any).hideFromLeaderboard);
  const res = NextResponse.json({ hideFromLeaderboard: !!(user as any).hideFromLeaderboard });
  res.headers.set("Cache-Control", "no-store, max-age=0");
  return res;
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
    return NextResponse.json({ error: "ไม่มีข้อมูลที่จะอัปเดต", bodyReceived: body }, { status: 400 });
  }

  await connectToDatabase();
  
  // Use native MongoDB update to completely bypass Mongoose schema/plugins
  const mongoose = require("mongoose");
  try {
    const objectId = new mongoose.Types.ObjectId(userId);
    await mongoose.connection.collection("users").updateOne(
      { _id: objectId },
      { $set: update }
    );
    
    const updatedUser = await mongoose.connection.collection("users").findOne({ _id: objectId });
    if (!updatedUser) return NextResponse.json({ error: "User not found" }, { status: 404 });
    
    console.log("[settings PATCH] update payload:", update, "result:", updatedUser.hideFromLeaderboard);
    return NextResponse.json({ 
      success: true, 
      hideFromLeaderboard: !!updatedUser.hideFromLeaderboard,
      debugUpdate: update
    });
  } catch (err: any) {
    return NextResponse.json({ error: "DB Error", details: err.message }, { status: 500 });
  }
}
