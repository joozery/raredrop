import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Box from "@/models/Box";
import Category from "@/models/Category";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');

    await connectToDatabase();
    
    let query: any = {};
    if (categoryId) query.categoryId = categoryId;

    const boxes = await Box.find(query)
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json(boxes);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, image, titleImage, price, categoryId, isFeatured, isActive, items, animation } = body;

    if (!name || !image || price === undefined) {
      return NextResponse.json({ error: "Name, image, and price are required" }, { status: 400 });
    }

    await connectToDatabase();
    const newBox = await Box.create({
      name,
      description,
      image,
      titleImage,
      animation,
      categoryId: categoryId || undefined,
      price: Number(price),
      isFeatured: isFeatured !== undefined ? isFeatured : false,
      isActive: isActive !== undefined ? isActive : true,
      items: items || [],
    });

    const populatedBox = await Box.findById(newBox._id).populate('categoryId', 'name');

    return NextResponse.json(populatedBox, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
