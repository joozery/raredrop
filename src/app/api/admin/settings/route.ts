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
    key: "site_title_suffix",
    value: "กล่องสุ่มสินค้าพรีเมียม",
    label: "ข้อความต่อท้ายชื่อเว็บ (Title)",
    description: "แสดงต่อท้ายชื่อเว็บบนแท็บเบราว์เซอร์ เช่น \"LUXUSX - กล่องสุ่มสินค้าพรีเมียม\" — เว้นว่าง = แสดงเฉพาะชื่อเว็บ",
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
    key: "site_og_image",
    value: "https://pub-ee29977ae9524b05b628923eee00188a.r2.dev/logo/logo.png",
    label: "รูปภาพแชร์ (OG Image)",
    description: "รูปภาพที่แสดงเวลาแชร์ลิงก์เว็บลง Facebook, LINE ฯลฯ",
    type: "text",
    group: "ทั่วไป",
  },
  {
    key: "gemcoin_icon",
    value: "",
    label: "ไอคอน GemCoin",
    description: "รูปไอคอนที่ใช้แสดงแทน GemCoin ทั่วทั้งเว็บ — เว้นว่าง = ใช้ไอคอนเหรียญเริ่มต้น",
    type: "text",
    group: "ทั่วไป",
  },
  {
    key: "sidebar_bg",
    value: "",
    label: "พื้นหลัง Sidebar (รูป/วิดีโอ)",
    description: "รูปภาพหรือวิดีโอพื้นหลังของแถบเมนูด้านข้างหน้าบ้าน — เว้นว่าง = พื้นขาวเดิม",
    type: "text",
    group: "Sidebar หน้าบ้าน",
  },
  {
    key: "sidebar_text_color",
    value: "",
    label: "สีตัวหนังสือเมนู Sidebar",
    description: "โค้ดสี เช่น #4B5563 — เว้นว่าง = สีเดิม",
    type: "text",
    group: "Sidebar หน้าบ้าน",
  },
  {
    key: "sidebar_hover_text_color",
    value: "",
    label: "สีตัวหนังสือเมนูตอน hover",
    description: "โค้ดสี เช่น #111827 — เว้นว่าง = สีเดิม",
    type: "text",
    group: "Sidebar หน้าบ้าน",
  },
  {
    key: "sidebar_hover_bg_color",
    value: "",
    label: "สีพื้นหลังเมนูตอน hover",
    description: "โค้ดสี เช่น #F9FAFB — เว้นว่าง = สีเดิม",
    type: "text",
    group: "Sidebar หน้าบ้าน",
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
    key: "cards_open_cost",
    value: 50,
    label: "ค่าเปิดการ์ดต่อครั้ง (เหรียญ)",
    description: "จำนวนเหรียญที่หักต่อการเปิดการ์ด 1 ใบ ในหน้าสุ่มการ์ดพิเศษ",
    type: "number",
    group: "สุ่มการ์ดพิเศษ",
  },
  {
    key: "cards_back_image",
    value: "",
    label: "ภาพหน้าการ์ด (ก่อนเปิด)",
    description: "รูปที่แสดงบนการ์ดตอนยังคว่ำอยู่ — เว้นว่าง = ใช้ดีไซน์โลโก้ X เริ่มต้น",
    type: "text",
    group: "สุ่มการ์ดพิเศษ",
  },
  {
    key: "cards_page_bg",
    value: "",
    label: "พื้นหลังหน้าสุ่มการ์ด (รูป/วิดีโอ)",
    description: "รูปหรือวิดีโอพื้นหลังของหน้าสุ่มการ์ดพิเศษ — เว้นว่าง = พื้นเทาอ่อนเดิม",
    type: "text",
    group: "สุ่มการ์ดพิเศษ",
  },
  {
    key: "cards_per_round",
    value: 10,
    label: "จำนวนการ์ดต่อรอบ",
    description: "จำนวนการ์ดในหนึ่งรอบของหน้าสุ่มการ์ดพิเศษ (1-50) — ต้องมีรางวัลเปิดใช้งานเท่ากับจำนวนนี้พอดีถึงเปิดรอบได้ มีผลกับรอบถัดไปที่เปิด",
    type: "number",
    group: "สุ่มการ์ดพิเศษ",
  },
  {
    key: "cards_completed_title",
    value: "🎉 การ์ดทั้งหมดถูกเปิดออกหมดแล้ว",
    label: "ข้อความตอนเปิดครบรอบ (บรรทัดหลัก)",
    description: "หัวข้อที่โชว์ในหน้าสุ่มการ์ดเมื่อการ์ดทั้ง 10 ใบถูกเปิดครบแล้ว",
    type: "text",
    group: "สุ่มการ์ดพิเศษ",
  },
  {
    key: "cards_completed_subtitle",
    value: "รอแอดมินเปิดรอบใหม่ แล้วกลับมาลุ้นกันอีกครั้ง!",
    label: "ข้อความตอนเปิดครบรอบ (บรรทัดรอง)",
    description: "ข้อความอธิบายใต้หัวข้อ เมื่อการ์ดทั้งรอบถูกเปิดครบแล้ว",
    type: "text",
    group: "สุ่มการ์ดพิเศษ",
  },
  {
    key: "cards_special_completed_title",
    value: "⭐ รางวัลพิเศษถูกเปิดแล้ว — รอบนี้จบทันที!",
    label: "ข้อความตอนรางวัลพิเศษออก (บรรทัดหลัก)",
    description: "หัวข้อที่โชว์ในหน้าสุ่มการ์ดเมื่อรอบจบเพราะรางวัลพิเศษถูกเปิด",
    type: "text",
    group: "สุ่มการ์ดพิเศษ",
  },
  {
    key: "cards_special_completed_subtitle",
    value: "รอแอดมินเปิดรอบใหม่ แล้วกลับมาลุ้นกันอีกครั้ง!",
    label: "ข้อความตอนรางวัลพิเศษออก (บรรทัดรอง)",
    description: "ข้อความอธิบายใต้หัวข้อ เมื่อรอบจบเพราะรางวัลพิเศษถูกเปิด",
    type: "text",
    group: "สุ่มการ์ดพิเศษ",
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
    key: "payment_method",
    value: "promptpay",
    label: "ช่องทางรับเงินที่ใช้งาน",
    description: "เลือกว่าหน้าเติมเงินจะแสดง QR แบบไหน และใช้เช็คบัญชีผู้รับตอนตรวจสลิป",
    type: "select",
    options: ["promptpay", "qr_image"],
    group: "ช่องทางรับเงิน (QR ร้านค้า)",
  },
  {
    key: "payment_qr_image",
    value: "",
    label: "รูปภาพ QR Code ร้านค้า",
    description: "QR ที่ลูกค้าจะสแกนจ่ายเงิน (เช่น QR ถุงเงิน) — ระบบจะถอดรหัสบัญชีผู้รับให้อัตโนมัติ",
    type: "text",
    group: "ช่องทางรับเงิน (QR ร้านค้า)",
  },
  {
    key: "payment_qr_type",
    value: "",
    label: "ประเภท QR ที่ถอดรหัสได้",
    description: "ตั้งค่าอัตโนมัติหลังถอดรหัส QR — ไม่ต้องกรอกเอง",
    type: "text",
    group: "ช่องทางรับเงิน (QR ร้านค้า)",
  },
  {
    key: "payment_qr_account_type",
    value: "",
    label: "รหัสประเภทบัญชีผู้รับ",
    description: "ตั้งค่าอัตโนมัติหลังถอดรหัส QR — ไม่ต้องกรอกเอง",
    type: "text",
    group: "ช่องทางรับเงิน (QR ร้านค้า)",
  },
  {
    key: "payment_qr_account_number",
    value: "",
    label: "เลขบัญชี/รหัสอ้างอิงผู้รับ",
    description: "ตั้งค่าอัตโนมัติหลังถอดรหัส QR — ไม่ต้องกรอกเอง",
    type: "text",
    group: "ช่องทางรับเงิน (QR ร้านค้า)",
  },
  {
    key: "payment_qr_shop_name",
    value: "",
    label: "ชื่อร้านค้าที่ถอดรหัสได้",
    description: "ตั้งค่าอัตโนมัติหลังถอดรหัส QR — ใช้แสดงยืนยันผลถอดรหัสเท่านั้น",
    type: "text",
    group: "ช่องทางรับเงิน (QR ร้านค้า)",
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
    key: "red_envelope_help_text",
    value: "เข้าร่วมซองแดงเพื่อลุ้นรับเงินหรือไอเทมสุ่ม\nกดเข้าร่วมไว้ก่อน รอครบคนหรือหมดเวลาแล้วระบบจะจับรางวัลให้ทุกคนพร้อมกันทีเดียว",
    label: "เนื้อหา popup วิธีเล่นซองแดง",
    description: "ข้อความที่แสดงตอนกดปุ่ม ? ในหน้าซองแดง — ขึ้นบรรทัดใหม่ได้",
    type: "textarea",
    group: "ซองแดง",
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
    key: "hero_banner_link",
    value: "",
    label: "ลิงก์เมื่อคลิกแบนเนอร์ (ไม่บังคับ)",
    description: "เว้นว่างไว้ถ้าไม่ต้องการให้คลิกที่แบนเนอร์ได้ (เช่น /boxes หรือ https://...)",
    type: "text",
    group: "หน้าแรก (Hero Banner)",
  },
  {
    key: "hero_banner_carousel",
    value: [],
    label: "สไลด์รูปภาพแบนเนอร์",
    description: "แบนเนอร์แบบหลายรูปที่สามารถเลื่อนเป็นสไลด์ได้",
    type: "mixed",
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
  {
    key: "knowledge_hero_label",
    value: "Knowledge Base",
    label: "ข้อความป้ายเล็กด้านบน",
    description: "ข้อความตัวเล็กเหนือหัวเรื่องหลักบนแบนเนอร์หน้าวิธีการเล่น",
    type: "text",
    group: "วิธีการเล่น (Hero Banner)",
  },
  {
    key: "knowledge_hero_image",
    value: "",
    label: "รูปภาพแบนเนอร์",
    description: "URL รูปภาพพื้นหลังของแบนเนอร์หน้าวิธีการเล่น",
    type: "text",
    group: "วิธีการเล่น (Hero Banner)",
  },
  {
    key: "knowledge_hero_link",
    value: "",
    label: "ลิงก์เมื่อคลิกแบนเนอร์ (ไม่บังคับ)",
    description: "เว้นว่างไว้ถ้าไม่ต้องการให้คลิกที่แบนเนอร์ได้",
    type: "text",
    group: "วิธีการเล่น (Hero Banner)",
  },
  {
    key: "knowledge_hero_title",
    value: "วิธีการเล่น",
    label: "ข้อความหลัก",
    description: "ข้อความหัวเรื่องบนแบนเนอร์หน้าวิธีการเล่น",
    type: "text",
    group: "วิธีการเล่น (Hero Banner)",
  },
  {
    key: "knowledge_hero_subtitle",
    value: "รวมวิดีโอสอนและเกร็ดความรู้ที่ควรรู้ก่อนเริ่มเล่น",
    label: "คำบรรยายใต้แบนเนอร์",
    description: "ข้อความบรรยายใต้หัวเรื่อง",
    type: "text",
    group: "วิธีการเล่น (Hero Banner)",
  },
  {
    key: "popup_enabled",
    value: false,
    label: "เปิดใช้งาน Popup หน้าแรก",
    description: "แสดง popup โฆษณา/ประกาศให้ผู้ใช้เห็นทันทีที่เข้าหน้าแรก",
    type: "boolean",
    group: "Popup หน้าแรก",
  },
  {
    key: "popup_image",
    value: "",
    label: "รูปภาพ Popup",
    description: "รูปภาพที่แสดงใน popup",
    type: "text",
    group: "Popup หน้าแรก",
  },
  {
    key: "popup_link",
    value: "",
    label: "ลิงก์เมื่อคลิกรูป Popup (ไม่บังคับ)",
    description: "เว้นว่างไว้ถ้าไม่ต้องการให้คลิกที่รูป popup ได้ (เช่น /boxes หรือ https://...)",
    type: "text",
    group: "Popup หน้าแรก",
  },
  {
    key: "popup_dismiss_hours",
    value: 24,
    label: "โชว์ Popup ซ้ำทุกกี่ชั่วโมง (หลังผู้ใช้กดปิด)",
    description: "ผู้ใช้กดปิด popup แล้วจะไม่เห็นอีกจนครบจำนวนชั่วโมงนี้ จึงจะกลับมาโชว์ใหม่ — 0 = กดปิดแล้วไม่โชว์อีกเลย (จนกว่าจะเปลี่ยนรูป)",
    type: "number",
    group: "Popup หน้าแรก",
  },
  {
    key: "crypto_enabled",
    value: false,
    label: "เปิดใช้ระบบเติมเงิน Crypto (MetaMask)",
    description: "เมื่อเปิด จะแสดงแท็บ Crypto ใน Modal เติมเงิน ให้ผู้ใช้โอน ETH/BNB ผ่าน MetaMask",
    type: "boolean",
    group: "Crypto / MetaMask",
  },
  {
    key: "crypto_wallet_address",
    value: "",
    label: "ที่อยู่กระเป๋า Crypto ของร้าน (0x...)",
    description: "ที่อยู่ Ethereum/BSC/Polygon ที่ผู้ใช้จะโอนเงินมาหา — ต้องกรอกให้ถูกต้อง",
    type: "text",
    group: "Crypto / MetaMask",
  },
  {
    key: "crypto_network",
    value: "eth",
    label: "เครือข่าย Blockchain",
    description: "eth = Ethereum Mainnet, bsc = BNB Smart Chain, polygon = Polygon",
    type: "select",
    options: ["eth", "bsc", "polygon"],
    group: "Crypto / MetaMask",
  },
  {
    key: "crypto_rate_per_unit",
    value: 0,
    label: "อัตราแลกเปลี่ยน: 1 ETH/BNB/MATIC = กี่บาท (coins)",
    description: "เช่น ถ้า 1 BNB = 12,000 บาท ให้กรอก 12000 — ระบบจะคำนวณจำนวน Crypto ที่ต้องโอนให้อัตโนมัติ",
    type: "number",
    group: "Crypto / MetaMask",
  },
  {
    key: "crypto_explorer_api_key",
    value: "",
    label: "API Key ของ Blockchain Explorer (ไม่บังคับ)",
    description: "Etherscan / BscScan / PolygonScan API Key เพื่อตรวจสอบ TX — เว้นว่างได้ แต่อาจถูก rate-limit",
    type: "text",
    group: "Crypto / MetaMask",
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
      { upsert: true, returnDocument: 'after' }
    );

    if (!updated) {
      return NextResponse.json({ error: "Setting not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
