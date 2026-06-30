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

async function processMatch(pending: any, received: any, receivedBaht: number) {
  let updated;
  try {
    updated = await TrueMoneyTopup.findOneAndUpdate(
      { _id: pending._id, status: "pending" },
      { $set: { status: "completed", transactionId: received.transaction_id, completedAt: new Date() } },
      { new: true }
    );
  } catch (err: any) {
    if (err?.code === 11000) return; // duplicate transactionId — already processed
    throw err;
  }
  if (!updated) return; // already processed by another concurrent call

  const user = await User.findByIdAndUpdate(
    pending.userId,
    { $inc: { coins: pending.amount } },
    { new: true }
  );

  if (user) {
    await Transaction.create({
      userId: user._id,
      type: "topup",
      amount: pending.amount,
      balanceAfter: user.coins,
      description: "เติมเงินผ่าน TrueMoney Wallet",
    });
    await notify(
      user._id.toString(),
      "เติมเงินสำเร็จ! 💰",
      `ยอดเงิน ฿${pending.amount.toLocaleString()} เข้าบัญชีของคุณแล้ว (ยอดรวม ฿${user.coins.toLocaleString()})`,
      "success"
    );

    const expRate = await getExpPerBaht();
    const xpToAdd = Math.floor(pending.amount * expRate);
    if (xpToAdd > 0) await awardXp(user._id.toString(), xpToAdd);
  }
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

    // ถ้า record นี้ complete แล้ว (จาก call อื่น) — return success ทันที
    if (record.status === "completed") {
      return NextResponse.json({ success: true, amount: record.amount });
    }
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
    // my-last-receive ส่ง amount เป็นสตางค์ (เช่น 1000 = ฿10.00)
    const receivedBaht = Number(received.amount) / 100;
    const receiverMatches = !truemoneyNumber || received.receiver_mobile === truemoneyNumber;

    // ตรวจว่า transactionId นี้ถูก process ไปแล้วหรือยัง
    const alreadyDone = received.transaction_id
      ? await TrueMoneyTopup.findOne({ transactionId: received.transaction_id })
      : null;

    if (!alreadyDone && received.message && receiverMatches) {
      // หาทุก pending record ที่ matchCode ตรงกับ message ของ transaction นี้
      // เพื่อให้ verify call จากใครก็ได้ช่วย process ของคนอื่นได้ด้วย
      const pendingRecords = await TrueMoneyTopup.find({ status: "pending" });
      for (const pending of pendingRecords) {
        if (
          received.message.includes(pending.matchCode) &&
          Math.abs(receivedBaht - pending.amount) < 0.005 &&
          parseThaiTime(received.received_time) >= pending.createdAt
        ) {
          await processMatch(pending, received, receivedBaht);
          break; // 1 transaction ต่อ 1 record เท่านั้น
        }
      }
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
