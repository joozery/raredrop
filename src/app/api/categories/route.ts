import { NextResponse, NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Category from "@/models/Category";

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const type = req.nextUrl.searchParams.get("type") || "box";

    // ของเก่าที่ไม่มี type field ให้ถือเป็น "box"
    const baseFilter: any = { isActive: { $ne: false } };
    if (type === "box") {
      baseFilter.$or = [{ type: "box" }, { type: { $exists: false } }];
    } else {
      baseFilter.type = type;
    }

    const categories = await Category.find(baseFilter)
      .select("name slug image order")
      .sort({ order: 1, createdAt: -1 });

    // category เก่าที่ยังไม่มี slug ให้ auto-generate จากชื่อ
    const result = categories.map((c) => ({
      ...c.toObject(),
      slug: c.slug || toSlug(c.name),
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
