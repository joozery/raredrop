import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Faq from "@/models/Faq";
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
  const faqs = await Faq.find().sort({ category: 1, order: 1, createdAt: 1 });
  return NextResponse.json(faqs);
}

export async function POST(req: Request) {
  const err = await requireAdmin();
  if (err) return err;
  const { question, answer, category, order, isActive } = await req.json();
  if (!question?.trim() || !answer?.trim() || !category?.trim()) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
  }
  await connectToDatabase();
  const faq = await Faq.create({ question: question.trim(), answer: answer.trim(), category: category.trim(), order: order ?? 0, isActive: isActive ?? true });
  return NextResponse.json(faq, { status: 201 });
}
