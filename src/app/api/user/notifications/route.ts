import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import Notification from "@/models/Notification";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();
  const notifications = await Notification.find({ userId })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  return NextResponse.json(notifications);
}

// Mark all as read
export async function PATCH() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDatabase();
  await Notification.updateMany({ userId, isRead: false }, { isRead: true });
  return NextResponse.json({ success: true });
}
