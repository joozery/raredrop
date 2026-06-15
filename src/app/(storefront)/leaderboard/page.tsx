"use client";

import { useState, useEffect } from "react";
import { Users, Trophy, Package, Crown } from "lucide-react";

interface LeaderSpent {
  userId: string;
  name: string;
  avatar?: string;
  totalSpent: number;
  openCount: number;
}

interface LeaderItems {
  userId: string;
  name: string;
  avatar?: string;
  itemCount: number;
}

const MEDAL = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const [tab, setTab] = useState<"spent" | "items">("spent");
  const [spentData, setSpentData] = useState<LeaderSpent[]>([]);
  const [itemsData, setItemsData] = useState<LeaderItems[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/leaderboard?type=spent").then((r) => r.json()),
      fetch("/api/leaderboard?type=items").then((r) => r.json()),
    ])
      .then(([s, i]) => {
        setSpentData(Array.isArray(s) ? s : []);
        setItemsData(Array.isArray(i) ? i : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const currentData = tab === "spent" ? spentData : itemsData;

  const renderValue = (item: any, rank: number) => {
    if (tab === "spent") {
      return (
        <div className="text-right">
          <p className="font-black text-primary text-sm">฿{item.totalSpent?.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400">{item.openCount} กล่อง</p>
        </div>
      );
    }
    return (
      <div className="text-right">
        <p className="font-black text-primary text-sm">{item.itemCount?.toLocaleString()}</p>
        <p className="text-[10px] text-gray-400">ไอเท็ม</p>
      </div>
    );
  };

  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
          <Crown size={22} className="text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">อันดับผู้เล่น</h1>
          <p className="text-sm text-gray-500 font-medium">ผู้เล่นยอดเยี่ยมประจำแพลตฟอร์ม</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("spent")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
            tab === "spent" ? "bg-primary text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600"
          }`}
        >
          <Trophy size={15} /> ยอดเปิดกล่อง
        </button>
        <button
          onClick={() => setTab("items")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
            tab === "items" ? "bg-primary text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600"
          }`}
        >
          <Package size={15} /> สะสมไอเท็ม
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 animate-pulse flex items-center gap-4">
              <div className="w-8 h-8 bg-gray-100 rounded-full shrink-0" />
              <div className="w-11 h-11 bg-gray-100 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-1/3" />
                <div className="h-2 bg-gray-100 rounded w-1/4" />
              </div>
              <div className="h-4 bg-gray-100 rounded w-16" />
            </div>
          ))}
        </div>
      ) : currentData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Users size={48} className="mb-4 opacity-30" />
          <p className="font-bold text-lg">ยังไม่มีข้อมูล</p>
          <p className="text-sm mt-1">เป็นคนแรกที่ติดอันดับ!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* Top 3 Podium */}
          {currentData.length >= 3 && (
            <div className="flex items-end justify-center gap-3 mb-4 py-4">
              {/* 2nd */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full overflow-hidden border-4 border-gray-300 shadow-md">
                  <img src={currentData[1]?.avatar || `https://api.dicebear.com/9.x/adventurer/svg?seed=${currentData[1]?.name}`} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="bg-gray-100 rounded-xl px-3 py-4 text-center min-w-[70px] h-16 flex items-center justify-center">
                  <div>
                    <p className="text-lg font-black">🥈</p>
                    <p className="text-[10px] font-bold text-gray-600 truncate max-w-[60px]">{currentData[1]?.name}</p>
                  </div>
                </div>
              </div>
              {/* 1st */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-18 h-18 rounded-full overflow-hidden border-4 border-amber-400 shadow-lg w-[72px] h-[72px]">
                  <img src={currentData[0]?.avatar || `https://api.dicebear.com/9.x/adventurer/svg?seed=${currentData[0]?.name}`} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="bg-gradient-to-b from-amber-400 to-amber-500 rounded-xl px-3 text-center min-w-[80px] h-24 flex items-center justify-center shadow-md">
                  <div>
                    <p className="text-2xl font-black">🥇</p>
                    <p className="text-[10px] font-bold text-white truncate max-w-[70px]">{currentData[0]?.name}</p>
                  </div>
                </div>
              </div>
              {/* 3rd */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full overflow-hidden border-4 border-amber-600 shadow-md">
                  <img src={currentData[2]?.avatar || `https://api.dicebear.com/9.x/adventurer/svg?seed=${currentData[2]?.name}`} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="bg-amber-100 rounded-xl px-3 py-4 text-center min-w-[70px] h-12 flex items-center justify-center">
                  <div>
                    <p className="text-lg font-black">🥉</p>
                    <p className="text-[10px] font-bold text-gray-600 truncate max-w-[60px]">{currentData[2]?.name}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Full List */}
          {currentData.map((item, i) => (
            <div
              key={item.userId}
              className={`bg-white rounded-2xl p-4 border flex items-center gap-4 transition-all ${
                i < 3 ? "border-amber-200 shadow-sm" : "border-gray-100"
              }`}
            >
              <div className={`w-8 text-center font-black text-lg shrink-0 ${i < 3 ? "" : "text-gray-400 text-sm"}`}>
                {i < 3 ? MEDAL[i] : `#${i + 1}`}
              </div>
              <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-gray-100 shrink-0">
                <img
                  src={item.avatar || `https://api.dicebear.com/9.x/adventurer/svg?seed=${item.name}`}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm truncate">{item.name}</p>
                <p className="text-[11px] text-gray-400">อันดับ #{i + 1}</p>
              </div>
              {renderValue(item, i)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
