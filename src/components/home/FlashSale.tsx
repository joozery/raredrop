"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Zap, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";

interface FlashSaleItem {
  _id: string;
  boxId: string;
  name: string;
  image: string;
  originalPrice: number;
  salePrice: number;
  discount: string;
  endsAt: string;
}

function useCountdown(endsAt: string | undefined) {
  const calc = () => {
    if (!endsAt) return { hours: 0, minutes: 0, seconds: 0 };
    const diff = Math.max(0, new Date(endsAt).getTime() - Date.now());
    return {
      hours: Math.floor(diff / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const t = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(t);
  }, [endsAt]);
  return time;
}

export default function FlashSale() {
  const [items, setItems] = useState<FlashSaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/flash-sale")
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const firstEndsAt = items[0]?.endsAt;
  const timeLeft = useCountdown(firstEndsAt);
  const pad = (n: number) => n.toString().padStart(2, "0");

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  if (!loading && items.length === 0) return null;

  return (
    <section>
      <div className="rounded-xl p-4 bg-white relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="text-yellow-500 fill-yellow-500" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Flash Sale</h2>
            <span className="hidden lg:inline bg-red-100 text-[#E04631] text-[10px] font-bold px-2 py-0.5 rounded-full ml-1">
              ลดสูงสุด 50%
            </span>
          </div>

          {firstEndsAt && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-800">เหลือเวลา</span>
              <div className="flex items-center gap-1">
                {[{ val: timeLeft.hours, label: "ชม." }, { val: timeLeft.minutes, label: "นาที" }, { val: timeLeft.seconds, label: "วินาที" }].map((t, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span className="text-gray-600 font-bold -mt-3">:</span>}
                    <div className="flex flex-col items-center">
                      <div className="bg-[#E04631] text-white font-bold w-7 h-7 flex items-center justify-center rounded-md text-sm">
                        {pad(t.val)}
                      </div>
                      <span className="text-[9px] text-gray-500 mt-0.5">{t.label}</span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Items */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-gray-100 animate-pulse h-48" />
            ))}
          </div>
        ) : (
          <div className="relative">
            <button
              onClick={() => scroll("left")}
              className="lg:hidden absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center text-gray-600 active:scale-95 transition-transform"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scroll("right")}
              className="lg:hidden absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white border border-gray-200 rounded-full shadow-md flex items-center justify-center text-gray-600 active:scale-95 transition-transform"
            >
              <ChevronRight size={16} />
            </button>

            <div
              ref={scrollRef}
              className="flex overflow-x-auto gap-3 hide-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-4 pb-1 lg:pb-0"
            >
              {items.map((item) => (
                <Link
                  href={`/boxes/${item.boxId}`}
                  key={item._id}
                  className="w-[45vw] shrink-0 lg:w-auto bg-white border border-gray-100 rounded-xl p-2 pb-2.5 shadow-sm hover:shadow-md transition-shadow relative flex flex-col group"
                >
                  <span className="absolute top-2 left-2 z-10 bg-[#E04631] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-lg rounded-tl-lg shadow-sm">
                    {item.discount}
                  </span>

                  <div className="w-full h-36 rounded-lg flex items-center justify-center mb-2 overflow-hidden bg-[#FFF9F9]">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/product/pokemon.webp"; }}
                    />
                  </div>

                  <h3 className="font-bold text-gray-900 text-[12px] text-center leading-tight mb-1 truncate px-1">
                    {item.name}
                  </h3>

                  <div className="flex items-center justify-center gap-1 mb-1.5">
                    <span className="text-gray-400 text-[11px] line-through font-medium">
                      ฿{item.originalPrice.toLocaleString()}
                    </span>
                    <span className="text-[#E04631] font-bold text-[14px]">
                      ฿{item.salePrice.toLocaleString()}
                    </span>
                  </div>

                  <button className="mt-auto w-full bg-[#E04631] text-white font-bold py-1.5 rounded-lg text-[11px] transition-transform active:scale-95 shadow-sm flex items-center justify-center gap-1">
                    <ShoppingCart size={12} />
                    ซื้อเลย
                  </button>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
