import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import ShopListing from "@/models/ShopListing";
import { sendDiscordNewProductBroadcast } from "@/lib/discord";

function isAdmin(session: any) {
  return session && ["admin", "super_admin"].includes(session.user?.role);
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const listings = await ShopListing.find().sort({ order: 1, createdAt: -1 });
    return NextResponse.json(listings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, description, images, price, status, liveChatEnabled, youtubeUrl } = body;

    if (!title || price === undefined) {
      return NextResponse.json({ error: "title and price are required" }, { status: 400 });
    }

    await connectToDatabase();
    const listing = await ShopListing.create({
      title,
      description,
      images: images || [],
      price: Number(price),
      accounts: [],
      status: status || "active",
      liveChatEnabled: !!liveChatEnabled,
      youtubeUrl: youtubeUrl || undefined,
    });

    if (listing.status === "active") {
      await sendDiscordNewProductBroadcast({
        name: listing.title,
        price: listing.price,
        image: listing.images?.[0],
        productType: "shop",
        stock: listing.accounts.length,
      });
    }

    return NextResponse.json(listing, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
