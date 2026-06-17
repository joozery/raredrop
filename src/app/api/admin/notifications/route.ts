import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import Notification from "@/models/Notification";
import User from "@/models/User";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

// POST — send notification to one user or broadcast to all
export async function POST(req: Request) {
  const err = await requireAdmin();
  if (err) return err;

  const { userId, title, message, type, link, broadcast } = await req.json();
  if (!title?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "กรุณากรอกหัวข้อและข้อความ" }, { status: 400 });
  }

  await connectToDatabase();

  if (broadcast) {
    const users = await User.find({}, "_id").lean();
    const docs = users.map((u: any) => ({ userId: u._id, title: title.trim(), message: message.trim(), type: type || "info", link: link || undefined }));
    await Notification.insertMany(docs);
    return NextResponse.json({ success: true, sent: docs.length });
  }

  if (!userId) return NextResponse.json({ error: "กรุณาระบุ userId หรือ broadcast" }, { status: 400 });
  const notif = await Notification.create({ userId, title: title.trim(), message: message.trim(), type: type || "info", link: link || undefined });
  return NextResponse.json(notif, { status: 201 });
}
