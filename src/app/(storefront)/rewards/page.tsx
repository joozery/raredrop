"use client";

import { useState } from "react";
import { Trophy, Gift, CheckCircle2, Clock, Star, Zap, Package, ShoppingBag, Users, Lock } from "lucide-react";
import { useSession } from "next-auth/react";

interface Mission {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  reward: number;
  progress: number;
  total: number;
  type: "daily" | "weekly" | "special";
  completed: boolean;
}

const MISSIONS: Mission[] = [
  // Daily
  { id: "d1", title: "เปิดกล่องวันนี้", description: "เปิดกล่องสุ่มอย่างน้อย 1 กล่อง", icon: <Package size={20} />, reward: 20, progress: 0, total: 1, type: "daily", completed: false },
  { id: "d2", title: "เข้าสู่ระบบ", description: "เข้าสู่ระบบประจำวัน", icon: <CheckCircle2 size={20} />, reward: 10, progress: 1, total: 1, type: "daily", completed: true },
  { id: "d3", title: "แชร์ผลลัพธ์", description: "แชร์ผลการเปิดกล่องในโซเชียล", icon: <Star size={20} />, reward: 15, progress: 0, total: 1, type: "daily", completed: false },
  // Weekly
  { id: "w1", title: "นักสะสมสัปดาห์", description: "เปิดกล่องสะสมให้ครบ 10 ครั้ง", icon: <Zap size={20} />, reward: 100, progress: 3, total: 10, type: "weekly", completed: false },
  { id: "w2", title: "เจ้าของตลาด", description: "ลิสต์ขายสินค้าในตลาด 3 ชิ้น", icon: <ShoppingBag size={20} />, reward: 80, progress: 1, total: 3, type: "weekly", completed: false },
  { id: "w3", title: "ชวนเพื่อน", description: "ชวนเพื่อนสมัครสมาชิก 1 คน", icon: <Users size={20} />, reward: 150, progress: 0, total: 1, type: "weekly", completed: false },
  // Special
  { id: "s1", title: "ครั้งแรกของฉัน", description: "เปิดกล่องสุ่มเป็นครั้งแรก", icon: <Gift size={20} />, reward: 50, progress: 0, total: 1, type: "special", completed: false },
  { id: "s2", title: "นักสะสมระดับเพชร", description: "สะสมไอเทม Legendary 5 ชิ้น", icon: <Trophy size={20} />, reward: 500, progress: 0, total: 5, type: "special", completed: false },
];

const TYPE_LABEL: Record<string, string> = { daily: "รายวัน", weekly: "รายสัปดาห์", special: "พิเศษ" };
const TYPE_COLOR: Record<string, string> = { daily: "bg-blue-50 text-blue-600", weekly: "bg-purple-50 text-purple-600", special: "bg-amber-50 text-amber-600" };

export default function RewardsPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState<"daily" | "weekly" | "special">("daily");

  const missions = MISSIONS.filter((m) => m.type === tab);
  const totalEarnable = missions.reduce((s, m) => s + (!m.completed ? m.reward : 0), 0);
  const completedCount = missions.filter((m) => m.completed).length;

  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
          <Trophy size={22} className="text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900">รางวัล & ภารกิจ</h1>
          <p className="text-sm text-gray-500 font-medium">ทำภารกิจเพื่อรับเหรียญโบนัส</p>
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-red-600 to-red-500 rounded-2xl p-5 mb-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <p className="text-sm font-bold text-red-100 mb-1">เหรียญที่รับได้วันนี้</p>
        <p className="text-4xl font-black mb-3">฿{totalEarnable}</p>
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className="text-red-200" />
          <span className="text-xs text-red-100 font-medium">สำเร็จแล้ว {completedCount}/{missions.length} ภารกิจ</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {(["daily", "weekly", "special"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === t ? "bg-primary text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600"
            }`}
          >
            {TYPE_LABEL[t]}
          </button>
        ))}
      </div>

      {/* Mission List */}
      <div className="flex flex-col gap-3">
        {missions.map((m) => {
          const pct = Math.min((m.progress / m.total) * 100, 100);
          return (
            <div
              key={m.id}
              className={`bg-white rounded-2xl p-4 border transition-all ${
                m.completed ? "border-green-200 bg-green-50/50" : "border-gray-100 shadow-sm"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${TYPE_COLOR[m.type]}`}>
                  {m.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3 className={`font-bold text-sm ${m.completed ? "text-green-700" : "text-gray-900"}`}>{m.title}</h3>
                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full shrink-0">
                      <span className="text-[10px] font-black text-amber-600">+฿{m.reward}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{m.description}</p>
                  {m.completed ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600">
                      <CheckCircle2 size={13} /> สำเร็จแล้ว!
                    </span>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-gray-400 font-medium">{m.progress}/{m.total}</span>
                        <span className="text-[11px] text-gray-400 font-medium">{pct.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {!session && (
                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400 font-medium">
                  <Lock size={12} /> เข้าสู่ระบบเพื่อรับรางวัล
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
