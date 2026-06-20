import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import RedEnvelopeItem from "@/models/RedEnvelopeItem";

function isAdmin(session: any) {
  return session && ["admin", "super_admin"].includes(session.user?.role);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const items = await RedEnvelopeItem.find().sort({ createdAt: -1 });
    return NextResponse.json(items);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, image, description } = body;
    if (!name) return NextResponse.json({ error: "กรุณากรอกชื่อไอเทม" }, { status: 400 });

    await connectToDatabase();
    const item = await RedEnvelopeItem.create({ name, image: image || undefined, description: description || undefined });
    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
