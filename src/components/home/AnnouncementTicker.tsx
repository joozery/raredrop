"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Megaphone, ArrowRight, Zap } from "lucide-react";

interface AnnouncementItem {
  id: string;
  text: string;
  icon?: string;
  link?: string;
  badge?: string;
}

const DEFAULT_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: "1",
    badge: "NEW GAME",
    icon: "🐝",
    text: "เปิดตัวเกมรังผึ้งมหาสมบัติ (Honeycomb Lucky Hive)! ลุ้นรับไอดี ROV Conqueror และ GemCoins สูงสุด 5,000 🪙",
    link: "/honeycomb",
  },
  {
    id: "2",
    badge: "PROMOTION",
    icon: "🎁",
    text: "โปรโมชันพิเศษ! เติม GemCoins วันนี้ รับโบนัสเพิ่มทันที 10% ทุกยอดการเติมเงินตลอดเดือนนี้",
    link: "/exchange",
  },
  {
    id: "3",
    badge: "LIVE AUCTION",
    icon: "🔨",
    text: "ประมูลไอดีเกมระดับท็อป เรียลไทม์ การันตีความปลอดภัย 100% โดยระบบ RareDrop",
    link: "/auction",
  },
  {
    id: "4",
    badge: "EVENT",
    icon: "🧧",
    text: "กิจกรรมแจกซองอั่งเปานำโชค! กดรับรางวัลฟรีได้ทุกวัน แจก GemCoins รวมกว่า 50,000 🪙",
    link: "/red-envelope",
  },
];

export default function AnnouncementTicker() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(DEFAULT_ANNOUNCEMENTS);

  useEffect(() => {
    fetch("/api/public-settings", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.announcements) {
          try {
            const parsed = typeof data.announcements === "string"
              ? JSON.parse(data.announcements)
              : data.announcements;
            if (Array.isArray(parsed) && parsed.length > 0) {
              setAnnouncements(parsed);
            }
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  if (announcements.length === 0) return null;

  // Duplicate for seamless infinite marquee loop
  const marqueeList = [...announcements, ...announcements, ...announcements];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden group" style={{ height: "44px" }}>
      <style jsx>{`
        @keyframes marqueeScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        @keyframes shimmerSlide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 0.8; transform: scale(1.15); }
        }
        @keyframes sparkFloat {
          0%   { transform: translateY(0px) rotate(0deg); opacity: 0.6; }
          50%  { transform: translateY(-6px) rotate(180deg); opacity: 1; }
          100% { transform: translateY(0px) rotate(360deg); opacity: 0.6; }
        }
        .marquee-track {
          display: flex;
          width: max-content;
          animation: marqueeScroll 40s linear infinite;
        }
        .group:hover .marquee-track {
          animation-play-state: paused;
        }
        .shimmer-bar {
          animation: shimmerSlide 3s ease-in-out infinite;
        }
        .pulse-orb {
          animation: pulseGlow 2.5s ease-in-out infinite;
        }
        .spark-1 { animation: sparkFloat 3s ease-in-out infinite; }
        .spark-2 { animation: sparkFloat 3s ease-in-out infinite 1s; }
        .spark-3 { animation: sparkFloat 3s ease-in-out infinite 2s; }
      `}</style>

      {/* === BACKGROUND: Red gradient with dark depth === */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 20%, #dc2626 50%, #b91c1c 80%, #7f1d1d 100%)",
        }}
      />

      {/* Animated shimmer sweep */}
      <div
        className="shimmer-bar absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
          width: "25%",
        }}
      />

      {/* Glowing orbs in background */}
      <div className="pulse-orb absolute left-[15%] top-1/2 -translate-y-1/2 w-16 h-16 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(251,113,133,0.35) 0%, transparent 70%)" }} />
      <div className="pulse-orb absolute right-[20%] top-1/2 -translate-y-1/2 w-20 h-20 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(239,68,68,0.25) 0%, transparent 70%)", animationDelay: "1.2s" }} />

      {/* Floating sparkle dots */}
      <div className="spark-1 absolute left-[35%] top-[6px] w-1 h-1 rounded-full bg-yellow-300/70 pointer-events-none" />
      <div className="spark-2 absolute left-[60%] top-[8px] w-1.5 h-1.5 rounded-full bg-rose-200/60 pointer-events-none" />
      <div className="spark-3 absolute left-[80%] top-[5px] w-1 h-1 rounded-full bg-amber-200/70 pointer-events-none" />

      {/* Subtle top edge highlight line */}
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, rgba(252,165,165,0.6), rgba(255,255,255,0.4), rgba(252,165,165,0.6), transparent)" }} />

      {/* Bottom edge subtle shadow line */}
      <div className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, rgba(0,0,0,0.3), transparent)" }} />

      {/* === CONTENT LAYER === */}
      <div className="relative z-10 flex items-center h-full">

        {/* Left: Megaphone Badge */}
        <div className="flex items-center shrink-0 h-full pl-3 pr-3">
          <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl px-3 py-1 shadow-lg">
            <Megaphone size={13} className="text-yellow-300 animate-bounce" />
            <span className="text-white font-black text-[11px] sm:text-xs tracking-widest uppercase">ประกาศ</span>
          </div>
        </div>

        {/* Vertical divider */}
        <div className="w-px h-5 bg-white/20 shrink-0" />

        {/* Center: Marquee Text */}
        <div className="flex-1 min-w-0 overflow-hidden px-3">
          <div className="marquee-track flex items-center gap-10">
            {marqueeList.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="flex items-center gap-2.5 shrink-0">
                {/* Badge */}
                {item.badge && (
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded-md border shrink-0 uppercase tracking-wider"
                    style={{
                      background: "rgba(255,255,255,0.15)",
                      borderColor: "rgba(255,255,255,0.25)",
                      color: "#fde68a",
                    }}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Emoji icon */}
                {item.icon && (
                  <span className="text-sm shrink-0 drop-shadow-sm">{item.icon}</span>
                )}

                {/* Text / Link */}
                {item.link ? (
                  <Link
                    href={item.link}
                    className="flex items-center gap-1.5 group/item"
                  >
                    <span className="text-xs sm:text-sm font-bold text-white/90 group-hover/item:text-white transition-colors whitespace-nowrap drop-shadow-sm">
                      {item.text}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-extrabold text-yellow-300 group-hover/item:translate-x-1 transition-transform whitespace-nowrap">
                      ดูรายละเอียด <ArrowRight size={11} />
                    </span>
                  </Link>
                ) : (
                  <span className="text-xs sm:text-sm font-bold text-white/90 whitespace-nowrap">
                    {item.text}
                  </span>
                )}

                {/* Separator */}
                <span className="text-white/30 text-base ml-2 shrink-0">✦</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Zap icon accent */}
        <div className="shrink-0 h-full pr-3 pl-2 flex items-center">
          <div className="w-px h-5 bg-white/20 mr-3" />
          <Zap size={15} className="text-yellow-300/80 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
