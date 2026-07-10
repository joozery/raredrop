"use client";

import { useState, useEffect, useRef } from "react";
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
  startsAt: string | null;
  endsAt: string;
}

function useCountdown(target: string | null | undefined) {
  const calc = () => {
    if (!target) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    const diff = Math.max(0, new Date(target).getTime() - Date.now());
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    const t = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(t);
  }, [target]);
  return time;
}

function CardCountdown({ isUpcoming, target }: { isUpcoming: boolean; target: string }) {
  const timeLeft = useCountdown(target);
  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div className="flex items-center justify-center gap-1 mb-1.5">
      <span className={`text-[9px] font-bold ${isUpcoming ? "text-blue-600" : "text-gray-500"}`}>
        {isUpcoming ? "เริ่มใน" : "เหลือ"}
      </span>
      <div className="flex items-center gap-0.5">
        {(timeLeft.days > 0
          ? [{ val: timeLeft.days, label: "ว" }, { val: timeLeft.hours, label: "ชม" }]
          : [{ val: timeLeft.hours, label: "ชม" }, { val: timeLeft.minutes, label: "น" }, { val: timeLeft.seconds, label: "วิ" }]
        ).map((t, i) => (
          <span key={i} className={`text-[9px] font-bold px-1 py-0.5 rounded ${isUpcoming ? "bg-blue-50 text-blue-600" : "bg-red-50 text-[#E04631]"}`}>
            {pad(t.val)}{t.label}
          </span>
        ))}
      </div>
    </div>
  );
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
          </div>
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
              {items.map((item) => {
                const itemUpcoming = item.startsAt ? new Date(item.startsAt) > new Date() : false;
                return (
                  <Link
                    href={`/boxes/${item.boxId}`}
                    key={item._id}
                    className="w-[30vw] shrink-0 lg:w-auto bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow relative flex flex-col group overflow-hidden"
                  >
                    <span className={`absolute top-0 left-0 z-10 text-white text-[10px] font-bold px-2 py-1.5 rounded-br-lg shadow-sm ${itemUpcoming ? "bg-blue-500" : "bg-[#E04631]"}`}>
                      {itemUpcoming ? "เร็วๆ นี้" : item.discount}
                    </span>

                    <div className={`w-full aspect-square flex items-center justify-center overflow-hidden ${itemUpcoming ? "bg-gray-100" : "bg-[#FFF9F9]"}`}>
                      <img
                        src={item.image}
                        alt={item.name}
                        className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${itemUpcoming ? "opacity-50 grayscale" : ""}`}
                        onError={(e) => { (e.target as HTMLImageElement).src = "/product/pokemon.webp"; }}
                      />
                    </div>

                    <div className="p-2 pb-2.5 flex flex-col flex-grow">
                      <h3 className="font-bold text-gray-900 text-[12px] text-center leading-tight mb-1 truncate px-1">
                        {item.name}
                      </h3>

                      <div className="flex items-center justify-center gap-1 mb-1.5">
                        <span className="text-gray-400 text-[11px] line-through font-medium">
                          ฿{item.originalPrice.toLocaleString()}
                        </span>
                        <span className={`font-bold text-[14px] ${itemUpcoming ? "text-blue-500" : "text-[#E04631]"}`}>
                          ฿{item.salePrice.toLocaleString()}
                        </span>
                      </div>

                      <CardCountdown isUpcoming={itemUpcoming} target={itemUpcoming ? item.startsAt! : item.endsAt} />

                      <button
                        className={`mt-auto w-full font-bold py-1.5 rounded-lg text-[11px] transition-transform active:scale-95 shadow-sm flex items-center justify-center gap-1 ${itemUpcoming ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-[#E04631] text-white"}`}
                        disabled={itemUpcoming}
                      >
                        <ShoppingCart size={12} />
                        {itemUpcoming ? "ยังไม่เปิดขาย" : "ซื้อเลย"}
                      </button>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
