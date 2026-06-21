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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const err = await requireAdmin();
  if (err) return err;
  const { id } = await params;
  const body = await req.json();
  await connectToDatabase();
  const topic = await KnowledgeTopic.findByIdAndUpdate(id, body, { new: true });
  if (!topic) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(topic);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const err = await requireAdmin();
  if (err) return err;
  const { id } = await params;
  await connectToDatabase();
  await KnowledgeTopic.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
