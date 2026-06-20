import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

import LevelConfig from "@/models/LevelConfig";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    // Fetch level configs to map tagImage
    const levelConfigs = await LevelConfig.find({}, "level tagImage").lean();
    const tagImageMap = new Map(levelConfigs.map((c: any) => [c.level, c.tagImage]));

    // Fetch all users with role 'user'
    const users = await User.find({ role: "user" }).sort({ createdAt: -1 }).lean();
    
    const mappedUsers = users.map((u: any) => ({
      ...u,
      tagImage: u.vipLevel ? tagImageMap.get(u.vipLevel) : undefined
    }));

    return NextResponse.json(mappedUsers);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, password, coins } = body;

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    await connectToDatabase();
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    // In a real app, hash password here. We use plain for demo if needed, but it's mock.
    const newUser = await User.create({
      name,
      email,
      password, // Should hash!
      role: "user",
      coins: Number(coins) || 0
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
