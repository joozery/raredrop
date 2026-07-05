"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  ShoppingBag, Search, RefreshCw, X, AlertCircle,
  ChevronLeft, ChevronRight, Package, History, ChevronDown,
  Play, MessageCircle, Flame, LayoutGrid, List,
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
  createdAt: string;
}

interface CategoryTab {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
}

interface BannerSlide {
  _id: string;
  image: string;
  link?: string;
}

function ShopBannerCarousel({ banners }: { banners: BannerSlide[] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % banners.length), 4500);
    return () => clearInterval(t);
  }, [banners.length]);

  if (banners.length === 0) return null;
  const current = banners[idx];

  const content = (
    <img src={current.image} alt="" className="w-full h-full object-cover" />
  );

  return (
    <div className="relative w-full aspect-[16/5] sm:aspect-[16/4] rounded-2xl overflow-hidden bg-gray-100 shadow-sm group">
      {current.link ? (
        current.link.startsWith("/") ? (
          <Link href={current.link}>{content}</Link>
        ) : (
          <a href={current.link} target="_blank" rel="noopener noreferrer">{content}</a>
        )
      ) : (
        content
      )}
      {banners.length > 1 && (
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all ${i === idx ? "bg-white w-5" : "bg-white/50 w-1.5"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
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
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-square flex items-center justify-center bg-gray-100 rounded-xl">
        <Package size={50} className="text-gray-300" />
      </div>
    );
  }
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
            <button
              onClick={(e) => { e.stopPropagation(); setIdx((i) => (i - 1 + images.length) % images.length); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setIdx((i) => (i + 1) % images.length); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <ChevronRight size={18} />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10" onClick={(e) => e.stopPropagation()}>
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
                  <button
                    key={i}
                    onClick={() => setIdx(i)}
                    className={`h-2 rounded-full transition-all ${i === idx ? "bg-white w-8" : "bg-white/40 w-2 hover:bg-white/80"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

function ShopItemCard({ item, onBuy }: { item: ShopItem; onBuy: (item: ShopItem) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group relative">
      {item.isFeatured && (
        <span className="absolute top-2 left-2 z-10 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
          <Flame size={12} className="fill-white/30" /> แนะนำ
        </span>
      )}
      {/* Image */}
      <div className="h-44 overflow-hidden relative">
        <ImageCarousel images={item.images} />
        {item.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-black text-sm">หมดแล้ว</span>
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
          onClick={() => item.stock > 0 && onBuy(item)}
          disabled={item.stock === 0}
          className="w-full text-[12px] font-black text-white py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:bg-gray-200 disabled:text-gray-400 bg-red-600 hover:bg-red-700"
        >
          <ShoppingBag size={13} />
          {item.stock === 0 ? "หมดแล้ว" : "ซื้อเลย"}
        </button>
        {item.youtubeUrl && (
          <a
            href={item.youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-[11px] font-bold text-red-600 bg-red-50 border border-red-100 py-1.5 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
          >
            <Play size={11} /> ดูวิธี
          </a>
        )}
      </div>
    </div>
  );
}

export default function ShopPage() {
  const { data: session, update: updateSession } = useSession();
  const balance = (session?.user as any)?.coins || 0;

  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");
  const [stockFilter, setStockFilter] = useState<"all" | "available" | "sold" | "featured">("all");
  const [viewMode, setViewMode] = useState("grid");

  const [categories, setCategories] = useState<CategoryTab[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [banners, setBanners] = useState<BannerSlide[]>([]);

  useEffect(() => {
    fetch("/api/shop-categories")
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .catch(() => {});
    fetch("/api/banners?page=shop")
      .then((r) => r.json())
      .then((d) => setBanners(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const [buyModal, setBuyModal] = useState<ShopItem | null>(null);
  const [buyerUid, setBuyerUid] = useState("");
  const [buyQty, setBuyQty] = useState(1);
  const [isBuying, setIsBuying] = useState(false);
  const [isTopupOpen, setIsTopupOpen] = useState(false);
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

      // Auto open live chat for the purchased item — เฉพาะสินค้าที่เปิด liveChatEnabled ไว้
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
      } catch (err) {
        setSuccessData({ purchaseId: data.purchaseId });
      }

    } finally {
      setIsBuying(false);
    }
  };

  const handleAskAboutItem = async (item: ShopItem) => {
    if (!session) { showToast("กรุณาเข้าสู่ระบบก่อน", false); return; }
    try {
      const res = await fetch("/api/user/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: `สอบถามสินค้า: ${item.title}`,
          text: `สวัสดีครับ อยากสอบถามเกี่ยวกับสินค้า "${item.title}" ครับ`,
          image: item.images?.[0],
        }),
      });
      const data = await res.json();
      if (res.ok && data.conversationId) {
        window.dispatchEvent(new CustomEvent("open-livechat", { detail: { conversationId: data.conversationId } }));
      } else {
        showToast(data.error || "เกิดข้อผิดพลาด", false);
      }
    } catch {
      showToast("เกิดข้อผิดพลาด", false);
    }
  };

  const availableCount = items.filter((i) => !activeCategory || i.categoryId === activeCategory).filter((i) => i.stock > 0).length;
  const soldCount = items.filter((i) => !activeCategory || i.categoryId === activeCategory).filter((i) => i.stock === 0).length;

  const filtered = items
    .filter((i) => {
      if (activeCategory && i.categoryId !== activeCategory) return false;
      if (stockFilter === "available" && i.stock === 0) return false;
      if (stockFilter === "sold" && i.stock > 0) return false;
      if (stockFilter === "featured" && !i.isFeatured) return false;
      return true;
    })
    .sort((a, b) => {
      if (stockFilter === "all") {
        if (a.stock === 0 && b.stock > 0) return 1;
        if (a.stock > 0 && b.stock === 0) return -1;
      }
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      return 0;
    });

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <ShoppingBag size={24} className="text-red-500" /> ร้านค้า
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">เลือกดูสินค้าทั้งหมด</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/purchases" className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 font-bold text-sm px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
            <History size={14} /> ประวัติการซื้อ
          </Link>
          <button onClick={fetchItems} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 font-bold text-sm px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>
      {/* Banner */}
      <ShopBannerCarousel banners={banners} />

      {/* Category Icons */}
      {categories.length > 0 && (
        <div className="flex gap-3 overflow-x-auto hide-scrollbar py-2 -mx-1 px-1">
          {/* ทั้งหมด */}
          <Link
            href="/shop"
            className="flex flex-col items-center gap-1.5 shrink-0"
          >
            <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 ring-2 ring-[#DC2626] ring-offset-1 shadow-md overflow-hidden">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <span className="text-[10px] font-semibold text-[#DC2626] text-center leading-tight">ทั้งหมด</span>
            <span className="text-[9px] text-gray-400">({items.length})</span>
          </Link>

          {categories.map((c) => {
            const count = items.filter((i) => i.categoryId === c._id).length;
            return (
              <Link
                key={c._id}
                href={c.slug ? `/shop/${c.slug}` : `/shop?cat=${c._id}`}
                className="flex flex-col items-center gap-1.5 shrink-0"
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden ring-1 ring-gray-200 hover:ring-gray-300 transition-all bg-gray-100">
                  {c.image ? (
                    <img
                      src={c.image}
                      alt={c.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/product/pokemon.webp"; }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-400 text-xs font-bold">
                      {c.name.charAt(0)}
                    </div>
                  )}
                </div>
                <span className="text-[10px] font-semibold text-gray-600 text-center leading-tight max-w-[56px] truncate">{c.name}</span>
                <span className="text-[9px] text-gray-400">({count})</span>
              </Link>
            );
          })}
        </div>
      )}




      {/* Filter and Sort Header */}
      <div className="flex flex-col gap-3 border-b border-gray-100 pb-3 mt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-black text-gray-900">สินค้าทั้งหมด</h2>

          <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">จัดเรียง:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl pl-4 pr-9 py-2 outline-none focus:border-red-400 hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
              >
                <option value="newest">ใหม่ล่าสุด</option>
                <option value="price_asc">ราคาต่ำ-สูง</option>
                <option value="price_desc">ราคาสูง-ต่ำ</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-white shadow-sm text-gray-800" : "text-gray-400 hover:text-gray-600"}`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-white shadow-sm text-gray-800" : "text-gray-400 hover:text-gray-600"}`}
            >
              <List size={16} />
            </button>
          </div>
          </div>
        </div>

        {/* Stock filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "featured", "available", "sold"] as const).map((f) => {
            const label = f === "all" ? "ทั้งหมด" : f === "featured" ? "แนะนำ" : f === "available" ? "พร้อมขาย" : "ขายแล้ว";
            const count = f === "all" ? items.length : f === "featured" ? items.filter((i) => i.isFeatured).length : f === "available" ? availableCount : soldCount;
            const active = stockFilter === f;
            return (
              <button
                key={f}
                onClick={() => setStockFilter(f)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  active
                    ? f === "available"
                      ? "bg-emerald-600 text-white"
                      : f === "sold"
                      ? "bg-gray-500 text-white"
                      : f === "featured"
                      ? "bg-orange-500 text-white"
                      : "bg-red-600 text-white"
                    : "bg-white border border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {f === "featured" && <Flame size={11} className={active ? "fill-white" : "text-orange-400"} />}
                {f === "available" && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />}
                {f === "sold" && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />}
                {label}
                <span className={`text-[10px] font-black ${active ? "opacity-80" : "opacity-50"}`}>{count}</span>
              </button>
            );
          })}
        </div>
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
        <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"}`}>
          {filtered.map((item) => (
            <ShopItemCard key={item._id} item={item} onBuy={(item) => { setBuyModal(item); setBuyerUid(""); setBuyQty(1); }} />
          ))}
        </div>
      )}

      {/* Buy Confirm Modal */}
      {buyModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm" onClick={() => setBuyModal(null)}>
          <div className="bg-white w-full max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl max-h-[85vh] sm:max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <h3 className="font-bold text-gray-900 text-base">ยืนยันการซื้อ</h3>
              <button onClick={() => setBuyModal(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4 overflow-y-auto flex-1">
              <ModalCarousel images={buyModal.images} />
              <div>
                <p className="font-bold text-gray-900 text-base">{buyModal.title}</p>
                {buyModal.description && <p className="text-sm text-gray-500 mt-1">{buyModal.description}</p>}
              </div>

              {buyModal.youtubeUrl && (
                <div className="flex gap-2">
                  <a
                    href={buyModal.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 text-sm font-bold text-red-600 bg-red-50 border border-red-100 py-2.5 rounded-xl hover:bg-red-100 transition-colors"
                  >
                    <Play size={15} /> ดูวิธีใช้งาน
                  </a>
                </div>
              )}

              {/* UID input — แสดงเฉพาะสินค้าที่ต้องการ */}
              {buyModal.requireUid && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700">
                    {buyModal.uidLabel || "UID / ไอดีผู้เล่น"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={buyerUid}
                    onChange={(e) => setBuyerUid(e.target.value)}
                    placeholder={`กรอก${buyModal.uidLabel || "UID"} ของคุณ`}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/10 font-medium text-gray-800"
                  />
                  <p className="text-[11px] text-gray-400">ทีมงานจะใช้ข้อมูลนี้เพื่อส่งสินค้าให้คุณ</p>
                </div>
              )}

              {/* Quantity selector */}
              {buyModal.stock > 0 && (
                <div className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-xl px-4 py-3">
                  <span className="text-sm font-bold text-gray-700">จำนวน</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setBuyQty((q) => Math.max(1, q - 1))}
                      disabled={buyQty <= 1}
                      className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700 font-black text-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-black text-gray-900 text-base">{buyQty}</span>
                    <button
                      onClick={() => setBuyQty((q) => Math.min(buyModal.stock, q + 1))}
                      disabled={buyQty >= buyModal.stock}
                      className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700 font-black text-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col gap-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-medium">ราคาต่อชิ้น</span>
                  <span className="font-bold text-gray-700">฿{buyModal.price.toLocaleString()}</span>
                </div>
                {buyQty > 1 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium">จำนวน</span>
                    <span className="font-bold text-gray-700">x{buyQty}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm border-t border-gray-200 pt-2.5">
                  <span className="text-gray-600 font-medium">ราคารวม</span>
                  <span className="font-black text-gray-900 text-base">฿{(buyModal.price * buyQty).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-200 pt-2.5">
                  <span className="text-gray-600 font-medium">ยอดเงินของฉัน</span>
                  <span className={`font-black ${balance >= buyModal.price * buyQty ? "text-emerald-600" : "text-red-600"}`}>฿{balance.toLocaleString()}</span>
                </div>
                {balance >= buyModal.price * buyQty && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 font-medium">คงเหลือหลังซื้อ</span>
                    <span className="font-black text-gray-900">฿{(balance - buyModal.price * buyQty).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {!session && (
                <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-sm text-yellow-700 font-medium flex items-center gap-2">
                  <AlertCircle size={16} /> กรุณาเข้าสู่ระบบก่อนซื้อ
                </div>
              )}
              {session && balance < buyModal.price * buyQty && (
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
              <button onClick={() => setBuyModal(null)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors text-sm">
                ยกเลิก
              </button>
              {!session ? (
                <Link href="/profile" className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors text-sm text-center flex items-center justify-center">
                  เข้าสู่ระบบ
                </Link>
              ) : balance >= buyModal.price * buyQty ? (
                <button
                  onClick={handleBuy}
                  disabled={isBuying || (buyModal.requireUid && !buyerUid.trim())}
                  className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 disabled:bg-gray-400 transition-colors text-sm"
                >
                  {isBuying ? "กำลังดำเนินการ..." : `ยืนยันซื้อ${buyQty > 1 ? ` x${buyQty}` : ""}`}
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

      {/* Purchase Success Modal */}
      {successData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">🎉</span>
            </div>
            <div>
              <p className="font-black text-gray-900 text-lg">ซื้อสำเร็จ!</p>
              <p className="text-sm text-gray-500 mt-1">ข้อมูลรายละเอียดสินค้าถูกส่งให้คุณแล้ว</p>
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

      {/* Topup Modal */}
      <TopupModal isOpen={isTopupOpen} onClose={() => setIsTopupOpen(false)} />
    </div>
  );
}
