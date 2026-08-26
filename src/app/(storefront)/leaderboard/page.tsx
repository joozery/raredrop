"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Trophy, Crown, Medal, RefreshCw, Wallet } from "lucide-react";

interface LeaderEntry {
  userId: string;
  name: string;
  avatar?: string;
  totalTopup: number;
  count: number;
}

const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

const RANK_STYLE = [
  { bg: "bg-gradient-to-br from-yellow-400 to-amber-500", text: "text-yellow-700", badge: "bg-yellow-400", shadow: "shadow-yellow-200" },
  { bg: "bg-gradient-to-br from-slate-300 to-slate-400", text: "text-slate-600", badge: "bg-slate-300", shadow: "shadow-slate-200" },
  { bg: "bg-gradient-to-br from-orange-300 to-orange-400", text: "text-orange-700", badge: "bg-orange-300", shadow: "shadow-orange-200" },
];

function Avatar({ name, avatar, size = 48 }: { name: string; avatar?: string; size?: number }) {
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-gradient-to-br from-red-400 to-rose-600 flex items-center justify-center text-white font-black"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
  );
}

export default function LeaderboardPage() {
  const { data: session } = useSession();
  const meId = (session?.user as any)?.id as string | undefined;

  const [data, setData] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?type=topup&period=month`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const myRank = meId ? data.findIndex((d) => d.userId === meId) + 1 : 0;
  const top3 = data.slice(0, 3);
  const rest = data.slice(3, 10);

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Trophy size={24} className="text-amber-500" /> ผู้ที่มียอดเติมเงินสูงสุด
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">ประจำเดือน{THAI_MONTHS[new Date().getMonth()]}</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="w-9 h-9 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 shadow-sm"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
          <Trophy size={56} className="opacity-20" />
          <p className="font-bold text-lg">ยังไม่มีข้อมูล</p>
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {top3.length > 0 && (
            <div className="flex items-end justify-center gap-3 pt-4 pb-2">
              {/* 2nd */}
              {top3[1] && (
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className={`relative ${top3[1].userId === meId ? "ring-2 ring-red-500 ring-offset-2 rounded-full" : ""}`}>
                    <Avatar name={top3[1].name} avatar={top3[1].avatar} size={56} />
                    <span className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-slate-300 flex items-center justify-center text-[11px] font-black text-white shadow">2</span>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-gray-800 line-clamp-1 max-w-[80px]">{top3[1].name}</p>
                    <p className="text-xs font-black text-gray-600">฿{top3[1].totalTopup.toLocaleString()}</p>
                  </div>
                  <div className="w-full bg-slate-200 rounded-t-xl h-16 flex items-center justify-center">
                    <Medal size={22} className="text-slate-400" />
                  </div>
                </div>
              )}

              {/* 1st */}
              {top3[0] && (
                <div className="flex flex-col items-center gap-2 flex-1">
                  <Crown size={20} className="text-amber-500" />
                  <div className={`relative ${top3[0].userId === meId ? "ring-2 ring-red-500 ring-offset-2 rounded-full" : ""}`}>
                    <Avatar name={top3[0].name} avatar={top3[0].avatar} size={68} />
                    <span className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-[12px] font-black text-white shadow-md">1</span>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-gray-800 line-clamp-1 max-w-[90px]">{top3[0].name}</p>
                    <p className="text-sm font-black text-amber-600">฿{top3[0].totalTopup.toLocaleString()}</p>
                  </div>
                  <div className="w-full bg-gradient-to-b from-amber-400 to-yellow-500 rounded-t-xl h-24 flex items-center justify-center shadow-lg shadow-yellow-200">
                    <Crown size={26} className="text-white" />
                  </div>
                </div>
              )}

              {/* 3rd */}
              {top3[2] && (
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div className={`relative ${top3[2].userId === meId ? "ring-2 ring-red-500 ring-offset-2 rounded-full" : ""}`}>
                    <Avatar name={top3[2].name} avatar={top3[2].avatar} size={52} />
                    <span className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-gradient-to-br from-orange-300 to-orange-400 flex items-center justify-center text-[11px] font-black text-white shadow">3</span>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-gray-800 line-clamp-1 max-w-[80px]">{top3[2].name}</p>
                    <p className="text-xs font-black text-gray-600">฿{top3[2].totalTopup.toLocaleString()}</p>
                  </div>
                  <div className="w-full bg-orange-200 rounded-t-xl h-10 flex items-center justify-center">
                    <Medal size={18} className="text-orange-400" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* My rank callout (if not in top 50 visible area) */}
          {myRank > 0 && myRank > 3 && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-xs font-bold text-red-400">อันดับของคุณ</span>
              <span className="font-black text-red-600 text-lg ml-auto">#{myRank}</span>
              <span className="text-sm font-black text-red-700">
                ฿{data[myRank - 1]?.totalTopup.toLocaleString()}
              </span>
            </div>
          )}

          {/* Rank list 4+ */}
          {rest.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {rest.map((entry, i) => {
                const rank = i + 4;
                const isMe = entry.userId === meId;
                return (
                  <div
                    key={entry.userId}
                    className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 transition-colors ${isMe ? "bg-red-50" : "hover:bg-gray-50"}`}
                  >
                    <span className="w-7 text-center text-sm font-black text-gray-400">{rank}</span>
                    <Avatar name={entry.name} avatar={entry.avatar} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${isMe ? "text-red-700" : "text-gray-800"}`}>
                        {entry.name}
                        {isMe && <span className="ml-1.5 text-[10px] bg-red-100 text-red-500 font-black px-1.5 py-0.5 rounded-full">คุณ</span>}
                      </p>
                      <p className="text-[11px] text-gray-400">{entry.count} ครั้ง</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Wallet size={13} className="text-emerald-500" />
                      <span className="font-black text-sm text-gray-800">฿{entry.totalTopup.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
