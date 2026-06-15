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

    const updated = await Setting.findOneAndUpdate(
      { key },
      { value, updatedBy: (session.user as any)?._id },
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
