"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Wallet, Coins } from "lucide-react";

interface TopupEntry {
  _id: string;
  type: "topup" | "admin_adjust";
  amount: number;
  balanceAfter: number;
  description?: string;
  createdAt: string;
}

export default function TopupHistoryPage() {
  const { data: session } = useSession();
  const [history, setHistory] = useState<TopupEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) { setLoading(false); return; }
    fetch("/api/user/topup-history", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setHistory(Array.isArray(d) ? d : []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [session]);

  if (!session) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Wallet size={48} className="text-gray-200" />
        <h2 className="font-bold text-xl text-gray-700">กรุณาเข้าสู่ระบบ</h2>
        <p className="text-gray-500 text-sm">เพื่อดูประวัติการเติมเงินของคุณ</p>
        <Link href="/?login=1" className="bg-red-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-red-700 transition-colors">
          เข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-5 max-w-3xl mx-auto pb-24 lg:pb-6">
      <div className="flex items-center gap-3">
        <Wallet size={24} className="text-red-500" />
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">ประวัติการเติมเงิน</h1>
          <p className="text-sm text-gray-500 mt-0.5">รายการเติมเงินทั้งหมดของคุณ (ล่าสุด 100 รายการ)</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
        </div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
          <Coins size={60} className="opacity-20" />
          <p className="font-bold text-lg">ยังไม่มีประวัติการเติมเงิน</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {history.map((h) => (
            <div
              key={h._id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 text-emerald-600">
                <Coins size={18} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm truncate">{h.description || "เติมเงิน"}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(h.createdAt).toLocaleString("th-TH", { day: "2-digit", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="font-black text-emerald-600 text-sm">+฿{h.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">ยอดรวม ฿{h.balanceAfter.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
