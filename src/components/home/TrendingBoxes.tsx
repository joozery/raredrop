"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Flame } from "lucide-react";

interface Box {
  _id: string;
  name: string;
  price: number;
  image: string;
  isFeatured: boolean;
  categoryId?: { _id: string; name: string };
  isOutOfStock?: boolean;
  flashSale?: { salePrice: number; endsAt: string } | null;
}

interface CategoryOption {
  _id: string;
  name: string;
  image?: string;
}

export default function TrendingBoxes() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

  useEffect(() => {
    const fetchBoxes = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/boxes?limit=10`);
        const data = await res.json();
        setBoxes(Array.isArray(data) ? data : []);
      } catch {
        setBoxes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBoxes();

    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .catch(() => setCategories([]));
  }, []);

  const filtered = selectedCat
    ? boxes.filter((b) => b.categoryId?._id === selectedCat)
    : boxes;

  const tagFor = (box: Box) => (box.isFeatured ? "ฮิตสุด" : "");

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          เลือกหมวดหมู่ <Flame className="text-orange-500 fill-orange-500" size={20} />
        </h2>
        <button className="text-xs text-gray-400 hover:text-primary transition-colors font-medium">
          ดูทั้งหมด →
        </button>
      </div>

      {/* Category icon grid */}
      <div className="flex gap-3 overflow-x-auto hide-scrollbar py-2 -mx-2 px-2 mb-4">
        {/* ทั้งหมด */}
        <button
          onClick={() => setSelectedCat(null)}
          className="flex flex-col items-center gap-1.5 shrink-0 group"
        >
          <div
            className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
              !selectedCat
                ? "ring-2 ring-[#DC2626] ring-offset-1 shadow-md"
                : "ring-1 ring-gray-200 hover:ring-gray-300"
            } bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden`}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={!selectedCat ? "#DC2626" : "#9CA3AF"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <span className={`text-[10px] font-semibold text-center leading-tight ${!selectedCat ? "text-[#DC2626]" : "text-gray-600"}`}>
            ทั้งหมด
          </span>
          <span className="text-[9px] text-gray-400">({boxes.length})</span>
        </button>

        {categories.map((cat) => {
          const count = boxes.filter((b) => b.categoryId?._id === cat._id).length;
          const isSelected = selectedCat === cat._id;
          return (
            <button
              key={cat._id}
              onClick={() => setSelectedCat(isSelected ? null : cat._id)}
              className="flex flex-col items-center gap-1.5 shrink-0 group"
            >
              <div
                className={`w-14 h-14 rounded-xl overflow-hidden transition-all ${
                  isSelected
                    ? "ring-2 ring-[#DC2626] ring-offset-1 shadow-md"
                    : "ring-1 ring-gray-200 hover:ring-gray-300"
                } bg-gray-100`}
              >
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
              <span className={`text-[10px] font-semibold text-center leading-tight max-w-[56px] truncate ${isSelected ? "text-[#DC2626]" : "text-gray-600"}`}>
                {cat.name}
              </span>
              <span className="text-[9px] text-gray-400">({count})</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm animate-pulse flex flex-col">
              <div className="w-full aspect-square rounded-lg bg-gray-100 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-3/4 mx-auto mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mx-auto mb-3" />
              <div className="h-8 bg-gray-100 rounded-lg w-full mt-auto" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-8">สินค้าหมดแล้ว</p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-1">
          {filtered.map((box) => {
            const tag = tagFor(box);
            return (
              <Link
                href={`/boxes/${box._id}`}
                key={box._id}
                className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow group relative cursor-pointer flex flex-col"
              >
                {box.isOutOfStock ? (
                  <span className="absolute top-2 left-2 z-10 bg-gray-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    หมดแล้ว
                  </span>
                ) : box.flashSale ? (
                  <span className="absolute top-2 left-2 z-10 bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                    ⚡ SALE
                  </span>
                ) : tag ? (
                  <span className="absolute top-2 left-2 z-10 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    {tag}
                  </span>
                ) : null}
                <div className={`w-full aspect-square rounded-lg flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-105 overflow-hidden bg-gray-50 ${box.isOutOfStock ? "grayscale opacity-60" : ""}`}>
                  <img
                    src={box.image}
                    alt={box.name}
                    className="w-full h-full object-cover mix-blend-multiply opacity-90"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/product/pokemon.webp"; }}
                  />
                </div>
                <h3 className="font-bold text-gray-900 text-[13px] text-center leading-tight mb-1">{box.name}</h3>
                <p className="text-gray-500 text-[11px] mb-3 text-center">
                  {box.flashSale ? (
                    <>
                      <span className="line-through text-gray-400 mr-1">฿{box.price.toLocaleString()}</span>
                      <span className="text-orange-500 font-bold text-sm">฿{box.flashSale.salePrice.toLocaleString()}</span>
                    </>
                  ) : (
                    <>เริ่มต้น <span className="text-primary font-bold text-sm">฿{box.price.toLocaleString()}</span></>
                  )}
                </p>
                <button className={`mt-auto w-full font-bold py-2 rounded-lg text-xs transition-transform shadow-sm ${box.isOutOfStock ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-primary text-white active:scale-95"}`} disabled={box.isOutOfStock}>
                  {box.isOutOfStock ? "สินค้าหมด" : "เปิดกล่อง"}
                </button>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
