import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Faq from "@/models/Faq";

export async function GET() {
  try {
    await connectToDatabase();
    const faqs = await Faq.find({ isActive: true }).sort({ category: 1, order: 1, createdAt: 1 }).lean();
    return NextResponse.json(faqs);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
