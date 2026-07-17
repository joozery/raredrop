"use client";

import { useEffect, useRef, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { MediaImage } from "@/components/ui/MediaImage";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { io, type Socket } from "socket.io-client";

interface Activity {
  _id: string;
  userName: string;
  userAvatar?: string;
  title: string;
  image?: string;
  price: number;
  kind: "shop" | "box";
  createdAt: string;
}

const MAX_ITEMS = 12;
const AUTO_SLIDE_INTERVAL_MS = 2500; // ขยับทีละการ์ดทุก 2.5 วิ — เห็นชัดว่าเลื่อน ไม่ไถลเนือย ๆ

export default function RecentOrders() {
  const [items, setItems] = useState<Activity[]>([]);
  // id ของรายการที่เพิ่งมาถึงแบบ realtime — ใช้สั่ง slide-in เฉพาะการ์ดนั้น (ของโหลดครั้งแรกไม่ต้องเล่น)
  const [lastArrivedId, setLastArrivedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollerRef = useRef<HTMLDivElement>(null);
  // เลื่อนวนอัตโนมัติ: render รายการ 2 ชุดต่อกัน พอเลื่อนสุดชุดแรกก็วาร์ปกลับแบบเนียน ๆ
  const [looped, setLooped] = useState(false);

  // initial snapshot
  useEffect(() => {
    fetch("/api/recent-activity")
      .then((r) => r.json())
      .then((data) => {
        setItems(Array.isArray(data) ? data.slice(0, MAX_ITEMS) : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // realtime updates via Socket.IO
  useEffect(() => {
    const socket: Socket = io({ path: "/socket.io" });
    socket.on("activity:new", (activity: Activity) => {
      setItems((prev) => {
        if (prev.some((p) => p._id === activity._id)) return prev;
        return [activity, ...prev].slice(0, MAX_ITEMS);
      });
      setLastArrivedId(activity._id);
      // เด้งแถบกลับไปหน้าสุดให้เห็นการ์ดที่เพิ่งเข้า
      requestAnimationFrame(() => {
        scrollerRef.current?.scrollTo({ left: 0 });
      });
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  // เลื่อนอัตโนมัติทีละการ์ดเป็นจังหวะ — หยุดตอน hover/แตะ แล้วเลื่อนต่อเมื่อปล่อย
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || loading || items.length === 0) return;

    // รอบแรกยัง render ชุดเดียว — ถ้าการ์ดล้นกรอบค่อยเปิดโหมดวน (เพิ่มชุดที่ 2) แล้ว effect จะรันใหม่เอง
    if (!looped) {
      if (el.scrollWidth > el.clientWidth) setLooped(true);
      return;
    }

    let paused = false;
    const pause = () => { paused = true; };
    const resume = () => { paused = false; };
    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", resume);
    el.addEventListener("touchstart", pause, { passive: true });
    el.addEventListener("touchend", resume);

    const slideNext = () => {
      if (paused) return;
      const first = el.firstElementChild as HTMLElement | null;
      const second = first?.nextElementSibling as HTMLElement | null;
      if (!first) return;
      // ระยะ 1 สเต็ป = ความกว้างการ์ด + gap (วัดจากตำแหน่งจริง กัน gap เพี้ยนตามขนาดจอ)
      const step = second ? second.offsetLeft - first.offsetLeft : first.offsetWidth;
      const half = el.scrollWidth / 2;
      // เลยครึ่ง (ชุดที่ 1 หมด) — วาร์ปถอยกลับหนึ่งรอบก่อนแบบไม่เห็นรอยต่อ แล้วค่อยเลื่อนต่อ
      if (el.scrollLeft >= half) el.scrollLeft -= half;
      el.scrollTo({ left: el.scrollLeft + step, behavior: "smooth" });
    };

    const timer = setInterval(slideNext, AUTO_SLIDE_INTERVAL_MS);

    return () => {
      clearInterval(timer);
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("mouseleave", resume);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("touchend", resume);
    };
  }, [items, loading, looped]);

  // แสดง section ตลอดเวลา (ไม่ซ่อนตอนฟีดว่าง) — ยังฟัง realtime อยู่ รายการใหม่จะเด้งเข้ามาเอง
  return (
    <section className="w-full relative">
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2 text-[15px] sm:text-base text-gray-900">
            <ShoppingBag size={18} className="text-[#E04631]" />
            คำสั่งซื้อล่าสุด
          </h3>
        </div>

        {loading ? (
          <div className="flex gap-3 sm:gap-4 -mx-1 px-1">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 w-[170px] sm:w-[210px] shrink-0 bg-[#F8FAFC] rounded-xl p-2.5 animate-pulse">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-gray-200 shrink-0" />
                <div className="flex flex-col gap-1.5 flex-1">
                  <div className="h-2.5 bg-gray-200 rounded w-3/4" />
                  <div className="h-2.5 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400 gap-1.5">
            <ShoppingBag size={28} className="opacity-25" />
            <p className="text-xs font-medium">ยังไม่มีคำสั่งซื้อ — รายการใหม่จะขึ้นที่นี่แบบเรียลไทม์</p>
          </div>
        ) : (
        <div ref={scrollerRef} className={`flex overflow-x-auto hide-scrollbar gap-3 sm:gap-4 pb-2 -mx-1 px-1${looped ? "" : " snap-x snap-mandatory"}`}>
          {(looped ? [...items, ...items] : items).map((p, i) => {
            const timeAgo = p.createdAt
              ? formatDistanceToNow(new Date(p.createdAt), { addSuffix: true, locale: th })
                  .replace("ประมาณ ", "")
                  .replace("กว่า", "")
              : "เมื่อกี้";

            return (
              <div
                key={`${p._id}-${i}`}
                className={`flex items-center gap-3 w-[170px] sm:w-[210px] shrink-0 snap-start bg-[#F8FAFC] rounded-xl p-2.5 hover:bg-gray-50 transition-colors${
                  p._id === lastArrivedId && i < items.length ? " animate-slide-in" : ""
                }`}
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-white shrink-0 overflow-hidden shadow-sm border border-gray-100 flex items-center justify-center relative">
                  {p.image ? (
                    <MediaImage
                      src={p.image}
                      alt={p.title}
                      className="w-full h-full object-cover"
                      fallbackSrc="/product/pokemon.webp"
                    />
                  ) : (
                    <ShoppingBag size={20} className="text-gray-400" />
                  )}
                </div>
                <div className="flex flex-col flex-1 min-w-0">

                  <span className="text-[11px] sm:text-xs font-bold text-gray-900 truncate">{p.title}</span>
                  {p.price > 0 && (
                    <span className="text-[12px] sm:text-sm font-bold text-[#E04631]">฿{p.price?.toLocaleString()}</span>
                  )}
                  <span className="text-[9px] sm:text-[10px] text-gray-500 truncate mt-0.5">{timeAgo}</span>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </section>
  );
}
