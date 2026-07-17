import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import TrueMoneyTopup from "@/models/TrueMoneyTopup";
import { creditTopup } from "@/lib/truemoney";

// แอดมินเคลียร์รายการเติมเงิน TrueMoney ที่ค้าง pending:
// approve = เทียบกับ statement ในแอปทรูแล้ว ยืนยันเข้าเครดิตให้ลูกค้า / expire = ปิดรายการ (ลูกค้าไม่ได้โอนจริง)
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    const adminId = (session?.user as any)?.id;
    if (!session || !["admin", "super_admin"].includes(role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { action } = await req.json();
    if (!["approve", "expire"].includes(action)) {
      return NextResponse.json({ error: "action ไม่ถูกต้อง" }, { status: 400 });
    }

    await connectToDatabase();
    const record = await TrueMoneyTopup.findById(id);
    if (!record) return NextResponse.json({ error: "ไม่พบรายการนี้" }, { status: 404 });
    if (record.status !== "pending") {
      return NextResponse.json({ error: "รายการนี้ถูกดำเนินการไปแล้ว" }, { status: 409 });
    }

    if (action === "approve") {
      const ok = await creditTopup(
        record,
        `manual:${adminId}:${Date.now()}`,
        "เติมเงินผ่าน TrueMoney Wallet (ยืนยันโดยแอดมิน)"
      );
      if (!ok) return NextResponse.json({ error: "รายการนี้ถูกดำเนินการไปแล้ว" }, { status: 409 });
      return NextResponse.json({ success: true, status: "completed" });
    }

    const updated = await TrueMoneyTopup.findOneAndUpdate(
      { _id: id, status: "pending" },
      { $set: { status: "expired" } },
      { new: true }
    );
    if (!updated) return NextResponse.json({ error: "รายการนี้ถูกดำเนินการไปแล้ว" }, { status: 409 });
    return NextResponse.json({ success: true, status: "expired" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
