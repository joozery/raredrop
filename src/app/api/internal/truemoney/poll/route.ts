import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import TrueMoneyTopup from "@/models/TrueMoneyTopup";
import { matchLastReceive } from "@/lib/truemoney";

// Poller ภายใน — server.js เรียกซ้ำ ๆ เพื่อจับคู่เงินเข้า TrueMoney โดยไม่ต้องพึ่งเบราว์เซอร์ลูกค้า
// (ลูกค้าปิดแท็บไปแล้วเครดิตก็ยังเข้า และย่นช่วงเสี่ยงที่รายการโดนเงินเข้าใหม่ทับ)

// กันเรียก TrueMoney API ถี่เกิน — เว้นอย่างน้อย 3 วิ ต่อครั้ง (module-level อยู่ได้ทั้ง process)
let lastExternalCallAt = 0;
const MIN_INTERVAL_MS = 3000;

export async function GET(req: Request) {
  try {
    // ยอมเฉพาะ caller ภายในที่รู้ secret ของระบบ — กันคนนอกยิงรัวจน TrueMoney rate limit
    const key = req.headers.get("x-internal-key");
    if (!process.env.NEXTAUTH_SECRET || key !== process.env.NEXTAUTH_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const pendingCount = await TrueMoneyTopup.countDocuments({ status: "pending" });
    if (pendingCount === 0) {
      return NextResponse.json({ checked: false, pending: 0 });
    }

    const now = Date.now();
    if (now - lastExternalCallAt < MIN_INTERVAL_MS) {
      return NextResponse.json({ checked: false, pending: pendingCount, throttled: true });
    }
    lastExternalCallAt = now;

    await matchLastReceive();
    return NextResponse.json({ checked: true, pending: pendingCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
