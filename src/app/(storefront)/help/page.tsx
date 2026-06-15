"use client";

import { useState } from "react";
import { HelpCircle, ChevronDown, MessageCircle, Mail, Phone, Search } from "lucide-react";

interface FAQ {
  q: string;
  a: string;
  category: string;
}

const FAQS: FAQ[] = [
  // การเปิดกล่อง
  { category: "การเปิดกล่อง", q: "วิธีเปิดกล่องสุ่มทำอย่างไร?", a: "เติมเงินเข้าระบบก่อน จากนั้นเลือกกล่องที่ต้องการ กดปุ่ม 'เปิดกล่องเลย!' ระบบจะสุ่มไอเท็มให้ทันที ไอเท็มที่ได้จะถูกเก็บไว้ในคลังของคุณ" },
  { category: "การเปิดกล่อง", q: "ระบบการสุ่มยุติธรรมไหม?", a: "ระบบของเราใช้ Weighted Random Algorithm มาตรฐานสากล ทุกการสุ่มเป็นอิสระและไม่ขึ้นกับการสุ่มครั้งก่อน ความน่าจะเป็นแสดงชัดเจนบนหน้ากล่องทุกกล่อง" },
  { category: "การเปิดกล่อง", q: "Pity System คืออะไร?", a: "Pity System การันตีว่าเมื่อเปิดกล่องครบ 100 ครั้ง คุณจะได้รับไอเท็มระดับ Legendary หรือสูงกว่าแน่นอน ตัวนับจะรีเซ็ตเมื่อได้รับไอเท็ม Legendary" },
  { category: "การเปิดกล่อง", q: "เปิดหลายครั้งพร้อมกันได้ไหม?", a: "ได้ครับ สามารถเปิดได้ครั้งละ 1, 3, 5 หรือ 10 ครั้ง การเปิดหลายครั้งยังช่วยให้คุณประหยัดได้สูงสุดถึง 12%" },
  // การเงิน
  { category: "การเงิน", q: "เติมเงินได้อย่างไร?", a: "เติมเงินผ่านการโอนธนาคารแล้วอัพโหลดสลิป ระบบตรวจสอบอัตโนมัติผ่าน Slip2Go โดยปกติเงินจะเข้าภายใน 1-5 นาที" },
  { category: "การเงิน", q: "ขั้นต่ำในการเติมเงินเท่าไหร่?", a: "เติมเงินขั้นต่ำ 100 บาท ต่อครั้ง ไม่มีขั้นสูงสุด" },
  { category: "การเงิน", q: "ถอนเงินออกได้ไหม?", a: "ไม่สามารถถอนเงินออกได้โดยตรง แต่คุณสามารถขายไอเท็มในตลาดเพื่อรับเหรียญกลับมา หรือเลือกรับสินค้าจริงแทน" },
  // ตลาดซื้อขาย
  { category: "ตลาดซื้อขาย", q: "วิธีลิสต์ขายสินค้าในตลาด?", a: "ไปที่ 'คอลเลกชันของฉัน' เลือกไอเท็มที่ต้องการขาย กดปุ่ม 'ลงขาย' กำหนดราคา แล้วยืนยัน สินค้าจะปรากฏในตลาดทันที" },
  { category: "ตลาดซื้อขาย", q: "ค่าธรรมเนียมการขายเท่าไหร่?", a: "ค่าธรรมเนียม 5% ของราคาขาย ยกตัวอย่าง ขาย 1,000 บาท จะได้รับ 950 บาท" },
  // บัญชีผู้ใช้
  { category: "บัญชีผู้ใช้", q: "ลืมรหัสผ่าน/อีเมลทำอย่างไร?", a: "ระบบ RareDrop ใช้ OTP ผ่านอีเมล ไม่มีรหัสผ่าน กรอกอีเมลที่ลงทะเบียนเพื่อรับ OTP เข้าสู่ระบบ" },
  { category: "บัญชีผู้ใช้", q: "เปลี่ยนข้อมูลโปรไฟล์ได้ที่ไหน?", a: "ไปที่หน้า 'โปรไฟล์ของฉัน' แล้วกดแก้ไขข้อมูลได้เลย รองรับการเปลี่ยนชื่อและรูปโปรไฟล์" },
];

const CATEGORIES = ["ทั้งหมด", ...Array.from(new Set(FAQS.map((f) => f.category)))];

export default function HelpPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("ทั้งหมด");

  const filtered = FAQS.filter((f) => {
    const matchCat = cat === "ทั้งหมด" || f.category === cat;
    const matchSearch = f.q.includes(search) || f.a.includes(search);
    return matchCat && matchSearch;
  });

  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <HelpCircle size={22} className="text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">ศูนย์ช่วยเหลือ</h1>
          <p className="text-sm text-gray-500 font-medium">คำถามที่พบบ่อยและการติดต่อเรา</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="ค้นหาคำถาม..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-3 mb-5">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              cat === c ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* FAQ Accordion */}
      <div className="flex flex-col gap-2 mb-8">
        {filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-8 font-medium">ไม่พบคำถามที่ตรงกัน</p>
        ) : (
          filtered.map((f, i) => {
            const id = `${i}`;
            const isOpen = openId === id;
            return (
              <div key={id} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setOpenId(isOpen ? null : id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="font-bold text-gray-900 text-sm pr-4">{f.q}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-primary" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 border-t border-gray-50">
                    <p className="text-sm text-gray-600 leading-relaxed pt-3 font-medium">{f.a}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Contact Section */}
      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
        <h2 className="font-black text-gray-900 mb-4">ยังต้องการความช่วยเหลือ?</h2>
        <div className="flex flex-col gap-3">
          <a
            href="https://line.me/ti/g/raredrop"
            className="flex items-center gap-4 bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
              <MessageCircle size={22} className="text-green-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-sm">Line Official</p>
              <p className="text-xs text-gray-500">ตอบไวที่สุด • เปิด 9:00 - 21:00</p>
            </div>
            <ChevronDown size={16} className="text-gray-400 -rotate-90 group-hover:text-primary transition-colors" />
          </a>
          <a
            href="mailto:support@raredrop.th"
            className="flex items-center gap-4 bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <Mail size={22} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-sm">อีเมล</p>
              <p className="text-xs text-gray-500">support@raredrop.th • ตอบภายใน 24 ชม.</p>
            </div>
            <ChevronDown size={16} className="text-gray-400 -rotate-90 group-hover:text-primary transition-colors" />
          </a>
          <a
            href="tel:02-xxx-xxxx"
            className="flex items-center gap-4 bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
              <Phone size={22} className="text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-sm">โทรศัพท์</p>
              <p className="text-xs text-gray-500">02-xxx-xxxx • จ-ศ 09:00 - 18:00</p>
            </div>
            <ChevronDown size={16} className="text-gray-400 -rotate-90 group-hover:text-primary transition-colors" />
          </a>
        </div>
      </div>
    </div>
  );
}
