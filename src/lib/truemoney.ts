import Setting from "@/models/Setting";
import TrueMoneyTopup from "@/models/TrueMoneyTopup";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import { notify } from "@/lib/notify";
import { awardXp, getExpPerBaht } from "@/lib/xp";

// TrueMoney ส่ง received_time แบบ "YYYY-MM-DD HH:MM:SS" ไม่มี timezone — เป็นเวลาไทย (UTC+7) เสมอ
export function parseThaiTime(value: string): Date {
  return new Date(value.replace(" ", "T") + "+07:00");
}

// เข้าเครดิตให้รายการที่จับคู่สำเร็จ — atomic (pending → completed) กันเรียกซ้ำพร้อมกันหลายทาง
// transactionId: ของจริงจาก TrueMoney หรือ tag "manual:<adminId>" ตอนแอดมินกดยืนยันเอง
export async function creditTopup(pending: any, transactionId: string | undefined, description: string) {
  let updated;
  try {
    updated = await TrueMoneyTopup.findOneAndUpdate(
      { _id: pending._id, status: "pending" },
      { $set: { status: "completed", transactionId, completedAt: new Date() } },
      { new: true }
    );
  } catch (err: any) {
    if (err?.code === 11000) return false; // duplicate transactionId — เงินก้อนนี้ถูกใช้ไปแล้ว
    throw err;
  }
  if (!updated) return false; // มี call อื่น process ไปก่อนแล้ว

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
      description,
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
  return true;
}

// ดึงเงินเข้าล่าสุดจาก TrueMoney แล้วจับคู่กับรายการ pending ทั้งหมด
// ใช้ทั้งจาก verify (ลูกค้า poll) และ poller ฝั่ง server — connectToDatabase ต้องถูกเรียกก่อน
export async function matchLastReceive(): Promise<void> {
  const numberSetting = await Setting.findOne({ key: "truemoney_number" }).lean();
  const truemoneyNumber = (numberSetting as any)?.value as string;

  const apiRes = await fetch("https://apis.truemoneyservices.com/account/v1/my-last-receive", {
    headers: { Authorization: `Bearer ${process.env.TRUEMONEY_RECEIVE_TOKEN}` },
  });
  const data = await apiRes.json();
  if (data.status !== "ok" || !data.data) return;

  const received = data.data;
  // my-last-receive ส่ง amount เป็นสตางค์ (เช่น 1000 = ฿10.00)
  const receivedBaht = Number(received.amount) / 100;
  const receiverMatches = !truemoneyNumber || received.receiver_mobile === truemoneyNumber;
  if (!received.message || !receiverMatches) return;

  // transactionId นี้เคย process ไปแล้ว — ข้าม
  if (received.transaction_id) {
    const alreadyDone = await TrueMoneyTopup.findOne({ transactionId: received.transaction_id });
    if (alreadyDone) return;
  }

  const pendingRecords = await TrueMoneyTopup.find({ status: "pending" });
  for (const pending of pendingRecords) {
    if (
      received.message.includes(pending.matchCode) &&
      Math.abs(receivedBaht - pending.amount) < 0.005 &&
      parseThaiTime(received.received_time) >= pending.createdAt
    ) {
      await creditTopup(pending, received.transaction_id, "เติมเงินผ่าน TrueMoney Wallet");
      break; // 1 transaction ต่อ 1 record เท่านั้น
    }
  }
}
