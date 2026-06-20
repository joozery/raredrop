import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import Setting from "@/models/Setting";
import TrueMoneyTopup from "@/models/TrueMoneyTopup";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { notify } from "@/lib/notify";
import { awardXp, getExpPerBaht } from "@/lib/xp";

const NOT_FOUND_MESSAGE = "ยังไม่พบรายการโอนของคุณ ตรวจสอบว่าโอนเงินแล้วและลองใหม่อีกครั้ง";

// TrueMoney ส่ง received_time แบบ "YYYY-MM-DD HH:MM:SS" ไม่มี timezone — เป็นเวลาไทย (UTC+7) เสมอ
function parseThaiTime(value: string): Date {
  return new Date(value.replace(" ", "T") + "+07:00");
}

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
    if (record.status !== "pending") {
      return NextResponse.json({ success: false, message: "รายการนี้ดำเนินการไปแล้ว" });
    }

    const numberSetting = await Setting.findOne({ key: "truemoney_number" }).lean();
    const truemoneyNumber = (numberSetting as any)?.value as string;

    const apiRes = await fetch("https://apis.truemoneyservices.com/account/v1/my-last-receive", {
      headers: { Authorization: `Bearer ${process.env.TRUEMONEY_RECEIVE_TOKEN}` },
    });
    const data = await apiRes.json();

    if (data.status !== "ok" || !data.data) {
      return NextResponse.json({ success: false, message: "ระบบไม่ว่าง กรุณารอสักครู่แล้วลองใหม่" });
    }

    const received = data.data;
    // โค้ดอ้างอิงเฉพาะตัว (ฝังไว้ใน message ตอนสร้างลิงก์) คือตัวเช็คหลัก — TrueMoney ส่งข้อความนี้กลับมาเป๊ะ
    // เมื่อลูกค้าจ่ายผ่านลิงก์ที่เราสร้าง แม่นยำกว่าเช็คแค่ยอดเงิน/เวลา
    const codeMatches = !!received.message && received.message.includes(record.matchCode);
    // my-last-receive ส่ง amount เป็นสตางค์ (เช่น 516 = ฿5.16) ต่างจาก transfer-link-generator ที่รับเป็นบาท
    const receivedBaht = Number(received.amount) / 100;
    const amountMatches = Math.abs(receivedBaht - record.amount) < 0.005;
    const isRecent = parseThaiTime(received.received_time) >= record.createdAt;
    const receiverMatches = !truemoneyNumber || received.receiver_mobile === truemoneyNumber;

    if (!codeMatches || !amountMatches || !isRecent || !receiverMatches) {
      return NextResponse.json({ success: false, message: NOT_FOUND_MESSAGE });
    }

    let updated;
    try {
      updated = await TrueMoneyTopup.findOneAndUpdate(
        { _id: requestId, status: "pending" },
        { $set: { status: "completed", transactionId: received.transaction_id, completedAt: new Date() } },
        { new: true }
      );
    } catch (err: any) {
      if (err?.code === 11000) {
        return NextResponse.json({ success: false, message: NOT_FOUND_MESSAGE });
      }
      throw err;
    }
    if (!updated) {
      return NextResponse.json({ success: false, message: "รายการนี้ดำเนินการไปแล้ว" });
    }

    const user = await User.findByIdAndUpdate(userId, { $inc: { coins: record.amount } }, { new: true });

    if (user) {
      await Transaction.create({
        userId: user._id,
        type: "topup",
        amount: record.amount,
        balanceAfter: user.coins,
        description: "เติมเงินผ่าน TrueMoney Wallet",
      });
      await notify(
        user._id.toString(),
        "เติมเงินสำเร็จ! 💰",
        `ยอดเงิน ฿${record.amount.toLocaleString()} เข้าบัญชีของคุณแล้ว (ยอดรวม ฿${user.coins.toLocaleString()})`,
        "success"
      );

      const expRate = await getExpPerBaht();
      const xpToAdd = Math.floor(record.amount * expRate);
      if (xpToAdd > 0) await awardXp(user._id.toString(), xpToAdd);
    }

    return NextResponse.json({ success: true, amount: record.amount });
  } catch (error: any) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด: " + error.message }, { status: 500 });
  }
}
