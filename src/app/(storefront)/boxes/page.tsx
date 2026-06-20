"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Package, Flame, Filter } from "lucide-react";

interface Box {
  _id: string;
  name: string;
  description?: string;
  image: string;
  price: number;
  isFeatured: boolean;
  categoryId?: { _id: string; name: string };
}

interface CategoryOption {
  _id: string;
  name: string;
  image?: string;
}

const ALL_CAT = "ทั้งหมด";

export default function BoxesPage() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState(ALL_CAT);

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

  const filtered = boxes.filter((b) => {
    const matchCat = selectedCat === ALL_CAT || b.categoryId?._id === selectedCat;
    const matchSearch = b.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

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

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-3 mb-6">
        {[{ _id: ALL_CAT, name: ALL_CAT, image: undefined }, ...categories].map((cat) => (
          <button
            key={cat._id}
            onClick={() => setSelectedCat(cat._id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all shrink-0 ${
              selectedCat === cat._id
                ? "bg-primary text-white shadow-sm shadow-red-500/30"
                : "bg-white border border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
            }`}
          >
            {cat.image && (
              <img src={cat.image} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
            )}
            {cat.name}
          </button>
        ))}
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
              {box.isFeatured && (
                <span className="absolute top-3 left-3 z-10 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Flame size={9} className="fill-white" /> ฮิต
                </span>
              )}
              <div className="aspect-square rounded-xl bg-gray-50 overflow-hidden mb-3">
                <img
                  src={box.image}
                  alt={box.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/product/pokemon.webp"; }}
                />
              </div>
              {box.categoryId && (
                <span className="text-[10px] font-bold text-gray-400 mb-1">{box.categoryId.name}</span>
              )}
              <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1 line-clamp-2">{box.name}</h3>
              <p className="text-gray-500 text-xs mb-3">
                เริ่มต้น <span className="text-primary font-black text-sm">฿{box.price.toLocaleString()}</span>
              </p>
              <button className="mt-auto w-full bg-primary text-white font-bold py-2.5 rounded-xl text-xs hover:bg-red-700 transition-colors active:scale-95 shadow-sm">
                เปิดกล่อง
              </button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
