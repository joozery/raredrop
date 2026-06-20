"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { History, Package, Copy, Check, ChevronDown, ChevronUp, ShoppingBag } from "lucide-react";

interface Purchase {
  _id: string;
  listingTitle: string;
  listingImage?: string;
  pricePaid: number;
  deliveredData: string;
  createdAt: string;
}

export default function PurchasesPage() {
  const { data: session, status } = useSession();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") { setLoading(false); return; }
    if (status !== "authenticated") return;
    fetch("/api/user/purchases")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setPurchases(d); })
      .finally(() => setLoading(false));
  }, [status]);

  const copyData = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  if (status === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-gray-400">
        <History size={60} className="opacity-20" />
        <p className="font-bold text-lg text-gray-600">กรุณาเข้าสู่ระบบก่อน</p>
        <Link href="/profile" className="bg-red-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-red-700 transition-colors text-sm">
          เข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <History size={24} className="text-red-500" /> ประวัติการซื้อ
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">รายละเอียดสินค้าที่ซื้อไว้ทั้งหมด</p>
        </div>
        <Link href="/shop" className="flex items-center gap-2 bg-red-600 text-white font-bold text-sm px-4 py-2 rounded-xl hover:bg-red-700 transition-colors shadow-sm">
          <ShoppingBag size={14} /> ไปร้านค้า
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
        </div>
      ) : purchases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
          <Package size={60} className="opacity-20" />
          <p className="font-bold text-lg">ยังไม่มีประวัติการซื้อ</p>
          <Link href="/shop" className="bg-red-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-red-700 transition-colors text-sm">
            ไปร้านค้า
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {purchases.map((p) => {
            const isOpen = expanded === p._id;
            return (
              <div key={p._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Header row */}
                <button
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : p._id)}
                >
                  {p.listingImage ? (
                    <img src={p.listingImage} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0 border border-gray-100" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                      <Package size={24} className="text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 truncate">{p.listingTitle}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(p.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-black text-red-600 text-sm">฿{p.pricePaid.toLocaleString()}</span>
                    {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </button>

                {/* Account data */}
                {isOpen && (
                  <div className="border-t border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-gray-500">รายละเอียดสินค้า</p>
                      <button
                        onClick={() => copyData(p._id, p.deliveredData)}
                        className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
                      >
                        {copied === p._id ? <Check size={13} /> : <Copy size={13} />}
                        {copied === p._id ? "คัดลอกแล้ว!" : "คัดลอกทั้งหมด"}
                      </button>
                    </div>
                    <pre className="bg-gray-50 rounded-xl p-4 text-xs text-gray-700 font-mono whitespace-pre-wrap leading-relaxed border border-gray-100 select-all">
                      {p.deliveredData}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
