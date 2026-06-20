"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { History, Package } from "lucide-react";

interface RarityData { name: string; color: string }
interface ItemData { _id: string; name: string; image: string; price: number; rarityId?: RarityData }
interface BoxData { _id: string; name: string; image: string }
interface HistoryEntry {
  _id: string;
  itemId: ItemData;
  boxId?: BoxData;
  status: "kept" | "sold" | "delivered" | "market";
  acquiredAt: string;
}

const STATUS_LABEL: Record<HistoryEntry["status"], { label: string; cls: string }> = {
  kept: { label: "อยู่ในคอลเลกชัน", cls: "bg-emerald-50 text-emerald-600" },
  sold: { label: "ขายคืนแล้ว", cls: "bg-gray-100 text-gray-500" },
  delivered: { label: "ขอรับของแล้ว", cls: "bg-blue-50 text-blue-600" },
  market: { label: "อยู่ในตลาด", cls: "bg-orange-50 text-orange-600" },
};

export default function RollHistoryPage() {
  const { data: session } = useSession();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    fetch("/api/user/roll-history", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setHistory(Array.isArray(d) ? d : []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [session]);

  if (!session) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <History size={48} className="text-gray-200" />
        <h2 className="font-bold text-xl text-gray-700">กรุณาเข้าสู่ระบบ</h2>
        <p className="text-gray-500 text-sm">เพื่อดูประวัติการสุ่มของคุณ</p>
        <Link href="/?login=1" className="bg-red-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-red-700 transition-colors">
          เข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-5 max-w-5xl mx-auto pb-24 lg:pb-6">
      <div className="flex items-center gap-3">
        <History size={24} className="text-red-500" />
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">ประวัติการสุ่ม</h1>
          <p className="text-sm text-gray-500 mt-0.5">รายการไอเทมที่ได้จากการเปิดกล่องสุ่มทั้งหมด (ล่าสุด 100 รายการ)</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
        </div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
          <Package size={60} className="opacity-20" />
          <p className="font-bold text-lg">ยังไม่มีประวัติการสุ่ม</p>
          <Link href="/boxes" className="bg-red-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-red-700 transition-colors text-sm">
            ไปเปิดกล่องสุ่ม
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {history.map((h) => {
            const rarity = h.itemId?.rarityId;
            const statusInfo = STATUS_LABEL[h.status];
            return (
              <div
                key={h._id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex items-center gap-3"
              >
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden border border-gray-100">
                  {h.itemId?.image ? (
                    <img src={h.itemId.image} alt={h.itemId.name} className="w-full h-full object-contain" />
                  ) : (
                    <Package size={20} className="text-gray-300" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-900 text-sm truncate">{h.itemId?.name || "ไอเทม"}</p>
                    {rarity && (
                      <span
                        className="text-[9px] font-black px-2 py-0.5 rounded-full shrink-0"
                        style={{ backgroundColor: `${rarity.color}20`, color: rarity.color }}
                      >
                        {rarity.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    จากกล่อง: {h.boxId?.name || "ไม่ทราบ"} · มูลค่า ฿{h.itemId?.price?.toLocaleString() ?? "-"}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusInfo.cls}`}>
                    {statusInfo.label}
                  </span>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {new Date(h.acquiredAt).toLocaleString("th-TH", { day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
