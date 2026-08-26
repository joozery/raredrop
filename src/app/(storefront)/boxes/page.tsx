"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Package, Flame } from "lucide-react";
import { MediaImage } from "@/components/ui/MediaImage";

interface Box {
  _id: string;
  name: string;
  description?: string;
  image: string;
  price: number;
  isFeatured: boolean;
  categoryId?: { _id: string; name: string };
  isOutOfStock?: boolean;
  flashSale?: { salePrice: number; endsAt: string } | null;
  oddsTag?: string;
}

interface CategoryOption {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
}

export default function BoxesPage() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/boxes")
      .then((r) => r.json())
      .then((d) => setBoxes(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));

    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .catch(() => setCategories([]));
  }, []);

  const filtered = boxes.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
          <Package size={22} className="text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">กล่องสุ่มทั้งหมด</h1>
          <p className="text-sm text-gray-500 font-medium">เลือกกล่องที่คุณอยากลุ้น</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="ค้นหากล่องสุ่ม..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
        />
      </div>

      {/* Category Icons */}
      <div className="flex gap-3 overflow-x-auto hide-scrollbar py-2 -mx-1 px-1 mb-4">
        {/* ทั้งหมด */}
        <Link
          href="/boxes"
          className="flex flex-col items-center gap-1.5 shrink-0"
        >
          <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 ring-2 ring-[#DC2626] ring-offset-1 shadow-md overflow-hidden">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <span className="text-[10px] font-semibold text-[#DC2626] text-center leading-tight">ทั้งหมด</span>
          <span className="text-[9px] text-gray-400">({boxes.length})</span>
        </Link>

        {categories.map((cat) => {
          const count = boxes.filter((b) => b.categoryId?._id === cat._id).length;
          return (
            <Link
              key={cat._id}
              href={cat.slug ? `/boxes/${cat.slug}` : `/boxes?cat=${cat._id}`}
              className="flex flex-col items-center gap-1.5 shrink-0"
            >
              <div className="w-14 h-14 rounded-xl overflow-hidden ring-1 ring-gray-200 hover:ring-gray-300 transition-all bg-gray-100">
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/product/pokemon.webp"; }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-400 text-xs font-bold">
                    {cat.name.charAt(0)}
                  </div>
                )}
              </div>
              <span className="text-[10px] font-semibold text-gray-600 text-center leading-tight max-w-[56px] truncate">{cat.name}</span>
              <span className="text-[9px] text-gray-400">({count})</span>
            </Link>
          );
        })}
      </div>

      {/* Count */}
      {!loading && (
        <p className="text-sm text-gray-400 font-medium mb-4">
          พบ <span className="text-gray-800 font-bold">{filtered.length}</span> กล่อง
        </p>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse border border-gray-100">
              <div className="aspect-square rounded-xl bg-gray-100 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
              <div className="h-9 bg-gray-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Package size={48} className="mb-4 opacity-30" />
          <p className="font-bold text-lg">ไม่พบกล่องสุ่ม</p>
          <p className="text-sm mt-1">ลองเปลี่ยนหมวดหมู่หรือคำค้นหา</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((box) => (
            <Link
              key={box._id}
              href={`/boxes/${box._id}`}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group relative flex flex-col"
            >
              {box.isOutOfStock ? (
                <span className="absolute top-3 left-3 z-10 bg-gray-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  หมดแล้ว
                </span>
              ) : box.flashSale ? (
                <span className="absolute top-3 left-3 z-10 bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  ⚡ SALE
                </span>
              ) : box.isFeatured ? (
                <span className="absolute top-3 left-3 z-10 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                  <Flame size={9} className="fill-white" /> ฮิต
                </span>
              ) : null}
              {box.oddsTag && (
                <span className="absolute top-3 right-3 z-10 bg-black/70 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  {box.oddsTag}
                </span>
              )}
              <div className={`aspect-square rounded-xl bg-gray-50 overflow-hidden mb-3 ${box.isOutOfStock ? "grayscale opacity-60" : ""}`}>
                <MediaImage
                  src={box.image}
                  alt={box.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  fallbackSrc="/product/pokemon.webp"
                />
              </div>
              {box.categoryId && (
                <span className="text-[10px] font-bold text-gray-400 mb-1">{box.categoryId.name}</span>
              )}
              <h3 className="font-bold text-sm leading-tight mb-1 line-clamp-2 text-gray-900">{box.name}</h3>
              <p className="text-xs mb-3 text-center">
                {box.flashSale ? (
                  <>
                    <span className="line-through text-gray-400 mr-1">฿{box.price.toLocaleString()}</span>
                    <span className="text-orange-500 font-black text-sm">฿{box.flashSale.salePrice.toLocaleString()}</span>
                  </>
                ) : (
                  <><span className="text-gray-500">เริ่มต้น </span><span className="text-primary font-black text-sm">฿{box.price.toLocaleString()}</span></>
                )}
              </p>
              <button
                className={`mt-auto w-full font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm ${box.isOutOfStock ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-primary text-white hover:bg-red-700 active:scale-95"}`}
                disabled={box.isOutOfStock}
              >
                {box.isOutOfStock ? "สินค้าหมด" : "เปิดกล่อง"}
              </button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
