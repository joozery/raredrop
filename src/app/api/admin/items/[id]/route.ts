import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Item from "@/models/Item";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { sendDiscordStockUpdateBroadcast } from "@/lib/discord";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    if (body.categoryId === "") {
      body.categoryId = null;
    }

    // ราคาขายคืน — ค่าว่างหมายถึงใช้ price (มูลค่าไอเทม) แทน
    if (body.sellPrice === "" || body.sellPrice === undefined || body.sellPrice === null) {
      body.sellPrice = null;
    } else {
      body.sellPrice = Number(body.sellPrice);
    }

    await connectToDatabase();
    const existingItem = await Item.findById(id).select("stock type isActive");
    const updatedItem = await Item.findByIdAndUpdate(id, body, { new: true })
      .populate("categoryId", "name")
      .populate("rarityId", "name color");

    if (!updatedItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // แจ้ง broadcast เมื่อสต็อกเพิ่มขึ้นจากเดิม (restock) — ข้าม coin_reward และไอเทมที่ปิดใช้งาน
    const oldStock = existingItem?.stock ?? 0;
    const addedQty = updatedItem.stock - oldStock;
    if (
      existingItem &&
      existingItem.type !== "coin_reward" &&
      updatedItem.isActive &&
      !updatedItem.unlimitedStock &&
      addedQty > 0
    ) {
      await sendDiscordStockUpdateBroadcast({
        name: updatedItem.name,
        newStock: updatedItem.stock,
        addedQty,
        image: updatedItem.image,
        productType: "item",
      });
    }

    return NextResponse.json(updatedItem);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const deletedItem = await Item.findByIdAndDelete(id);
    if (!deletedItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
