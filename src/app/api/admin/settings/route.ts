import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import Setting from "@/models/Setting";

const DEFAULT_SETTINGS = [
  {
    key: "site_logo",
    value: "https://pub-ee29977ae9524b05b628923eee00188a.r2.dev/logo/logo.png",
    label: "โลโก้เว็บไซต์",
    description: "URL รูปโลโก้ที่แสดงในแถบด้านบน",
    type: "text",
    group: "ทั่วไป",
  },
  {
    key: "site_name",
    value: "RAREDROP",
    label: "ชื่อเว็บไซต์",
    description: "ชื่อที่แสดงในส่วนหัวของเว็บไซต์",
    type: "text",
    group: "ทั่วไป",
  },
  {
    key: "site_description",
    value: "แพลตฟอร์มกล่องสุ่มออนไลน์",
    label: "คำอธิบายเว็บไซต์",
    description: "คำอธิบายสั้นๆ สำหรับ SEO",
    type: "text",
    group: "ทั่วไป",
  },
  {
    key: "maintenance_mode",
    value: false,
    label: "โหมดปิดซ่อมบำรุง",
    description: "เมื่อเปิด ผู้ใช้จะไม่สามารถเข้าใช้งานได้",
    type: "boolean",
    group: "ทั่วไป",
  },
  {
    key: "min_topup_amount",
    value: 10,
    label: "จำนวนขั้นต่ำในการเติมเงิน (บาท)",
    description: "ยอดเติมเงินต่ำสุดที่ผู้เล่นสามารถเติมได้",
    type: "number",
    group: "กระเป๋าเงิน",
  },
  {
    key: "max_topup_amount",
    value: 5000,
    label: "จำนวนสูงสุดในการเติมเงินต่อครั้ง (บาท)",
    description: "ยอดเติมเงินสูงสุดต่อรายการ",
    type: "number",
    group: "กระเป๋าเงิน",
  },
  {
    key: "welcome_coins",
    value: 0,
    label: "เหรียญต้อนรับสมาชิกใหม่",
    description: "จำนวนเหรียญที่ให้ผู้เล่นใหม่เมื่อสมัครสมาชิก",
    type: "number",
    group: "กระเป๋าเงิน",
  },
  {
    key: "truemoney_number",
    value: "0945605512",
    label: "เบอร์ TrueMoney ของร้าน",
    description: "เบอร์ปลายทางที่ใช้สร้างลิงก์ขอรับเงินผ่าน TrueMoney Wallet",
    type: "text",
    group: "กระเป๋าเงิน",
  },
  {
    key: "market_fee_percent",
    value: 10,
    label: "ค่าธรรมเนียมตลาด (%)",
    description: "เปอร์เซ็นต์ที่หักจากผู้ขายทุกรายการ",
    type: "number",
    group: "ตลาดซื้อขาย",
  },
  {
    key: "max_active_listings",
    value: 20,
    label: "จำนวนรายการขายสูงสุดต่อผู้เล่น",
    description: "ผู้เล่นหนึ่งคนวางขายได้สูงสุดกี่รายการพร้อมกัน",
    type: "number",
    group: "ตลาดซื้อขาย",
  },
  {
    key: "box_daily_limit",
    value: 0,
    label: "จำกัดการเปิดกล่องต่อวัน (0 = ไม่จำกัด)",
    description: "จำนวนกล่องสูงสุดที่ผู้เล่นหนึ่งคนสามารถเปิดได้ต่อวัน",
    type: "number",
    group: "กล่องสุ่ม",
  },
  {
    key: "allow_guest_browse",
    value: true,
    label: "อนุญาตให้ผู้เยี่ยมชมดูกล่องได้",
    description: "ผู้ที่ยังไม่ล็อกอินสามารถเข้าชมรายการกล่องได้",
    type: "boolean",
    group: "กล่องสุ่ม",
  },
  {
    key: "promptpay_number",
    value: "",
    label: "เบอร์/เลขบัตรประชาชนพร้อมเพย์",
    description: "เบอร์โทรหรือเลขบัตรประชาชนที่ผูกกับพร้อมเพย์ (ใช้สร้าง QR Code)",
    type: "text",
    group: "พร้อมเพย์",
  },
  {
    key: "promptpay_name",
    value: "",
    label: "ชื่อบัญชีพร้อมเพย์",
    description: "ชื่อที่แสดงให้ผู้ใช้เห็นในหน้าเติมเงิน",
    type: "text",
    group: "พร้อมเพย์",
  },
  {
    key: "discord_invite_url",
    value: "",
    label: "ลิงก์เชิญเข้า Discord",
    description: "ใช้กับปุ่ม Discord ใน sidebar — เว้นว่าง = ปุ่มจะไม่ลิงก์ไปไหน",
    type: "text",
    group: "Discord",
  },
  {
    key: "discord_join_reward_gemcoin",
    value: 0,
    label: "รางวัล GemCoin (กดลิงก์ Discord ครั้งแรก)",
    description: "จำนวน GemCoin ที่ให้ผู้เล่นตอนกดปุ่ม Discord ครั้งแรก (ครั้งเดียวต่อคน) — 0 = ปิดระบบแจกรางวัล",
    type: "number",
    group: "Discord",
  },
  {
    key: "referral_reward_gemcoin",
    value: 0,
    label: "รางวัล GemCoin (เชิญเพื่อนสมัครสำเร็จ)",
    description: "จำนวน GemCoin ที่ผู้เชิญได้รับ ทันทีที่เพื่อนสมัครสมาชิกสำเร็จผ่านลิงก์เชิญ (ต่อคน) — 0 = ปิดระบบแจกรางวัล",
    type: "number",
    group: "เชิญเพื่อน",
  },
  {
    key: "help_line_url",
    value: "",
    label: "ลิงก์ติดต่อ LINE",
    description: "แสดงในหน้าช่วยเหลือ — เว้นว่าง = ไม่แสดงช่องทางนี้",
    type: "text",
    group: "ช่วยเหลือ",
  },
  {
    key: "help_email",
    value: "",
    label: "อีเมลติดต่อ",
    description: "แสดงในหน้าช่วยเหลือ — เว้นว่าง = ไม่แสดงช่องทางนี้",
    type: "text",
    group: "ช่วยเหลือ",
  },
  {
    key: "help_phone",
    value: "",
    label: "เบอร์โทรติดต่อ",
    description: "แสดงในหน้าช่วยเหลือ — เว้นว่าง = ไม่แสดงช่องทางนี้",
    type: "text",
    group: "ช่วยเหลือ",
  },
  {
    key: "help_facebook_url",
    value: "",
    label: "ลิงก์ Facebook",
    description: "แสดงในหน้าช่วยเหลือและแถบด้านข้าง — เว้นว่าง = ไม่แสดงช่องทางนี้",
    type: "text",
    group: "ช่วยเหลือ",
  },
  {
    key: "help_tiktok_url",
    value: "",
    label: "ลิงก์ TikTok",
    description: "แสดงในแถบด้านข้าง — เว้นว่าง = ไม่แสดงช่องทางนี้",
    type: "text",
    group: "ช่วยเหลือ",
  },
  {
    key: "help_youtube_url",
    value: "",
    label: "ลิงก์ YouTube",
    description: "แสดงในแถบด้านข้าง — เว้นว่าง = ไม่แสดงช่องทางนี้",
    type: "text",
    group: "ช่วยเหลือ",
  },
  {
    key: "hero_banner_image",
    value: "https://pub-ee29977ae9524b05b628923eee00188a.r2.dev/banner/cover/cover.png",
    label: "รูปภาพแบนเนอร์",
    description: "URL รูปภาพพื้นหลังของแบนเนอร์หลักหน้าแรก",
    type: "text",
    group: "หน้าแรก (Hero Banner)",
  },
  {
    key: "hero_banner_title1",
    value: "เปิดลุ้นของสะสมสุดพิเศษ",
    label: "ข้อความหลัก 1",
    description: "ข้อความบรรทัดแรกบนแบนเนอร์หลัก",
    type: "text",
    group: "หน้าแรก (Hero Banner)",
  },
  {
    key: "hero_banner_title2",
    value: "จากทั่วโลก",
    label: "ข้อความหลัก 2 (เน้นสี)",
    description: "ข้อความบรรทัดที่สองบนแบนเนอร์หลัก",
    type: "text",
    group: "หน้าแรก (Hero Banner)",
  },
  {
    key: "hero_banner_subtitle",
    value: "กล่องสุ่มหลากหลาย สินค้าพรีเมียม\nลุ้นได้จริง ส่งถึงมือคุณ",
    label: "คำบรรยายใต้แบนเนอร์",
    description: "ข้อความบรรยายใต้แบนเนอร์ (รองรับการขึ้นบรรทัดใหม่ \\n)",
    type: "text",
    group: "หน้าแรก (Hero Banner)",
  },
  {
    key: "hero_banner_icon",
    value: "✦",
    label: "ไอคอนต่อท้าย",
    description: "สัญลักษณ์ที่ต่อท้ายข้อความหลัก 2 (เช่น ✦)",
    type: "text",
    group: "หน้าแรก (Hero Banner)",
  },
  {
    key: "hero_banner_button1",
    value: "เปิดกล่องเลย",
    label: "ข้อความปุ่มที่ 1",
    description: "ข้อความปุ่มสีแดง",
    type: "text",
    group: "หน้าแรก (Hero Banner)",
  },
  {
    key: "hero_banner_button2",
    value: "ดูทั้งหมด",
    label: "ข้อความปุ่มที่ 2",
    description: "ข้อความปุ่มสีขาว",
    type: "text",
    group: "หน้าแรก (Hero Banner)",
  },
];

async function seedDefaultSettings() {
  for (const s of DEFAULT_SETTINGS) {
    await Setting.updateOne({ key: s.key }, { $setOnInsert: s }, { upsert: true });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    await seedDefaultSettings();

    const settings = await Setting.find().sort({ group: 1, key: 1 }).lean();
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { key, value } = await req.json();
    if (!key) {
      return NextResponse.json({ error: "key is required" }, { status: 400 });
    }

    await connectToDatabase();
    await seedDefaultSettings(); // ensure document exists before update

    const updated = await Setting.findOneAndUpdate(
      { key },
      { $set: { value, updatedBy: (session.user as any)?._id } },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Setting not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
