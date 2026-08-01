import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import Auction from "@/models/Auction";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) return null;
  return session;
}

// GET /api/admin/auction
export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectToDatabase();
  const auctions = await Auction.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(auctions);
}

// POST /api/admin/auction — สร้างการประมูลใหม่
export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, gameImage, accountLevel, description, highlights, tag, tagColor, server, startBid, minBidStep, endsAt, isHot, verified } = body;

  if (!title || !gameImage || !startBid || !endsAt) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ (ชื่อ, รูป, ราคาเริ่มต้น, เวลาสิ้นสุด)" }, { status: 400 });
  }

  await connectToDatabase();
  const auction = await Auction.create({
    title, gameImage,
    accountLevel: accountLevel || 1,
    description: description || "",
    highlights: highlights || [],
    tag: tag || "",
    tagColor: tagColor || "#6b7280",
    server: server || "TH",
    startBid,
    currentBid: startBid,
    minBidStep: minBidStep || 100,
    endsAt: new Date(endsAt),
    status: "active",
    isHot: isHot || false,
    verified: verified !== false,
    totalBids: 0,
  });

  return NextResponse.json(auction, { status: 201 });
}
