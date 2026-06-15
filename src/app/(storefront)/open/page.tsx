"use client";

import { useState, useEffect, useRef } from "react";
import { Zap, RefreshCw } from "lucide-react";

interface Opening {
  _id: string;
  userId: { name: string; avatar?: string };
  itemId: { name: string; image: string; price: number; rarityId?: { name: string; color: string } };
  acquiredAt: string;
}

export default function OpenPage() {
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchOpenings = async () => {
    try {
      const res = await fetch("/api/live-openings");
      const data = await res.json();
      setOpenings(Array.isArray(data) ? data : []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchOpenings();
    intervalRef.current = setInterval(fetchOpenings, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s} วิที่แล้ว`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} นาทีที่แล้ว`;
    return `${Math.floor(m / 60)} ชม.ที่แล้ว`;
  };

  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <Zap size={22} className="text-primary fill-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-gray-900">ไลฟ์เปิดกล่อง</h1>
              <span className="bg-red-100 text-primary text-[9px] font-bold px-2 py-0.5 rounded-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" /> LIVE
              </span>
            </div>
            <p className="text-sm text-gray-500 font-medium">การเปิดกล่องล่าสุดจากผู้เล่นทั่วประเทศ</p>
          </div>
        </div>
        <button
          onClick={fetchOpenings}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-primary transition-colors border border-gray-200 rounded-lg px-3 py-2"
        >
          <RefreshCw size={13} /> รีเฟรช
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
              <div className="w-14 h-14 rounded-xl bg-gray-100 shrink-0" />
            </div>
          ))}
        </div>
      ) : openings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Zap size={48} className="mb-4 opacity-30" />
          <p className="font-bold text-lg">ยังไม่มีการเปิดกล่อง</p>
          <p className="text-sm mt-1">เป็นคนแรกที่เปิดกล่องวันนี้!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {openings.map((o, i) => {
            const item = o.itemId;
            const rarity = item?.rarityId;
            return (
              <div
                key={o._id}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
                style={i === 0 ? { borderColor: rarity?.color ? `${rarity.color}40` : undefined } : {}}
              >
                {i === 0 && (
                  <span className="absolute ml-[-8px] mt-[-8px] bg-primary text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full">ล่าสุด</span>
                )}
                <div className="w-12 h-12 rounded-full bg-gray-100 shrink-0 border-2 border-white shadow-sm overflow-hidden">
                  <img
                    src={o.userId?.avatar || `https://api.dicebear.com/9.x/adventurer/svg?seed=${o.userId?.name}`}
                    alt={o.userId?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{o.userId?.name}</p>
                  <p className="text-gray-500 text-xs truncate">
                    เปิดได้{" "}
                    <span className="font-bold" style={{ color: rarity?.color || "#374151" }}>
                      {item?.name}
                    </span>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {rarity && (
                      <span
                        className="text-[9px] font-black px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${rarity.color}20`, color: rarity.color }}
                      >
                        {rarity.name}
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400">{timeAgo(o.acquiredAt)}</span>
                  </div>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-1">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
                    <img
                      src={item?.image}
                      alt={item?.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/product/pokemon.webp"; }}
                    />
                  </div>
                  <p className="text-xs font-black text-primary">฿{item?.price?.toLocaleString()}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
