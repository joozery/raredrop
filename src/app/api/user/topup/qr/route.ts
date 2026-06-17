import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import Setting from "@/models/Setting";
import generatePayload from "promptpay-qr";
import QRCode from "qrcode";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนทำรายการ" }, { status: 401 });
    }

    const { amount } = await req.json();
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "กรุณาระบุจำนวนเงินให้ถูกต้อง" }, { status: 400 });
    }

    await connectToDatabase();

    const [numberSetting, nameSetting] = await Promise.all([
      Setting.findOne({ key: "promptpay_number" }).lean(),
      Setting.findOne({ key: "promptpay_name" }).lean(),
    ]);

    const promptpayNumber = (numberSetting as any)?.value as string;
    const accountName = (nameSetting as any)?.value as string || "บัญชีพร้อมเพย์";

    if (!promptpayNumber) {
      return NextResponse.json({ error: "ยังไม่ได้ตั้งค่าเบอร์พร้อมเพย์ กรุณาติดต่อแอดมิน" }, { status: 503 });
    }

    const payload = generatePayload(promptpayNumber, { amount: parseFloat(amount) });

    const qrImageBase64 = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: "M",
      margin: 4,
      scale: 8,
      color: { dark: "#000000", light: "#ffffff" },
    });

    return NextResponse.json({
      code: "200",
      message: "Success",
      data: {
        qrImageLink: qrImageBase64,
        accountName,
        amount: amount.toString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด: " + error.message }, { status: 500 });
  }
}
