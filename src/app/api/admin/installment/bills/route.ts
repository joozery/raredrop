import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import InstallmentBill from "@/models/InstallmentBill";
import { sendDiscordInstallmentNotification } from "@/lib/discord";

function requireAdmin(session: any) {
  if (!session || !["admin", "super_admin"].includes(session.user?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

// GET /api/admin/installment/bills?q=...&status=...&page=1
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const err = requireAdmin(session);
  if (err) return err;

  const { searchParams } = new URL(req.url);
  const q      = searchParams.get("q")?.trim() ?? "";
  const status = searchParams.get("status") ?? "";
  const page   = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit  = 30;

  await connectToDatabase();

  const filter: Record<string, any> = {};
  if (q) {
    filter.$or = [
      { billId:      { $regex: q, $options: "i" } },
      { productCode: { $regex: q, $options: "i" } },
    ];
  }
  if (status) filter.status = status;

  const [bills, total] = await Promise.all([
    InstallmentBill.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    InstallmentBill.countDocuments(filter),
  ]);

  return NextResponse.json({ bills, total, page, pages: Math.ceil(total / limit) });
}

// PATCH /api/admin/installment/bills
// action "update_status" : { billId, status }
// action "pay_installment": { billId, installmentNo, slipUrl? }
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const err = requireAdmin(session);
  if (err) return err;

  const body = await req.json();
  const { action = "update_status" } = body;

  await connectToDatabase();

  // ── เปลี่ยนสถานะบิล ──
  if (action === "update_status") {
    const { billId, status } = body;
    if (!billId || !status) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
    }
    const updated = await InstallmentBill.findOneAndUpdate(
      { billId },
      { status },
      { new: true },
    ).lean();
    if (!updated) return NextResponse.json({ error: "ไม่พบบิล" }, { status: 404 });
    return NextResponse.json({ ok: true, bill: updated });
  }

  // ── ยืนยันการชำระงวด ──
  if (action === "pay_installment") {
    const { billId, installmentNo, slipUrl } = body;
    if (!billId || !installmentNo) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบ" }, { status: 400 });
    }

    const adminName = session!.user?.name ?? "admin";
    const paidAt    = new Date().toLocaleString("th-TH");

    // อัปเดต installment ที่ตรงกับ installmentNo
    const bill = await InstallmentBill.findOne({ billId });
    if (!bill) return NextResponse.json({ error: "ไม่พบบิล" }, { status: 404 });

    const inst = bill.installments.find((i: any) => i.installmentNo === installmentNo);
    if (!inst) return NextResponse.json({ error: "ไม่พบงวดนี้" }, { status: 404 });

    inst.status      = "paid";
    inst.paidAt      = paidAt;
    inst.confirmedBy = adminName;
    if (slipUrl) inst.slipUrl = slipUrl;

    // ถ้าจ่ายครบทุกงวด → อัปเดตสถานะบิลเป็น completed
    const allPaid = bill.installments.every((i: any) => i.status === "paid");
    if (allPaid) bill.status = "completed";
    else if (bill.status === "pending") bill.status = "active";

    await bill.save();
    return NextResponse.json({ ok: true, bill: bill.toObject() });
  }

  return NextResponse.json({ error: "action ไม่ถูกต้อง" }, { status: 400 });
}
