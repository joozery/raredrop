import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import TrueMoneyTopup from "@/models/TrueMoneyTopup";
import { matchLastReceive } from "@/lib/truemoney";

const NOT_FOUND_MESSAGE = "ยังไม่พบรายการโอนของคุณ ตรวจสอบว่าโอนเงินแล้วและลองใหม่อีกครั้ง";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนทำรายการ" }, { status: 401 });

    const { requestId } = await req.json();
    if (!requestId) return NextResponse.json({ error: "ไม่พบรายการที่ต้องการตรวจสอบ" }, { status: 400 });

    await connectToDatabase();

    const record = await TrueMoneyTopup.findOne({ _id: requestId, userId });
    if (!record) return NextResponse.json({ error: "ไม่พบรายการนี้" }, { status: 404 });

    // ถ้า record นี้ complete แล้ว (จาก poller ฝั่ง server หรือ call อื่น) — return success ทันที
    if (record.status === "completed") {
      return NextResponse.json({ success: true, amount: record.amount });
    }
    if (record.status !== "pending") {
      return NextResponse.json({ success: false, message: "รายการนี้ดำเนินการไปแล้ว" });
    }

    try {
      await matchLastReceive();
    } catch {
      return NextResponse.json({ success: false, message: "ระบบไม่ว่าง กรุณารอสักครู่แล้วลองใหม่" });
    }

    // ดึง record ของ user นี้อีกครั้งเพื่อเช็คว่า complete แล้วหรือยัง
    const refreshed = await TrueMoneyTopup.findById(requestId);
    if (refreshed?.status === "completed") {
      return NextResponse.json({ success: true, amount: refreshed.amount ?? record.amount });
    }

    return NextResponse.json({ success: false, message: NOT_FOUND_MESSAGE });
  } catch (error: any) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด: " + error.message }, { status: 500 });
  }
}
