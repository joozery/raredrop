"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingBag, Search, RefreshCw, X, AlertCircle,
  ChevronLeft, ChevronRight, Package, History,
  Play, Flame, Calendar, CreditCard,
} from "lucide-react";
import { TopupModal } from "@/components/payment/TopupModal";

interface ShopItem {
  _id: string;
  title: string;
  description?: string;
  images: string[];
  price: number;
  stock: number;
  totalStock: number;
  liveChatEnabled?: boolean;
  youtubeUrl?: string;
  categoryId?: string | null;
  isFeatured?: boolean;
  requireUid?: boolean;
  uidLabel?: string;
  installmentEnabled?: boolean;
  createdAt: string;
}

function ImageCarousel({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);
  if (!images?.length) return <div className="w-full h-full flex items-center justify-center bg-gray-50"><Package size={40} className="text-gray-200" /></div>;
  return (
    <div className="relative w-full h-full group">
      <img src={images[idx]} alt="" className="w-full h-full object-cover" />
      {images.length > 1 && (
        <>
          <button onClick={(e) => { e.stopPropagation(); setIdx((i) => (i - 1 + images.length) % images.length); }} className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft size={14} /></button>
          <button onClick={(e) => { e.stopPropagation(); setIdx((i) => (i + 1) % images.length); }} className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight size={14} /></button>
        </>
      )}
    </div>
  );
}

function ModalCarousel({ images }: { images: string[] }) {
  const [idx, setIdx] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  if (!images?.length) return <div className="w-full aspect-square flex items-center justify-center bg-gray-100 rounded-xl"><Package size={50} className="text-gray-300" /></div>;
  return (
    <>
      <div
        className="relative w-full max-w-[240px] sm:max-w-[320px] mx-auto aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer group shrink-0"
        onClick={() => setIsFullscreen(true)}
      >
        <img src={images[idx]} alt="" className="w-full h-full object-contain mix-blend-multiply" />
        <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-md px-2 py-1.5 rounded-lg flex items-center gap-1 text-white shadow-sm pointer-events-none">
          <Search size={12} strokeWidth={2.5} />
          <span className="text-[10px] font-bold">ขยาย</span>
        </div>
        <div className="absolute inset-0 bg-black/0 group-active:bg-black/10 transition-colors pointer-events-none" />
        {images.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); setIdx((i) => (i - 1 + images.length) % images.length); }} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"><ChevronLeft size={18} /></button>
            <button onClick={(e) => { e.stopPropagation(); setIdx((i) => (i + 1) % images.length); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"><ChevronRight size={18} /></button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10" onClick={(e) => e.stopPropagation()}>
              {images.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)} className={`h-1.5 rounded-full transition-all ${i === idx ? "bg-white w-5" : "bg-white/50 w-1.5"}`} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={(e) => { e.stopPropagation(); setIsFullscreen(false); }}
        >
          <button
            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-colors z-[210]"
            onClick={(e) => { e.stopPropagation(); setIsFullscreen(false); }}
          >
            <X size={24} />
          </button>
          <img
            src={images[idx]}
            alt=""
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setIdx((i) => (i - 1 + images.length) % images.length); }}
                className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-16 sm:h-16 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors z-[210] backdrop-blur-md"
              >
                <ChevronLeft size={32} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setIdx((i) => (i + 1) % images.length); }}
                className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-16 sm:h-16 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors z-[210] backdrop-blur-md"
              >
                <ChevronRight size={32} />
              </button>
              <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 flex gap-2.5 z-[210] bg-black/30 px-4 py-2.5 rounded-full backdrop-blur-md" onClick={(e) => e.stopPropagation()}>
                {images.map((_, i) => (
                  <button key={i} onClick={() => setIdx(i)} className={`h-2 rounded-full transition-all ${i === idx ? "bg-white w-8" : "bg-white/40 w-2 hover:bg-white/80"}`} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

export default function ShopCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const balance = (session?.user as any)?.coins || 0;

  const [items, setItems] = useState<ShopItem[]>([]);
  const [catName, setCatName] = useState("");
  const [catLoading, setCatLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [notFound, setNotFound] = useState(false);

  const [buyModal, setBuyModal] = useState<ShopItem | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"full" | "installment">("full");
  const [buyerUid, setBuyerUid] = useState("");
  const [buyQty, setBuyQty] = useState(1);
  const [isBuying, setIsBuying] = useState(false);
  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const [successData, setSuccessData] = useState<{ purchaseId: string } | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shop?slug=${encodeURIComponent(slug)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        if (data.length === 0) setNotFound(true);
        setItems(data);
      } else {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  // ดึง categories + ชื่อ category จาก slug
  useEffect(() => {
    setCatLoading(true);
    fetch("/api/shop-categories")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) {
          setCategories(d);
          const cat = d.find((c: any) => c.slug === slug);
          setCatName(cat?.name || "");
        }
      })
      .catch(() => {})
      .finally(() => setCatLoading(false));
  }, [slug]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleBuy = async () => {
    if (!buyModal || isBuying) return;
    if (!session) { showToast("กรุณาเข้าสู่ระบบก่อน", false); return; }
    if (buyModal.requireUid && !buyerUid.trim()) {
      showToast(`กรุณากรอก ${buyModal.uidLabel || "UID"} ก่อนซื้อ`, false);
      return;
    }
    setIsBuying(true);
    try {
      const res = await fetch(`/api/shop/${buyModal._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerUid: buyerUid.trim() || undefined, quantity: buyQty }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "เกิดข้อผิดพลาด", false); setBuyModal(null); return; }

      const purchasedItem = buyModal;
      setBuyModal(null);
      await updateSession();
      fetchItems();

      if (!purchasedItem.liveChatEnabled) {
        setSuccessData({ purchaseId: data.purchaseId });
        return;
      }

      try {
        const uidLine = buyerUid.trim() ? `\n${purchasedItem.uidLabel || "UID"}: ${buyerUid.trim()}` : "";
        const qty: number = data.quantity || 1;
        const qtyLine = qty > 1 ? ` จำนวน ${qty} ชิ้น` : "";
        const chatRes = await fetch("/api/user/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: `รับสินค้า: ${purchasedItem.title}`,
            text: `สั่งซื้อสินค้า "${purchasedItem.title}"${qtyLine} สำเร็จแล้วครับ รบกวนส่งข้อมูลให้ด้วยครับ${uidLine}`,
            image: purchasedItem.images?.[0],
          }),
        });
        const chatData = await chatRes.json();
        if (chatRes.ok && chatData.conversationId) {
          showToast("เปิดเคสสำหรับรับสินค้าแล้ว ทีมงานจะตอบกลับเร็ว ๆ นี้");
          window.dispatchEvent(new CustomEvent("open-livechat", { detail: { conversationId: chatData.conversationId } }));
        } else {
          setSuccessData({ purchaseId: data.purchaseId });
        }
      } catch {
        setSuccessData({ purchaseId: data.purchaseId });
      }
    } finally {
      setIsBuying(false);
    }
  };

  const filtered = items
    .filter((i) => i.title?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      // สินค้าหมดไปท้ายเสมอ
      if (a.stock === 0 && b.stock > 0) return 1;
      if (a.stock > 0 && b.stock === 0) return -1;
      // สินค้าแนะนำขึ้นก่อน
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      // ภายในกลุ่มเดียวกัน เรียงใหม่สุดก่อน
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/shop" className="text-gray-500 hover:text-gray-800 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft size={22} />
        </Link>
        <div className="flex-1">
          {catLoading ? (
            <div className="h-7 w-40 bg-gray-100 rounded-lg animate-pulse" />
          ) : (
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <ShoppingBag size={22} className="text-red-500" />
              {catName || "หมวดหมู่สินค้า"}
            </h1>
          )}
          <p className="text-sm text-gray-500 mt-0.5">สินค้าในหมวดนี้ทั้งหมด</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/purchases" className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 font-bold text-sm px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
            <History size={14} /> ประวัติ
          </Link>
          <button onClick={fetchItems} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 font-bold text-sm px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Category Icons */}
      {catLoading ? (
        <div className="flex gap-3 overflow-x-auto hide-scrollbar py-2 -mx-1 px-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 shrink-0">
              <div className="w-14 h-14 rounded-xl bg-gray-100 animate-pulse" />
              <div className="h-2.5 w-10 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : categories.length > 0 && (
        <div className="flex gap-3 overflow-x-auto hide-scrollbar py-2 -mx-1 px-1">
          <Link href="/shop" className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 ring-1 ring-gray-200 hover:ring-gray-300 transition-all overflow-hidden">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <span className="text-[10px] font-semibold text-gray-600 text-center leading-tight">ทั้งหมด</span>
          </Link>
          {categories.map((c: any) => {
            const catSlug = c.slug || c.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
            const isActive = catSlug === slug;
            return (
              <Link
                key={c._id}
                href={`/shop/${catSlug}`}
                className="flex flex-col items-center gap-1.5 shrink-0"
              >
                <div className={`w-14 h-14 rounded-xl overflow-hidden transition-all bg-gray-100 ${isActive ? "ring-2 ring-[#DC2626] ring-offset-1 shadow-md" : "ring-1 ring-gray-200 hover:ring-gray-300"}`}>
                  {c.image ? (
                    <img src={c.image} alt={c.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "/product/pokemon.webp"; }} />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-400 text-xs font-bold">{c.name.charAt(0)}</div>
                  )}
                </div>
                <span className={`text-[10px] font-semibold text-center leading-tight max-w-[56px] truncate ${isActive ? "text-[#DC2626]" : "text-gray-600"}`}>{c.name}</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="ค้นหาสินค้า..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all font-medium"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
        </div>
      ) : notFound ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
          <ShoppingBag size={60} className="opacity-20" />
          <p className="font-bold text-lg">ไม่พบหมวดหมู่นี้</p>
          <Link href="/shop" className="bg-red-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-red-700 transition-colors">
            กลับร้านค้า
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
          <ShoppingBag size={60} className="opacity-20" />
          <p className="font-bold text-lg">ไม่พบสินค้า</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <div key={item._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group relative">
              {item.isFeatured && (
                <span className="absolute top-2 left-2 z-10 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                  <Flame size={12} className="fill-white/30" /> แนะนำ
                </span>
              )}
              <div className="h-44 overflow-hidden relative">
                <ImageCarousel images={item.images} />
                {item.stock === 0 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-black text-sm">หมดแล้ว</span>
                  </div>
                )}
              </div>
              <div className="p-3 flex flex-col flex-1 gap-2">
                <p className="font-bold text-gray-800 text-sm line-clamp-2 leading-tight">{item.title}</p>
                {item.description && <p className="text-[11px] text-gray-400 line-clamp-2 whitespace-pre-line">{item.description}</p>}
                <div className="mt-auto flex items-center justify-between">
                  <span className="font-black text-red-600 text-base">฿{item.price.toLocaleString()}</span>
                  <span className="text-[10px] text-gray-400">สต็อก {item.stock}</span>
                </div>
                <button
                  onClick={() => { item.stock > 0 && setBuyModal(item); setBuyerUid(""); setBuyQty(1); setPaymentMethod("full"); }}
                  disabled={item.stock === 0}
                  className="w-full text-[12px] font-black text-white py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:bg-gray-200 disabled:text-gray-400 bg-red-600 hover:bg-red-700"
                >
                  <ShoppingBag size={13} />
                  {item.stock === 0 ? "หมดแล้ว" : "ซื้อเลย"}
                </button>
                {item.youtubeUrl && (
                  <a href={item.youtubeUrl} target="_blank" rel="noopener noreferrer" className="w-full text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 py-1.5 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-1">
                    <Play size={11} /> ดูวิธี
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Buy Modal */}
      {buyModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm" onClick={() => setBuyModal(null)}>
          <div className="bg-white w-full max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl max-h-[85vh] sm:max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <h3 className="font-bold text-gray-900 text-base">ยืนยันการซื้อ</h3>
              <button onClick={() => setBuyModal(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="p-5 flex flex-col gap-4 overflow-y-auto flex-1">
              <ModalCarousel images={buyModal.images} />
              <div>
                <p className="font-bold text-gray-900 text-base">{buyModal.title}</p>
                {buyModal.description && <p className="text-sm text-gray-500 mt-1 whitespace-pre-line">{buyModal.description}</p>}
              </div>
              {buyModal.requireUid && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">{buyModal.uidLabel || "UID / ไอดีผู้เล่น"} <span className="text-red-500">*</span></label>
                  <input type="text" value={buyerUid} onChange={(e) => setBuyerUid(e.target.value)} placeholder={`กรอก${buyModal.uidLabel || "UID"} ของคุณ`} className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-400 font-medium text-gray-800" />
                </div>
              )}
              {buyModal.stock > 0 && (
                <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                  <span className="text-sm font-bold text-gray-700">จำนวน</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setBuyQty((q) => Math.max(1, q - 1))} disabled={buyQty <= 1} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700 font-black text-lg hover:bg-gray-100 disabled:opacity-30 transition-colors shadow-sm">−</button>
                    <span className="w-6 text-center font-black text-gray-900 text-base">{buyQty}</span>
                    <button onClick={() => setBuyQty((q) => Math.min(buyModal.stock, q + 1))} disabled={buyQty >= buyModal.stock} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700 font-black text-lg hover:bg-gray-100 disabled:opacity-30 transition-colors shadow-sm">+</button>
                  </div>
                </div>
              )}
              {/* Payment Method Selector — แสดงเฉพาะสินค้าที่เปิด installment */}
              {buyModal.installmentEnabled && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-bold text-gray-700">เลือกวิธีชำระเงิน</p>
                  <div className="grid grid-cols-2 gap-2">
                    <label className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === "full" ? "border-gray-800 bg-gray-50 ring-1 ring-gray-400/30" : "border-gray-200 hover:border-gray-300"}`}>
                      <input type="radio" name="paymentMethodSlug" value="full" checked={paymentMethod === "full"} onChange={() => setPaymentMethod("full")} className="accent-gray-800" />
                      <div className="flex items-center gap-1.5">
                        <CreditCard size={13} className="text-gray-600 shrink-0" />
                        <span className="text-xs font-bold text-gray-700">ชำระเต็มจำนวน</span>
                      </div>
                    </label>
                    <label className={`flex items-center gap-2 px-3 py-3 rounded-xl border cursor-pointer transition-all ${paymentMethod === "installment" ? "border-red-500 bg-red-50/60 ring-1 ring-red-400/30" : "border-gray-200 hover:border-red-200"}`}>
                      <input type="radio" name="paymentMethodSlug" value="installment" checked={paymentMethod === "installment"} onChange={() => setPaymentMethod("installment")} className="accent-red-600" />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-red-600 shrink-0" />
                          <span className="text-xs font-bold text-red-600">ผ่อนชำระ</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-red-500 text-white text-[9px] font-bold leading-none">ใหม่!</span>
                        </div>
                        <span className="text-[10px] text-gray-400">ผ่อนสบาย จ่ายเป็นงวด</span>
                      </div>
                    </label>
                  </div>
                  {paymentMethod === "installment" && (
                    <div
                      className="flex items-center justify-between gap-2 mt-1 px-4 py-3 rounded-xl bg-red-50 border border-red-100 cursor-pointer hover:bg-red-100 transition-colors"
                      onClick={() => {
                        const p = new URLSearchParams({ title: buyModal.title, price: String(buyModal.price), image: buyModal.images?.[0] || "", listingId: buyModal._id });
                        setBuyModal(null);
                        router.push(`/installment?${p.toString()}`);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-red-500 shrink-0" />
                        <p className="text-xs font-bold text-red-700">กดเพื่อไปหน้าผ่อนชำระ</p>
                      </div>
                      <ChevronRight size={14} className="text-red-400 shrink-0" />
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === "full" && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col gap-2.5">
                <div className="flex justify-between text-sm"><span className="text-gray-600 font-medium">ราคารวม</span><span className="font-black text-gray-900 text-base">฿{(buyModal.price * buyQty).toLocaleString()}</span></div>
                <div className="flex justify-between text-sm border-t border-gray-200 pt-2.5"><span className="text-gray-600 font-medium">ยอดเงินของฉัน</span><span className={`font-black ${balance >= buyModal.price * buyQty ? "text-emerald-600" : "text-red-600"}`}>฿{balance.toLocaleString()}</span></div>
              </div>
              )}
              {paymentMethod === "full" && session && balance < buyModal.price * buyQty && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-700 text-sm">ยอดเงินไม่เพียงพอ</p>
                    <p className="text-xs text-red-600 mt-1">ขาดอีก ฿{(buyModal.price * buyQty - balance).toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3 shrink-0">
              <button onClick={() => setBuyModal(null)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors text-sm">ยกเลิก</button>
              {paymentMethod === "installment" ? (
                <button
                  onClick={() => {
                    const p = new URLSearchParams({ title: buyModal.title, price: String(buyModal.price), image: buyModal.images?.[0] || "", listingId: buyModal._id });
                    setBuyModal(null);
                    router.push(`/installment?${p.toString()}`);
                  }}
                  className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors text-sm flex items-center justify-center gap-1.5"
                >
                  <Calendar size={15} />
                  ไปหน้าผ่อนชำระ
                </button>
              ) : !session ? (
                <Link href="/profile" className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors text-sm text-center flex items-center justify-center">เข้าสู่ระบบ</Link>
              ) : balance >= buyModal.price * buyQty ? (
                <button onClick={handleBuy} disabled={isBuying || (buyModal.requireUid && !buyerUid.trim())} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 disabled:bg-gray-400 transition-colors text-sm">
                  {isBuying ? "กำลังดำเนินการ..." : `ยืนยันซื้อ${buyQty > 1 ? ` x${buyQty}` : ""}`}
                </button>
              ) : (
                <button onClick={() => { setBuyModal(null); setIsTopupOpen(true); }} className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-colors text-sm">เติมเงิน</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center"><span className="text-3xl">🎉</span></div>
            <div>
              <p className="font-black text-gray-900 text-lg">ซื้อสำเร็จ!</p>
              <p className="text-sm text-gray-500 mt-1">ข้อมูลสินค้าถูกส่งให้คุณแล้ว</p>
            </div>
            <div className="flex gap-3 w-full">
              <button onClick={() => setSuccessData(null)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors text-sm">ปิด</button>
              <Link href="/purchases" onClick={() => setSuccessData(null)} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors text-sm text-center flex items-center justify-center gap-1.5">
                <History size={14} /> ดูข้อมูล
              </Link>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl shadow-xl font-bold text-sm text-white flex items-center gap-2 transition-all whitespace-nowrap ${toast.ok ? "bg-emerald-600" : "bg-red-600"}`}>
          {toast.ok ? "✓" : "✕"} {toast.msg}
        </div>
      )}

      <TopupModal isOpen={isTopupOpen} onClose={() => setIsTopupOpen(false)} />
    </div>
  );
}
