import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Purchase from "@/models/Purchase";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    await connectToDatabase();

    const purchases = await Purchase.find()
      .populate({ path: "userId", model: User, select: "name avatar email" })
      .sort({ createdAt: -1 })
      .limit(300);

    const filtered = search
      ? purchases.filter((p: any) =>
          p.listingTitle?.toLowerCase().includes(search.toLowerCase()) ||
          (p.userId as any)?.name?.toLowerCase().includes(search.toLowerCase())
        )
      : purchases;

    return NextResponse.json(filtered);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
