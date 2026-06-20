import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import Setting from "@/models/Setting";
import TrueMoneyTopup from "@/models/TrueMoneyTopup";

const ERROR_MESSAGES: Record<string, string> = {
  Forbidden: "ระบบเติมเงินผ่าน TrueMoney ขัดข้อง กรุณาติดต่อแอดมิน",
  Unauthorized: "ระบบเติมเงินผ่าน TrueMoney ขัดข้อง กรุณาติดต่อแอดมิน",
  "Too Many Requests": "มีผู้ใช้งานระบบ TrueMoney พร้อมกันมาก กรุณาลองใหม่อีกครั้งในไม่ช้า",
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนทำรายการ" }, { status: 401 });

    const { amount } = await req.json();
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "กรุณาระบุจำนวนเงินให้ถูกต้อง" }, { status: 400 });
    }

    await connectToDatabase();

    const [numberSetting, nameSetting] = await Promise.all([
      Setting.findOne({ key: "truemoney_number" }).lean(),
      Setting.findOne({ key: "site_name" }).lean(),
    ]);
    const truemoneyNumber = (numberSetting as any)?.value as string;
    const siteName = (nameSetting as any)?.value as string || "RareDrop";

    if (!truemoneyNumber) {
      return NextResponse.json({ error: "ยังไม่ได้ตั้งค่าเบอร์ TrueMoney กรุณาติดต่อแอดมิน" }, { status: 503 });
    }

    // เลขทศนิยมสุ่มเพิ่มเล็กน้อย (0.01–0.99) กันยอดชนกันถ้ามีลูกค้าหลายคนโอนยอดเท่ากันพร้อมกัน
    const cents = Math.floor(Math.random() * 99) + 1;
    const exactAmount = Math.round(Number(amount) * 100 + cents) / 100;

    const apiRes = await fetch("https://apis.truemoneyservices.com/utils/v1/transfer-link-generator", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.TRUEMONEY_LINK_TOKEN}`,
      },
      body: JSON.stringify({
        mobile_number: truemoneyNumber,
        amount: exactAmount.toFixed(2),
        message: `เติมเงิน ${siteName}`,
      }),
    });

    const data = await apiRes.json();
    if (data.status !== "ok" || !data.data?.url) {
      const friendly = ERROR_MESSAGES[data.err] || "ไม่สามารถสร้างลิงก์ชำระเงิน TrueMoney ได้ กรุณาลองใหม่";
      return NextResponse.json({ error: friendly }, { status: 502 });
    }

    const record = await TrueMoneyTopup.create({
      userId,
      amount: exactAmount,
      status: "pending",
      requestUrl: data.data.url,
    });

    return NextResponse.json({ requestId: record._id, url: data.data.url, amount: exactAmount });
  } catch (error: any) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด: " + error.message }, { status: 500 });
  }
}
