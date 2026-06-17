"use client";

import { useState, useEffect } from "react";
import { HelpCircle, ChevronDown, MessageCircle, Mail, Phone, Search } from "lucide-react";

interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category: string;
}

export default function HelpPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("ทั้งหมด");

  useEffect(() => {
    fetch("/api/faqs")
      .then((r) => r.json())
      .then((d) => setFaqs(Array.isArray(d) ? d : []))
      .catch(() => setFaqs([]));
  }, []);

  const categories = ["ทั้งหมด", ...Array.from(new Set(faqs.map((f) => f.category)))];

  const filtered = faqs.filter((f) => {
    const matchCat = cat === "ทั้งหมด" || f.category === cat;
    const matchSearch = f.question.includes(search) || f.answer.includes(search);
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
        {categories.map((c) => (
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
          filtered.map((f) => {
            const isOpen = openId === f._id;
            return (
              <div key={f._id} className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setOpenId(isOpen ? null : f._id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="font-bold text-gray-900 text-sm pr-4">{f.question}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-primary" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 border-t border-gray-50">
                    <p className="text-sm text-gray-600 leading-relaxed pt-3 font-medium">{f.answer}</p>
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
