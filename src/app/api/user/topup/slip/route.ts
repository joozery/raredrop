import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";

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

    // TODO: นำ API KEY จาก Slip2Go หรือ SlipOK มาใส่ตรงนี้
    const SLIP2GO_API_KEY = process.env.SLIP2GO_API_KEY;

    const response = await fetch("https://connect.slip2go.com/api/verify-slip/qr-base64/info", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SLIP2GO_API_KEY}`
      },
      body: JSON.stringify({ 
        payload: {
          imageBase64: slipBase64,
          checkCondition: {
            checkDuplicate: true // ตรวจสอบสลิปซ้ำ
          }
        } 
      }) 
    });
    
    const data = await response.json();
    
    // Check if verification was successful (Slip2go usually returns code: "200" or "200000")
    if (!response.ok || (data.code !== "200" && data.code !== "200000") || !data.data) {
      console.error("Slip error:", data);
      return NextResponse.json({ error: data.message || "สลิปไม่ถูกต้อง หรือถูกใช้งานไปแล้ว" }, { status: 400 });
    }
    
    // ดึงจำนวนเงินจากผลลัพธ์ของ API
    const amount = parseFloat(data.data.amount);
    
    await connectToDatabase();
    
    // อัปเดตเงินให้ User (เก็บ transaction ไว้กันสลิปซ้ำด้วยในอนาคตแนะนำให้เช็ค ref_no)
    console.log("Target User ID:", (session.user as any)?.id);
    const user = await User.findByIdAndUpdate(
      (session.user as any)?.id, 
      { $inc: { coins: amount } }, 
      { new: true }
    );
    console.log("Updated User Result:", user);
    
    return NextResponse.json({ success: true, amount, user });

  } catch (error: any) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด: " + error.message }, { status: 500 });
  }
}
