"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, ChevronRight, Package } from "lucide-react";

interface ShopItem {
  _id: string;
  title: string;
  images: string[];
  price: number;
  stock: number;
}

export default function ShopPreview() {
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/shop")
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d.slice(0, 4) : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && items.length === 0) return null;

  return (
    <section>
      <div className="rounded-xl p-4 bg-white relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-[#E04631]" size={22} />
            <h2 className="text-xl font-bold text-gray-900">ร้านค้า</h2>
            <span className="bg-red-100 text-[#E04631] text-[10px] font-bold px-2 py-0.5 rounded-full ml-1">
              ID เกมมือ 1
            </span>
          </div>
          <Link
            href="/shop"
            className="flex items-center gap-1 text-xs font-bold text-[#E04631] hover:text-red-700 transition-colors"
          >
            ดูทั้งหมด <ChevronRight size={14} />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white border border-gray-100 rounded-xl p-2 pb-3 shadow-sm animate-pulse flex flex-col">
                  <div className="w-full aspect-square rounded-lg bg-gray-100 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-3/4 mx-auto mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2 mx-auto mb-2" />
                  <div className="h-7 bg-gray-100 rounded-lg mt-auto" />
                </div>
              ))
            : items.map((item) => (
                <Link
                  key={item._id}
                  href="/shop"
                  className="bg-white border border-gray-100 rounded-xl p-2 pb-3 shadow-sm hover:shadow-md transition-shadow relative flex flex-col group"
                >
                  {item.stock <= 3 && item.stock > 0 && (
                    <span className="absolute top-2 left-2 z-10 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-br-lg rounded-tl-lg shadow-sm">
                      เหลือ {item.stock}
                    </span>
                  )}
                  {item.stock === 0 && (
                    <span className="absolute top-2 left-2 z-10 bg-gray-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-br-lg rounded-tl-lg shadow-sm">
                      หมดแล้ว
                    </span>
                  )}

                  <div className="w-full h-28 lg:h-24 rounded-lg flex items-center justify-center mb-2 overflow-hidden bg-[#FFF9F9]">
                    {item.images?.[0] ? (
                      <img
                        src={item.images[0]}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <Package size={36} className="text-gray-200" />
                    )}
                  </div>

                  <h3 className="font-bold text-gray-900 text-[12px] text-center leading-tight mb-1 line-clamp-2 px-1">
                    {item.title}
                  </h3>

                  <p className="text-[#E04631] font-black text-[15px] text-center mb-2">
                    ฿{item.price.toLocaleString()}
                  </p>

                  <button
                    className="mt-auto w-full bg-[#E04631] text-white font-bold py-1.5 rounded-lg text-[12px] transition-all active:scale-95 shadow-sm flex items-center justify-center gap-1 group-hover:bg-red-700"
                    tabIndex={-1}
                  >
                    <ShoppingBag size={13} />
                    ซื้อเลย
                  </button>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}
