"use client";

import React, { useEffect, useState } from "react";

interface Opening {
  _id: string;
  userId: { name: string; avatar?: string };
  itemId: { name: string; image: string; price: number };
}

export default function MobileLiveOpenings() {
  const [openings, setOpenings] = useState<Opening[]>([]);

  useEffect(() => {
    fetch("/api/live-openings")
      .then((r) => r.json())
      .then((data) => setOpenings(Array.isArray(data) ? data.slice(0, 6) : []))
      .catch(() => setOpenings([]));
  }, []);

  if (openings.length === 0) return null;

  return (
    <section className="block lg:hidden mt-2 mb-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold flex items-center gap-2">
          ไลฟ์เปิดกล่อง
          <span className="bg-red-100 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" /> LIVE
          </span>
        </h3>
        <button className="text-[11px] text-primary font-semibold hover:underline flex items-center gap-1">ดูทั้งหมด ›</button>
      </div>

      <div className="flex overflow-x-auto gap-3 hide-scrollbar -mx-4 px-4 pb-2">
        {openings.map((o) => (
          <div key={o._id} className="w-[130px] shrink-0 bg-white border border-gray-100 rounded-xl p-3 shadow-sm flex flex-col items-center text-center">
            <div className="flex items-center justify-center gap-2 mb-2 w-full">
              <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0 border-2 border-white shadow-sm overflow-hidden">
                <img
                  src={o.userId?.avatar || `https://api.dicebear.com/9.x/adventurer/svg?seed=${o.userId?.name}`}
                  alt={o.userId?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-md shrink-0 overflow-hidden shadow-sm border border-gray-100">
                <img
                  src={o.itemId?.image}
                  alt={o.itemId?.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/product/pokemon.webp"; }}
                />
              </div>
            </div>
            <p className="text-xs font-bold text-gray-900 truncate w-full">{o.userId?.name}</p>
            <p className="text-[9px] text-gray-500 truncate w-full mt-0.5">เปิดได้ {o.itemId?.name}</p>
            <p className="text-[10px] text-primary font-semibold mt-1">฿{o.itemId?.price?.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
