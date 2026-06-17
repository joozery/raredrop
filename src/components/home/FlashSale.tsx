"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Zap, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";

const FLASH_SALE_ITEMS = [
  {
    _id: "fs1",
    name: "Pokémon Box",
    image: "/product/pokemon.webp",
    originalPrice: 990,
    price: 490,
    discount: "-50%",
  },
  {
    _id: "fs2",
    name: "Labubu Lucky",
    image: "/product/labubu.webp",
    originalPrice: 1290,
    price: 890,
    discount: "-30%",
  },
  {
    _id: "fs3",
    name: "Anime Mystery",
    image: "/product/anime.webp",
    originalPrice: 500,
    price: 299,
    discount: "-40%",
  },
];

export default function FlashSale() {
  const [timeLeft, setTimeLeft] = useState({ hours: 1, minutes: 42, seconds: 18 });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;
        if (hours === 0 && minutes === 0 && seconds === 0) return prev;
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
          if (minutes < 0) { minutes = 59; hours--; }
        }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  return (
    <section>
      <div className="border-[3px] border-[#E04631] rounded-xl p-4 bg-white relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="text-yellow-500 fill-yellow-500" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Flash Sale</h2>
            <span className="hidden lg:inline bg-red-100 text-[#E04631] text-[10px] font-bold px-2 py-0.5 rounded-full ml-1">
              ลดสูงสุด 50%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-800">เหลือเวลา</span>
            <div className="flex items-center gap-1">
              {[{ val: timeLeft.hours, label: "ชม." }, { val: timeLeft.minutes, label: "นาที" }, { val: timeLeft.seconds, label: "วินาที" }].map((t, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="text-gray-600 font-bold -mt-3">:</span>}
                  <div className="flex flex-col items-center">
                    <div className="bg-[#E04631] text-white font-bold w-7 h-7 flex items-center justify-center rounded-md text-sm">
                      {formatNumber(t.val)}
                    </div>
                    <span className="text-[9px] text-gray-500 mt-0.5">{t.label}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile: horizontal scroll with arrows / Desktop: grid */}
        <div className="relative">
          {/* Arrow buttons — mobile only */}
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

          {/* Scroll container */}
          <div
            ref={scrollRef}
            className="flex overflow-x-auto gap-3 hide-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-4 pb-1 lg:pb-0"
          >
            {FLASH_SALE_ITEMS.map((item) => (
              <Link
                href={`/boxes/${item._id}`}
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
                    ฿{item.price.toLocaleString()}
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
      </div>
    </section>
  );
}
