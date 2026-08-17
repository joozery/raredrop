import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Otp from "@/models/Otp";
import { sendSmsOtp } from "@/lib/sepsms";

const THAI_PHONE_RE = /^0[689]\d{8}$/;

export async function POST(req: Request) {
  try {
    const { phone } = await req.json();

    if (!phone || !THAI_PHONE_RE.test(phone)) {
      return NextResponse.json({ error: "เบอร์โทรไม่ถูกต้อง (ต้องเป็นเบอร์ไทย 10 หลัก)" }, { status: 400 });
    }

    await connectToDatabase();

    const sender = process.env.SEPSMS_SENDER || "OTP";
    const reference = await sendSmsOtp(phone, sender);

    await Otp.deleteMany({ phone });
    await Otp.create({ phone, reference });

    return NextResponse.json({ message: "ส่ง OTP สำเร็จ" });
  } catch (error: any) {
    console.error("send-otp-phone error:", error);
    return NextResponse.json({ error: error.message || "ส่ง OTP ไม่สำเร็จ กรุณาลองใหม่" }, { status: 500 });
  }
}
