import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import KnowledgeTopic from "@/models/KnowledgeTopic";

export async function GET() {
  try {
    await connectToDatabase();
    const topics = await KnowledgeTopic.find().sort({ order: 1, createdAt: 1 }).lean();
    return NextResponse.json(topics);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
