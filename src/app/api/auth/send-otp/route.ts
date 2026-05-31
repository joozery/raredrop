import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { connectToDatabase } from "@/lib/mongoose";
import Otp from "@/models/Otp";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Save to Database
    await connectToDatabase();
    
    // Remove old OTPs for this email
    await Otp.deleteMany({ email });

    await Otp.create({
      email,
      otp: otpCode,
    });

    console.log("==========================================");
    console.log(`[DEV ONLY] OTP for ${email} is: ${otpCode}`);
    console.log("==========================================");

    // Setup Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    try {
      await transporter.sendMail({
        from: `"RareDrop" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: "รหัสยืนยันการเข้าสู่ระบบ RareDrop",
        html: `
          <div style="font-family: sans-serif; text-align: center; padding: 20px;">
            <h2>รหัสยืนยัน (OTP) ของคุณคือ</h2>
            <h1 style="font-size: 32px; letter-spacing: 5px; color: #000; background-color: #f4f4f4; padding: 15px; border-radius: 10px; display: inline-block;">
              ${otpCode}
            </h1>
            <p>รหัสนี้จะหมดอายุภายใน 5 นาที</p>
          </div>
        `,
      });
    } catch (emailError: any) {
      console.error("Nodemailer API Error:", emailError);
      return NextResponse.json({ 
        message: "OTP Generated, but email failed. Check your terminal for the code or verify App Password.",
        devOtp: otpCode 
      });
    }

    return NextResponse.json({ message: "OTP sent successfully" });
  } catch (error: any) {
    console.error("OTP generation error:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
