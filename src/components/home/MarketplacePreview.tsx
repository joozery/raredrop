"use client";

import React, { useEffect, useState } from "react";

interface MarketItem {
  _id: string;
  price: number;
  itemId: {
    _id: string;
    name: string;
    image: string;
    price: number;
    rarityId?: { name: string; color: string };
  };
}

export default function MarketplacePreview() {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const res = await fetch("/api/user/market?sort=newest");
        const data = await res.json();
        setItems(Array.isArray(data) ? data.slice(0, 5) : []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">ไอเท็มน่าสนใจในตลาด</h2>
        <a href="/marketplace" className="text-[11px] text-primary font-semibold hover:underline flex items-center gap-1">
          ดูทั้งหมด ›
        </a>
      </div>

      <div className="flex overflow-x-auto lg:grid lg:grid-cols-5 gap-3 hide-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0 pb-2 lg:pb-0">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-[140px] shrink-0 lg:w-auto bg-white border border-gray-100 rounded-xl p-3 shadow-sm animate-pulse flex flex-col">
                <div className="w-full aspect-square rounded-lg bg-gray-100 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))
          : items.length === 0
          ? (
            <p className="text-gray-400 text-sm py-4 col-span-5">ยังไม่มีไอเท็มในตลาด</p>
          )
          : items.map((order) => {
              const item = order.itemId;
              if (!item) return null;
              return (
                <a
                  key={order._id}
                  href={`/marketplace`}
                  className="w-[140px] shrink-0 lg:w-auto bg-white border border-gray-100 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col relative"
                >
                  {item.rarityId && (
                    <span
                      className="absolute top-2 left-2 z-10 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm"
                      style={{ backgroundColor: item.rarityId.color || "#DC2626" }}
                    >
                      {item.rarityId.name}
                    </span>
                  )}
                  <div className="w-full aspect-square rounded-lg flex items-center justify-center mb-3 overflow-hidden bg-gray-50">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover mix-blend-multiply opacity-90 transition-transform duration-300 hover:scale-105"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/product/pokemon.webp"; }}
                    />
                  </div>
                  <h3 className="font-bold text-gray-900 text-xs line-clamp-1">{item.name}</h3>
                  <p className="text-[9px] text-gray-400 mt-1">ราคาเริ่มต้น</p>
                  <div className="mt-0.5 flex items-end justify-between">
                    <span className="font-bold text-gray-900 text-sm">฿{order.price.toLocaleString()}</span>
                  </div>
                </a>
              );
            })}
      </div>
    </section>
  );
}
