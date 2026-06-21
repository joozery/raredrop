import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import KnowledgeTopic from "@/models/KnowledgeTopic";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const err = await requireAdmin();
  if (err) return err;
  await connectToDatabase();
  const topics = await KnowledgeTopic.find().sort({ order: 1, createdAt: 1 });
  return NextResponse.json(topics);
}

export async function POST(req: Request) {
  const err = await requireAdmin();
  if (err) return err;
  const { title, youtubeUrl, order } = await req.json();
  if (!title?.trim() || !youtubeUrl?.trim()) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
  }
  await connectToDatabase();
  const topic = await KnowledgeTopic.create({ title: title.trim(), youtubeUrl: youtubeUrl.trim(), order: order ?? 0 });
  return NextResponse.json(topic, { status: 201 });
}
