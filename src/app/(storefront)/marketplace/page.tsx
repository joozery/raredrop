"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Search, Package, AlertCircle, Store, RefreshCw, SlidersHorizontal, X,
  ShoppingCart, TrendingUp, Tag,
} from "lucide-react";
import { TopupModal } from "@/components/payment/TopupModal";

interface RarityData { name: string; color: string; order: number }
interface ItemData { _id: string; name: string; image: string; price: number; rarityId: RarityData }
interface SellerData { _id: string; name: string; avatar?: string }
interface OrderData {
  _id: string; sellerId: SellerData; itemId: ItemData;
  price: number; status: string; createdAt: string;
}

export default function MarketplacePage() {
  const { data: session, update: updateSession } = useSession();
  const balance = (session?.user as any)?.coins || 0;

  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [filterRarity, setFilterRarity] = useState("");

  const [buyModal, setBuyModal] = useState<OrderData | null>(null);
  const [isBuying, setIsBuying] = useState(false);
  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort });
      if (search) params.set("search", search);
      const res = await fetch(`/api/user/market?${params}`);
      if (res.ok) setOrders(await res.json());
    } finally {
      setLoading(false);
    }
  }, [sort, search]);

  useEffect(() => {
    const t = setTimeout(fetchOrders, 300);
    return () => clearTimeout(t);
  }, [fetchOrders]);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleBuy = async () => {
    if (!buyModal || isBuying) return;
    if (!session) { showToast("กรุณาเข้าสู่ระบบก่อน", false); return; }
    setIsBuying(true);
    try {
      const res = await fetch(`/api/user/market/${buyModal._id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "เกิดข้อผิดพลาด", false); return; }
      showToast(`ซื้อสำเร็จ! เหลือ ฿${data.coinsLeft?.toLocaleString()}`);
      setBuyModal(null);
      await updateSession();
      fetchOrders();
    } finally {
      setIsBuying(false);
    }
  };

  const rarities = [...new Set(orders.map((o) => o.itemId?.rarityId?.name).filter(Boolean))];
  const filtered = filterRarity ? orders.filter((o) => o.itemId?.rarityId?.name === filterRarity) : orders;

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Store size={24} className="text-red-500" /> ตลาดซื้อขาย
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">ซื้อขายไอเทมระหว่างผู้เล่น (Marketplace)</p>
        </div>
        <div className="flex items-center gap-3">
          {session && (
            <div className="bg-gray-900 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm">
              <span className="font-sans">฿</span> {balance.toLocaleString()}
            </div>
          )}
          <button onClick={fetchOrders} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 font-bold text-sm px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
            <RefreshCw size={14} /> รีเฟรช
          </button>
          {session && (
            <Link href="/inventory" className="flex items-center gap-2 bg-red-600 text-white font-bold text-sm px-4 py-2 rounded-xl hover:bg-red-700 transition-colors shadow-sm">
              <Tag size={14} /> นำสินค้าขาย
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "สินค้าทั้งหมด", val: orders.length, icon: Store, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "ราคาต่ำสุด", val: orders.length ? `฿${Math.min(...orders.map((o) => o.price)).toLocaleString()}` : "-", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "ราคาสูงสุด", val: orders.length ? `฿${Math.max(...orders.map((o) => o.price)).toLocaleString()}` : "-", icon: ShoppingCart, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg} shrink-0`}>
              <s.icon size={18} className={s.color} />
            </div>
            <div>
              <p className={`font-black text-lg leading-tight ${s.color}`}>{s.val}</p>
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="ค้นหาชื่อไอเทม..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/10 font-medium text-gray-700 placeholder:text-gray-400 shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-gray-400" />
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="bg-white border border-gray-200 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-red-400 font-medium text-gray-700 shadow-sm cursor-pointer">
            <option value="newest">ล่าสุด</option>
            <option value="price_asc">ราคา: ต่ำ → สูง</option>
            <option value="price_desc">ราคา: สูง → ต่ำ</option>
          </select>
          <select value={filterRarity} onChange={(e) => setFilterRarity(e.target.value)} className="bg-white border border-gray-200 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-red-400 font-medium text-gray-700 shadow-sm cursor-pointer">
            <option value="">ทุก Rarity</option>
            {rarities.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
          <Store size={60} className="opacity-20" />
          <p className="font-bold text-lg">ยังไม่มีสินค้าในตลาด</p>
          {session && (
            <Link href="/inventory" className="bg-red-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-red-700 transition-colors text-sm">
              นำสินค้าของฉันมาขาย
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map((order) => {
            const item = order.itemId;
            const rarity = item?.rarityId;
            const isMine = (session?.user as any)?.id === order.sellerId?._id;
            return (
              <div
                key={order._id}
                className="bg-white rounded-2xl border-2 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col"
                style={{ borderColor: rarity?.color ? `${rarity.color}40` : "#e2e8f0" }}
              >
                <div className="px-2 pt-2 flex items-center justify-between">
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: rarity?.color ? `${rarity.color}20` : "#f1f5f9", color: rarity?.color || "#64748b" }}>
                    {rarity?.name || "N/A"}
                  </span>
                  {isMine && <span className="text-[9px] font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">ของฉัน</span>}
                </div>

                <div className="p-3 flex-1 flex items-center justify-center h-32">
                  {item?.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <Package size={40} className="text-gray-200" />
                  )}
                </div>

                <div className="px-2.5 pb-2">
                  <p className="font-bold text-gray-800 text-xs line-clamp-2 leading-tight mb-1">{item?.name}</p>
                  <div className="flex items-center gap-1.5">
                    {order.sellerId?.avatar ? (
                      <img src={order.sellerId.avatar} className="w-4 h-4 rounded-full" alt="" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[8px] font-bold text-gray-500">
                        {order.sellerId?.name?.charAt(0) || "?"}
                      </div>
                    )}
                    <span className="text-[10px] text-gray-400 font-medium truncate">{order.sellerId?.name}</span>
                  </div>
                </div>

                <div className="px-2 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-red-600 text-sm">฿{order.price.toLocaleString()}</span>
                    <span className="text-[10px] text-gray-400 line-through">฿{item?.price?.toLocaleString()}</span>
                  </div>
                  {!isMine ? (
                    <button
                      onClick={() => setBuyModal(order)}
                      className="w-full text-[11px] font-black text-white py-2 rounded-xl transition-colors flex items-center justify-center gap-1 shadow-sm"
                      style={{ backgroundColor: rarity?.color || "#ef4444" }}
                    >
                      <ShoppingCart size={12} /> ซื้อเลย
                    </button>
                  ) : (
                    <div className="w-full text-[11px] font-bold text-gray-400 bg-gray-50 py-2 rounded-xl text-center border border-gray-100">
                      รออยู่ในตลาด
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Buy Modal */}
      {buyModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm" onClick={() => setBuyModal(null)}>
          <div className="bg-white w-full max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base">ยืนยันการซื้อ</h3>
              <button onClick={() => setBuyModal(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              {/* Item */}
              <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-white border-2 flex items-center justify-center p-1 shrink-0" style={{ borderColor: buyModal.itemId?.rarityId?.color ? `${buyModal.itemId.rarityId.color}60` : "#e2e8f0" }}>
                  {buyModal.itemId?.image ? (
                    <img src={buyModal.itemId.image} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <Package size={30} className="text-gray-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800">{buyModal.itemId?.name}</p>
                  {buyModal.itemId?.rarityId && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full mt-1 inline-block" style={{ backgroundColor: `${buyModal.itemId.rarityId.color}20`, color: buyModal.itemId.rarityId.color }}>
                      {buyModal.itemId.rarityId.name}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-xs text-gray-500">ผู้ขาย:</span>
                    <span className="text-xs font-bold text-gray-700">{buyModal.sellerId?.name}</span>
                  </div>
                </div>
              </div>

              {/* Price breakdown */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col gap-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-medium">ราคาซื้อ</span>
                  <span className="font-black text-gray-900">฿{buyModal.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-200 pt-2.5">
                  <span className="text-gray-600 font-medium">ยอดเงินปัจจุบัน</span>
                  <span className={`font-black ${balance >= buyModal.price ? "text-emerald-600" : "text-red-600"}`}>
                    ฿{balance.toLocaleString()}
                  </span>
                </div>
                {balance >= buyModal.price && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium">คงเหลือหลังซื้อ</span>
                    <span className="font-black text-gray-900">฿{(balance - buyModal.price).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {balance < buyModal.price && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-700 text-sm">ยอดเงินไม่เพียงพอ</p>
                    <p className="text-xs text-red-600 mt-1">ขาดอีก ฿{(buyModal.price - balance).toLocaleString()} กรุณาเติมเงินก่อน</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button onClick={() => setBuyModal(null)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors text-sm">
                ยกเลิก
              </button>
              {balance >= buyModal.price ? (
                <button onClick={handleBuy} disabled={isBuying} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 disabled:bg-gray-400 transition-colors text-sm">
                  {isBuying ? "กำลังดำเนินการ..." : "ซื้อเลย"}
                </button>
              ) : (
                <button onClick={() => { setBuyModal(null); setIsTopupOpen(true); }} className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-colors text-sm text-center flex items-center justify-center">
                  เติมเงิน
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl shadow-xl font-bold text-sm text-white flex items-center gap-2 transition-all whitespace-nowrap ${toast.ok ? "bg-emerald-600" : "bg-red-600"}`}>
          {toast.ok ? "✓" : "✕"} {toast.msg}
        </div>
      )}

      {/* Topup Modal */}
      <TopupModal isOpen={isTopupOpen} onClose={() => setIsTopupOpen(false)} />
    </div>
  );
}
