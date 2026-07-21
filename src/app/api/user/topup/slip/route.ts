import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import Setting from "@/models/Setting";
import { notify } from "@/lib/notify";
import { awardXp, getExpPerBaht } from "@/lib/xp";
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";

// รายละเอียดเพิ่มเติม: https://slip2go.com/guide — ดู "Success Code" / "Error Code"
const SLIP_RESULT_MESSAGES: Record<string, string> = {
  "200401": "สลิปนี้โอนเข้าบัญชีอื่น ไม่ใช่บัญชีร้านค้าของเรา",
  "200402": "ยอดเงินในสลิปไม่ตรงกับเงื่อนไข",
  "200403": "วันที่โอนในสลิปไม่ตรงกับเงื่อนไข",
  "200404": "ไม่พบสลิปนี้ในระบบธนาคาร",
  "200501": "สลิปนี้ถูกใช้งานไปแล้ว",
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนทำรายการ" }, { status: 401 });
    }

    const { slipBase64 } = await req.json();
    if (!slipBase64) {
      return NextResponse.json({ error: "ไม่พบรูปภาพสลิป" }, { status: 400 });
    }

    const SLIP2GO_API_KEY = process.env.SLIP2GO_API_KEY;

    await connectToDatabase();

    // โหลดบัญชีผู้รับที่ตั้งไว้ในหลังบ้าน
    const paymentSettings = await Setting.find({
      key: { $in: ["payment_method", "payment_qr_account_number", "payment_qr_ref1", "promptpay_number"] },
    }).lean();
    const getSetting = (key: string) =>
      (paymentSettings.find((s: any) => s.key === key) as any)?.value;
    const paymentMethod = String(getSetting("payment_method") || "promptpay");
    const normalize = (v: string) => String(v || "").replace(/[^0-9A-Za-z]/g, "");
    const qrAccountNumber = normalize(getSetting("payment_qr_account_number") || "");
    const qrRef1 = String(getSetting("payment_qr_ref1") || "").trim();
    const promptpayNumber = normalize(getSetting("promptpay_number") || "");

    // slipBase64 เป็น data URI เต็มรูปแบบจาก FileReader.readAsDataURL (เช่น "data:image/jpeg;base64,...")
    const match = String(slipBase64).match(/^data:(.+);base64,(.+)$/);
    const mimeType = match?.[1] || "image/jpeg";
    const rawBase64 = match ? match[2] : slipBase64;
    const fileBuffer = Buffer.from(rawBase64, "base64");

    const conditionPayload: Record<string, unknown> = { checkDuplicate: true };

    const formData = new FormData();
    formData.append("file", new Blob([fileBuffer], { type: mimeType }), "slip.jpg");
    formData.append("payload", JSON.stringify(conditionPayload));

    // Slip2Go API doc: POST /verify-slip/qr-image/info (multipart/form-data)
    const response = await fetch("https://connect.slip2go.com/api/verify-slip/qr-image/info", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SLIP2GO_API_KEY}`
      },
      body: formData,
    });

    const data = await response.json();

    // เมื่อส่ง checkCondition ไปด้วย ผลลัพธ์ที่ผ่านเงื่อนไขทั้งหมดจะได้ code "200200" (ไม่ใช่ "200000")
    const isSuccess = data.code === "200000" || data.code === "200200";
    if (!response.ok || !isSuccess || !data.data) {
      console.error("Slip error:", JSON.stringify(data, null, 2));
      const friendlyMessage = SLIP_RESULT_MESSAGES[data.code] || data.message || "สลิปไม่ถูกต้อง หรือถูกใช้งานไปแล้ว";
      return NextResponse.json({ error: friendlyMessage }, { status: 400 });
    }

    // ตรวจ receiver — ถุงเงิน ใช้ ref1 ตาม Slip2Go แนะนำ, พร้อมเพย์ ใช้ suffix proxy.account
    if (paymentMethod === "qr_image") {
      if (qrRef1) {
        const slipRef1 = String(data.data?.ref1 || "").trim();
        if (slipRef1 !== qrRef1) {
          console.error("Ref1 mismatch — expected:", qrRef1, "got:", slipRef1);
          return NextResponse.json(
            { error: "สลิปนี้โอนเข้าบัญชีอื่น ไม่ใช่บัญชีร้านค้าของเรา" },
            { status: 400 }
          );
        }
      } else if (qrAccountNumber) {
        // fallback: suffix check กรณียังไม่มี ref1 ใน DB (ก่อน decode QR ใหม่)
        const proxyAccount = normalize(data.data?.receiver?.account?.proxy?.account || "");
        const suffix = qrAccountNumber.slice(-4);
        if (!proxyAccount || !proxyAccount.endsWith(suffix)) {
          console.error("Receiver mismatch — expected suffix:", suffix, "got proxy:", proxyAccount);
          return NextResponse.json(
            { error: "สลิปนี้โอนเข้าบัญชีอื่น ไม่ใช่บัญชีร้านค้าของเรา" },
            { status: 400 }
          );
        }
      }
    } else if (paymentMethod === "promptpay" && promptpayNumber) {
      const proxyAccount = normalize(data.data?.receiver?.account?.proxy?.account || "");
      const suffix = promptpayNumber.slice(-4);
      if (!proxyAccount || !proxyAccount.endsWith(suffix)) {
        console.error("Receiver mismatch — expected suffix:", suffix, "got proxy:", proxyAccount);
        return NextResponse.json(
          { error: "สลิปนี้โอนเข้าบัญชีอื่น ไม่ใช่บัญชีร้านค้าของเรา" },
          { status: 400 }
        );
      }
    }

    // ดึงจำนวนเงินจากผลลัพธ์ของ API
    const amount = parseFloat(data.data.amount);

    // อัปโหลดสลิปไป R2 เพื่อเก็บหลักฐาน (best-effort — ไม่ fail ถ้าอัปโหลดไม่ได้)
    let slipUrl: string | undefined;
    try {
      const ext = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
      const key = `slips/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      await r2.send(new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
        CacheControl: "public, max-age=31536000",
      }));
      slipUrl = `${R2_PUBLIC_URL}/${key}`;
    } catch (uploadErr) {
      console.error("Slip upload to R2 failed (non-fatal):", uploadErr);
    }

    // อัปเดตเงินให้ User
    const user = await User.findByIdAndUpdate(
      (session.user as any)?.id,
      { $inc: { coins: amount } },
      { returnDocument: "after" }
    );

    if (user) {
      await Transaction.create({
        userId: user._id,
        type: "topup",
        amount: amount,
        balanceAfter: user.coins,
        description: `เติมเงินผ่านสลิปสำเร็จ`,
        slipUrl,
      });
      await notify(
        user._id.toString(),
        `เติมเงินสำเร็จ! 💰`,
        `ยอดเงิน ฿${amount.toLocaleString()} เข้าบัญชีของคุณแล้ว (ยอดรวม ฿${user.coins.toLocaleString()})`,
        "success"
      );

      // Award EXP based on topup amount
      const expRate = await getExpPerBaht();
      const xpToAdd = Math.floor(amount * expRate);
      if (xpToAdd > 0) await awardXp(user._id.toString(), xpToAdd);
    }
    
    return NextResponse.json({ success: true, amount, user });

  } catch (error: any) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด: " + error.message }, { status: 500 });
  }
}
