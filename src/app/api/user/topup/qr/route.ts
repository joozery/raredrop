import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
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

    // สร้าง PromptPay Payload ด้วยเบอร์ของคุณ
    const mobileNumber = "0838346686"; // <--- เบอร์พร้อมเพย์ของคุณ
    const payload = generatePayload(mobileNumber, { amount: parseFloat(amount) });
    
    // แปลง Payload ให้เป็นรูปภาพ QR Code (Base64)
    const qrImageBase64 = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 4,
      scale: 8,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    return NextResponse.json({
      code: "200",
      message: "Success",
      data: {
        qrImageLink: qrImageBase64,
        accountName: "บัญชีของคุณ",
        amount: amount.toString()
      }
    });

  } catch (error: any) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด: " + error.message }, { status: 500 });
  }
}
