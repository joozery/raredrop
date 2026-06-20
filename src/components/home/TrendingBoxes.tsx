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
          กล่องสุดฮิต <Flame className="text-orange-500 fill-orange-500" size={20} />
        </h2>
      </div>

      <div className="relative group">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-3 pr-8 -mx-2 px-2">
          <button
            onClick={() => setSelectedCat(null)}
            className={`text-[11px] font-bold px-4 py-1.5 rounded-lg whitespace-nowrap shadow-sm shrink-0 transition-colors ${
              !selectedCat ? "bg-[#DC2626] text-white" : "bg-white text-gray-800 border border-gray-200/80 hover:bg-gray-50"
            }`}
          >
            ทั้งหมด
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCat(selectedCat === cat._id ? null : cat._id)}
              className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${
                selectedCat === cat._id
                  ? "bg-[#DC2626] text-white border border-[#DC2626]"
                  : "bg-white text-gray-800 border border-gray-200/80 hover:bg-gray-50"
              }`}
            >
              {cat.image && (
                <img src={cat.image} alt="" className="w-4 h-4 rounded-full object-cover shrink-0" />
              )}
              {cat.name}
            </button>
          ))}
        </div>

        <div className="absolute right-0 top-0 bottom-3 w-16 bg-gradient-to-l from-[#F8F8F8] via-[#F8F8F8]/80 to-transparent pointer-events-none flex items-center justify-end pr-1">
          <div className="w-7 h-7 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-sm text-gray-500">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
          </div>
        </div>
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
        <p className="text-center text-gray-400 text-sm py-8">ยังไม่มีกล่องในหมวดนี้</p>
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
                {tag && (
                  <span className="absolute top-2 left-2 z-10 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    {tag}
                  </span>
                )}
                <div className="w-full aspect-square rounded-lg flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-105 overflow-hidden bg-gray-50">
                  <img
                    src={box.image}
                    alt={box.name}
                    className="w-full h-full object-cover mix-blend-multiply opacity-90"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/product/pokemon.webp"; }}
                  />
                </div>
                <h3 className="font-bold text-gray-900 text-[13px] text-center leading-tight mb-1">{box.name}</h3>
                <p className="text-gray-500 text-[11px] mb-3 text-center">
                  เริ่มต้น <span className="text-primary font-bold text-sm">฿{box.price.toLocaleString()}</span>
                </p>
                <button className="mt-auto w-full bg-primary text-white font-bold py-2 rounded-lg text-xs transition-transform active:scale-95 shadow-sm">
                  เปิดกล่อง
                </button>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
