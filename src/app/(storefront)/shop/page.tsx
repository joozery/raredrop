"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ShoppingBag, Search, RefreshCw, X, AlertCircle,
  ChevronLeft, ChevronRight, Package, History,
} from "lucide-react";

interface ShopItem {
  _id: string;
  title: string;
  description?: string;
  images: string[];
  price: number;
  stock: number;
  createdAt: string;
}

function ImageCarousel({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);
  if (!images || images.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <Package size={40} className="text-gray-200" />
      </div>
    );
  }
  return (
    <div className="relative w-full h-full group">
      <img
        src={images[idx]}
        alt=""
        className="w-full h-full object-cover transition-all duration-300"
      />
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setIdx((i) => (i - 1 + images.length) % images.length); }}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIdx((i) => (i + 1) % images.length); }}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight size={14} />
          </button>
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? "bg-white w-3" : "bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ModalCarousel({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);
  if (!images || images.length === 0) {
    return (
      <div className="w-full h-56 flex items-center justify-center bg-gray-100 rounded-xl">
        <Package size={50} className="text-gray-300" />
      </div>
    );
  }
  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-gray-100">
      <img src={images[idx]} alt="" className="w-full h-56 object-cover" />
      {images.length > 1 && (
        <>
          <button
            onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setIdx((i) => (i + 1) % images.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center"
          >
            <ChevronRight size={18} />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all ${i === idx ? "bg-white w-5" : "bg-white/50 w-1.5"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ShopPage() {
  const { data: session, update: updateSession } = useSession();
  const balance = (session?.user as any)?.coins || 0;

  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [buyModal, setBuyModal] = useState<ShopItem | null>(null);
  const [isBuying, setIsBuying] = useState(false);
  const [successData, setSuccessData] = useState<{ purchaseId: string } | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shop");
      if (res.ok) setItems(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleBuy = async () => {
    if (!buyModal || isBuying) return;
    if (!session) { showToast("กรุณาเข้าสู่ระบบก่อน", false); return; }
    setIsBuying(true);
    try {
      const res = await fetch(`/api/shop/${buyModal._id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "เกิดข้อผิดพลาด", false); setBuyModal(null); return; }
      setBuyModal(null);
      setSuccessData({ purchaseId: data.purchaseId });
      await updateSession();
      fetchItems();
    } finally {
      setIsBuying(false);
    }
  };

  const filtered = search
    ? items.filter((i) => i.title.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <ShoppingBag size={24} className="text-red-500" /> ร้านค้า
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">ซื้อ ID เกมจากร้านค้าโดยตรง</p>
        </div>
        <div className="flex items-center gap-3">
          {session && (
            <div className="bg-gray-900 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm">
              <span className="font-sans">฿</span> {balance.toLocaleString()}
            </div>
          )}
          <Link href="/purchases" className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 font-bold text-sm px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
            <History size={14} /> ประวัติการซื้อ
          </Link>
          <button onClick={fetchItems} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 font-bold text-sm px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="ค้นหาสินค้า..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-gray-200 text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/10 font-medium text-gray-700 placeholder:text-gray-400 shadow-sm"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
          <ShoppingBag size={60} className="opacity-20" />
          <p className="font-bold text-lg">ยังไม่มีสินค้าในร้านค้า</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group"
            >
              {/* Image */}
              <div className="h-44 overflow-hidden relative">
                <ImageCarousel images={item.images} />
                {item.stock === 0 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-black text-sm">หมดแล้ว</span>
                  </div>
                )}
                {item.stock > 0 && item.stock <= 3 && (
                  <div className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    เหลือ {item.stock}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3 flex flex-col flex-1 gap-2">
                <p className="font-bold text-gray-800 text-sm line-clamp-2 leading-tight">{item.title}</p>
                {item.description && (
                  <p className="text-[11px] text-gray-400 line-clamp-2">{item.description}</p>
                )}
                <div className="mt-auto flex items-center justify-between">
                  <span className="font-black text-red-600 text-base">฿{item.price.toLocaleString()}</span>
                  <span className="text-[10px] text-gray-400">สต็อก {item.stock}</span>
                </div>
                <button
                  onClick={() => item.stock > 0 && setBuyModal(item)}
                  disabled={item.stock === 0}
                  className="w-full text-[12px] font-black text-white py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:bg-gray-200 disabled:text-gray-400 bg-red-600 hover:bg-red-700"
                >
                  <ShoppingBag size={13} />
                  {item.stock === 0 ? "หมดแล้ว" : "ซื้อเลย"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Buy Confirm Modal */}
      {buyModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm" onClick={() => setBuyModal(null)}>
          <div className="bg-white w-full max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base">ยืนยันการซื้อ</h3>
              <button onClick={() => setBuyModal(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <ModalCarousel images={buyModal.images} />
              <div>
                <p className="font-bold text-gray-900 text-base">{buyModal.title}</p>
                {buyModal.description && <p className="text-sm text-gray-500 mt-1">{buyModal.description}</p>}
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col gap-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-medium">ราคา</span>
                  <span className="font-black text-gray-900">฿{buyModal.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-200 pt-2.5">
                  <span className="text-gray-600 font-medium">ยอดเงินของฉัน</span>
                  <span className={`font-black ${balance >= buyModal.price ? "text-emerald-600" : "text-red-600"}`}>฿{balance.toLocaleString()}</span>
                </div>
                {balance >= buyModal.price && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium">คงเหลือหลังซื้อ</span>
                    <span className="font-black text-gray-900">฿{(balance - buyModal.price).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {!session && (
                <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-sm text-yellow-700 font-medium flex items-center gap-2">
                  <AlertCircle size={16} /> กรุณาเข้าสู่ระบบก่อนซื้อ
                </div>
              )}
              {session && balance < buyModal.price && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-700 text-sm">ยอดเงินไม่เพียงพอ</p>
                    <p className="text-xs text-red-600 mt-1">ขาดอีก ฿{(buyModal.price - balance).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button onClick={() => setBuyModal(null)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors text-sm">
                ยกเลิก
              </button>
              {!session ? (
                <Link href="/profile" className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors text-sm text-center flex items-center justify-center">
                  เข้าสู่ระบบ
                </Link>
              ) : balance >= buyModal.price ? (
                <button onClick={handleBuy} disabled={isBuying} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 disabled:bg-gray-400 transition-colors text-sm">
                  {isBuying ? "กำลังดำเนินการ..." : "ยืนยันซื้อ"}
                </button>
              ) : (
                <Link href="/profile" className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-colors text-sm text-center flex items-center justify-center">
                  เติมเงิน
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Purchase Success Modal */}
      {successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">🎉</span>
            </div>
            <div>
              <p className="font-black text-gray-900 text-lg">ซื้อสำเร็จ!</p>
              <p className="text-sm text-gray-500 mt-1">ข้อมูล ID เกมถูกส่งให้คุณแล้ว</p>
            </div>
            <div className="flex gap-3 w-full">
              <button onClick={() => setSuccessData(null)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors text-sm">
                ปิด
              </button>
              <Link
                href="/purchases"
                onClick={() => setSuccessData(null)}
                className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors text-sm text-center flex items-center justify-center gap-1.5"
              >
                <History size={14} /> ดูข้อมูล
              </Link>
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
    </div>
  );
}
