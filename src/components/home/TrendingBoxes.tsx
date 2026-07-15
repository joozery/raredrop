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

export default function TrendingBoxes() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBoxes = async () => {
      setLoading(true);
      try {
        // ดึงเฉพาะกล่องที่แอดมินติ๊ก "แนะนำ" — ถ้ายังไม่มีเลยค่อย fallback เป็นกล่องทั้งหมด กัน section ว่าง
        const res = await fetch(`/api/boxes?featured=true&limit=10`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setBoxes(data);
        } else {
          const resAll = await fetch(`/api/boxes?limit=10`);
          const all = await resAll.json();
          setBoxes(Array.isArray(all) ? all : []);
        }
      } catch {
        setBoxes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBoxes();
  }, []);

  const tagFor = (box: Box) => (box.isFeatured ? "ฮิตสุด" : "");

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          กล่องสุ่มแนะนำ <Flame className="text-orange-500 fill-orange-500" size={20} />
        </h2>
        <Link href="/boxes" className="text-xs text-gray-400 hover:text-primary transition-colors font-medium">
          ดูทั้งหมด →
        </Link>
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
      ) : boxes.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-8">สินค้าหมดแล้ว</p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-1">
          {boxes.map((box) => {
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
