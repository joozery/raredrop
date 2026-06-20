"use client";

import { useState, useEffect } from "react";
import { HelpCircle, ChevronDown, Mail, Phone, Search } from "lucide-react";

interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category: string;
}

interface ContactSettings {
  help_line_url?: string;
  help_email?: string;
  help_phone?: string;
  help_facebook_url?: string;
  discord_invite_url?: string;
}

export default function HelpPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("ทั้งหมด");
  const [contact, setContact] = useState<ContactSettings>({});

  useEffect(() => {
    fetch("/api/public-settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setContact(d || {}))
      .catch(() => {});
  }, []);

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
      {(() => {
        const channels = [
          {
            key: "line",
            href: contact.help_line_url,
            label: "LINE",
            sub: "ตอบไวที่สุด",
            bg: "bg-green-100",
            icon: <img src="/banner/cover/line.svg" alt="LINE" className="w-6 h-6" />,
          },
          {
            key: "facebook",
            href: contact.help_facebook_url,
            label: "Facebook",
            sub: "ส่งข้อความหาเราได้เลย",
            bg: "bg-blue-100",
            icon: <img src="/banner/cover/facebook.svg" alt="Facebook" className="w-6 h-6" />,
          },
          {
            key: "discord",
            href: contact.discord_invite_url,
            label: "Discord",
            sub: "พูดคุยกับทีมงานและชุมชน",
            bg: "bg-indigo-100",
            icon: <img src="/banner/cover/discord.svg" alt="Discord" className="w-6 h-6" />,
          },
          {
            key: "email",
            href: contact.help_email ? `mailto:${contact.help_email}` : undefined,
            label: "อีเมล",
            sub: contact.help_email,
            bg: "bg-amber-100",
            icon: <Mail size={22} className="text-amber-600" />,
          },
          {
            key: "phone",
            href: contact.help_phone ? `tel:${contact.help_phone}` : undefined,
            label: "โทรศัพท์",
            sub: contact.help_phone,
            bg: "bg-purple-100",
            icon: <Phone size={22} className="text-purple-600" />,
          },
        ].filter((c) => !!c.href);

        if (channels.length === 0) return null;

        return (
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
            <h2 className="font-black text-gray-900 mb-4">ยังต้องการความช่วยเหลือ?</h2>
            <div className="flex flex-col gap-3">
              {channels.map((c) => (
                <a
                  key={c.key}
                  href={c.href}
                  target={c.key === "email" || c.key === "phone" ? undefined : "_blank"}
                  rel={c.key === "email" || c.key === "phone" ? undefined : "noopener noreferrer"}
                  className="flex items-center gap-4 bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className={`w-11 h-11 ${c.bg} rounded-xl flex items-center justify-center shrink-0`}>
                    {c.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm">{c.label}</p>
                    {c.sub && <p className="text-xs text-gray-500">{c.sub}</p>}
                  </div>
                  <ChevronDown size={16} className="text-gray-400 -rotate-90 group-hover:text-primary transition-colors" />
                </a>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
