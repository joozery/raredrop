"use client";

import React, { useState, useRef, useEffect, use } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, Zap, History, Flame, CheckCircle2, Ticket,
  ShieldCheck, Wallet, HelpCircle, Headphones, Share, Package, Coins, Sparkles,
  Search,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LoginModal } from "@/components/auth/LoginModal";
import { TopupModal } from "@/components/payment/TopupModal";

// ---- หน้า category slug (เช่น /boxes/freefire) ----
function CategoryBoxesPage({ slug }: { slug: string }) {
  const [boxes, setBoxes] = useState<any[]>([]);
  const [catName, setCatName] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/boxes?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) {
          setBoxes(d);
          if (d.length === 0) setNotFound(true);
          else setCatName(d[0]?.categoryId?.name || slug);
        } else {
          setNotFound(true);
        }
      })
      .finally(() => setLoading(false));

    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) {
          setCategories(d);
          const found = d.find((c: any) => c.slug === slug);
          if (found) setCatName(found.name);
        }
      })
      .catch(() => {});
  }, [slug]);

  const filtered = boxes.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-4 lg:p-6 pb-24 lg:pb-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/boxes" className="text-gray-500 hover:text-gray-800 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft size={22} />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900">{catName || slug}</h1>
          <p className="text-sm text-gray-500">กล่องในหมวดนี้ทั้งหมด</p>
        </div>
      </div>

      {/* Category Icons */}
      <div className="flex gap-3 overflow-x-auto hide-scrollbar py-2 -mx-1 px-1 mb-4">
        <Link href="/boxes" className="flex flex-col items-center gap-1.5 shrink-0">
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
        {categories.map((cat: any) => {
          const catSlug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
          const isActive = catSlug === slug;
          return (
            <Link
              key={cat._id}
              href={`/boxes/${catSlug}`}
              className="flex flex-col items-center gap-1.5 shrink-0"
            >
              <div className={`w-14 h-14 rounded-xl overflow-hidden transition-all bg-gray-100 ${isActive ? "ring-2 ring-[#DC2626] ring-offset-1 shadow-md" : "ring-1 ring-gray-200 hover:ring-gray-300"}`}>
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "/product/pokemon.webp"; }} />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-400 text-xs font-bold">{cat.name.charAt(0)}</div>
                )}
              </div>
              <span className={`text-[10px] font-semibold text-center leading-tight max-w-[56px] truncate ${isActive ? "text-[#DC2626]" : "text-gray-600"}`}>{cat.name}</span>
            </Link>
          );
        })}
      </div>

      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="ค้นหากล่องสุ่ม..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all font-medium"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 animate-pulse border border-gray-100">
              <div className="aspect-square rounded-xl bg-gray-100 mb-3" />
              <div className="h-3 bg-gray-100 rounded w-3/4 mb-2" />
              <div className="h-8 bg-gray-100 rounded-xl mt-3" />
            </div>
          ))}
        </div>
      ) : notFound ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Package size={48} className="mb-4 opacity-30" />
          <p className="font-bold text-lg">ไม่พบหมวดหมู่นี้</p>
          <Link href="/boxes" className="mt-4 bg-red-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-red-700 transition-colors">
            ดูกล่องทั้งหมด
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((box) => (
            <Link
              key={box._id}
              href={`/boxes/${box._id}`}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group relative flex flex-col"
            >
              {box.isOutOfStock ? (
                <span className="absolute top-3 left-3 z-10 bg-gray-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">หมดแล้ว</span>
              ) : box.flashSale ? (
                <span className="absolute top-3 left-3 z-10 bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">⚡ SALE</span>
              ) : box.isFeatured ? (
                <span className="absolute top-3 left-3 z-10 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-0.5">
                  <Flame size={9} className="fill-white" /> ฮิต
                </span>
              ) : null}
              <div className={`aspect-square rounded-xl bg-gray-50 overflow-hidden mb-3 ${box.isOutOfStock ? "grayscale opacity-60" : ""}`}>
                <img
                  src={box.image}
                  alt={box.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/product/pokemon.webp"; }}
                />
              </div>
              <h3 className="font-bold text-gray-900 text-sm leading-tight mb-1 line-clamp-2">{box.name}</h3>
              <p className="text-xs mb-3 text-center">
                {box.flashSale ? (
                  <>
                    <span className="line-through text-gray-400 mr-1">฿{box.price.toLocaleString()}</span>
                    <span className="text-orange-500 font-black text-sm">฿{box.flashSale.salePrice.toLocaleString()}</span>
                  </>
                ) : (
                  <><span className="text-gray-500">เริ่มต้น </span><span className="text-red-600 font-black text-sm">฿{box.price.toLocaleString()}</span></>
                )}
              </p>
              <button
                className={`mt-auto w-full font-bold py-2.5 rounded-xl text-xs shadow-sm ${box.isOutOfStock ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-red-600 text-white hover:bg-red-700 active:scale-95 transition-colors"}`}
                disabled={box.isOutOfStock}
              >
                {box.isOutOfStock ? "สินค้าหมด" : "เปิดกล่อง"}
              </button>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

interface RarityData { name: string; color: string; order: number; backgroundImage?: string }
interface ItemData { _id: string; name: string; image: string; price: number; rarityId: RarityData }
interface BoxItem { itemId: ItemData; probability: number; isLocked?: boolean }
interface FlashSaleData { salePrice: number; endsAt: string }
interface BoxData {
  _id: string; name: string; description?: string; image: string; titleImage?: string; animation?: string;
  price: number; items: BoxItem[]; pityCount: number; pityThreshold: number; freeCredits: number;
  flashSale?: FlashSaleData | null;
}
interface DrawResult {
  itemId: string; name: string; image: string; price: number; rarity: RarityData;
  type?: "item" | "coin_reward"; coinRewardAmount?: number;
}

export default function BoxDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  // ถ้าไม่ใช่ MongoDB ObjectID (24 hex) → render หน้า category slug
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    return <CategoryBoxesPage slug={id} />;
  }
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const balance = (session?.user as any)?.coins || 0;

  const [box, setBox] = useState<BoxData | null>(null);
  const [loading, setLoading] = useState(true);

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isTopupOpen, setIsTopupOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedDraw, setSelectedDraw] = useState<{ times: number; price: number } | null>(null);
  const [playAnimation, setPlayAnimation] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [results, setResults] = useState<DrawResult[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [pityCount, setPityCount] = useState(0);
  const [freeCredits, setFreeCredits] = useState(0);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [gemcoinIcon, setGemcoinIcon] = useState("");
  const [flashCountdown, setFlashCountdown] = useState("");

  useEffect(() => {
    fetch("/api/public-settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setGemcoinIcon(d.gemcoin_icon || ""))
      .catch(() => {});
  }, []);

  const effectivePrice = box?.flashSale ? box.flashSale.salePrice : (box?.price ?? 0);

  useEffect(() => {
    if (!box?.flashSale?.endsAt) return;
    const tick = () => {
      const diff = new Date(box.flashSale!.endsAt).getTime() - Date.now();
      if (diff <= 0) { setFlashCountdown("หมดเวลา"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setFlashCountdown(`${h > 0 ? `${h}ชม. ` : ""}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [box?.flashSale?.endsAt]);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/boxes/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setBox(data);
          setPityCount(data.pityCount || 0);
          setFreeCredits(data.freeCredits || 0);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      scrollRef.current.scrollTo({
        left: direction === "left" ? scrollLeft - clientWidth / 2 : scrollLeft + clientWidth / 2,
        behavior: "smooth",
      });
    }
  };

  const handleDrawClick = (times: number) => {
    if (!session) { setIsLoginOpen(true); return; }
    if (!box || cannotDraw) return;
    setSelectedDraw({ times, price: effectivePrice * times });
    setIsPaymentModalOpen(true);
  };

  const handleConfirmOpen = async () => {
    if (!selectedDraw || !box || isOpening) return;
    setIsPaymentModalOpen(false);
    setIsOpening(true);

    try {
      const res = await fetch(`/api/user/boxes/${box._id}/open`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ times: selectedDraw.times }),
      });
      const data = await res.json();

      if (!res.ok) { showToast(data.error || "เกิดข้อผิดพลาด", false); setIsOpening(false); return; }

      // ของหมดสต็อกกลางทาง อาจได้น้อยกว่าที่ขอ (เก็บเงินตามจำนวนที่ได้จริงเท่านั้น) — แจ้งให้รู้
      if (data.results.length < selectedDraw.times) {
        showToast(`ได้ของ ${data.results.length} จาก ${selectedDraw.times} ที่ขอ เพราะสินค้าบางชิ้นหมดสต็อกพอดี`, false);
      }

      setResults(data.results);
      setPityCount(data.pityCount);
      setFreeCredits((prev) => Math.max(0, prev - (data.freeOpensUsed || 0)));
      await updateSession(); // refresh coins in session

      if (playAnimation) {
        setIsAnimating(true);
      } else {
        setShowResult(true);
      }
    } catch {
      showToast("เกิดข้อผิดพลาด กรุณาลองใหม่", false);
    } finally {
      setIsOpening(false);
    }
  };

  // Group items by rarity for drop rate display — ไอเทมที่พักชั่วคราว (isLocked) ไม่ร่วมการสุ่ม จึงไม่นับใน % ที่โชว์
  // % แสดงผลคิดเป็นสัดส่วนจากยอดรวมของตัวที่ไม่ล็อก (normalize) ให้ตรงกับโอกาสออกจริงเสมอ แม้แอดมินตั้งรวมไม่เท่ากับ 100
  const unlockedTotalProb = box?.items.reduce((sum, bi) => sum + (bi.isLocked ? 0 : (bi.probability || 0)), 0) || 0;

  const rarityGroups = box?.items.reduce((acc: Record<string, { prob: number; color: string; order: number }>, bi) => {
    const r = bi.itemId?.rarityId;
    if (!r || bi.isLocked) return acc;
    if (!acc[r.name]) acc[r.name] = { prob: 0, color: r.color, order: r.order };
    acc[r.name].prob += unlockedTotalProb > 0 ? (bi.probability / unlockedTotalProb) * 100 : 0;
    return acc;
  }, {}) || {};

  const dropRates = Object.entries(rarityGroups)
    .sort((a, b) => b[1].order - a[1].order)
    .map(([name, val]) => ({ label: name, pct: `${val.prob.toFixed(1)}%`, color: val.color }));

  const drawOptions = box
    ? [
        { times: 1, save: null, isBest: false },
        { times: 3, save: "ประหยัด 5%", isBest: false },
        { times: 5, save: "ประหยัด 8%", isBest: false },
        { times: 10, save: "ประหยัด 12%", isBest: true },
      ]
    : [];

  const pityPct = box ? Math.min((pityCount / box.pityThreshold) * 100, 100) : 0;

  const isOutOfStock = box?.items.some((bi: any) => {
    const item = bi.itemId;
    return !bi.isLocked && item?.type !== "coin_reward" && !item?.unlimitedStock && item?.stock <= 0;
  });

  // กล่องไม่มีไอเทม / ไอเทมถูกพักหมด / ยังไม่ตั้งอัตราดรอป — API จะปฏิเสธอยู่แล้ว จึงปิดปุ่มตั้งแต่หน้านี้
  const isNotReady = !!box && unlockedTotalProb <= 0;
  const cannotDraw = isOutOfStock || isNotReady;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
          <span className="font-medium text-sm">กำลังโหลด...</span>
        </div>
      </div>
    );
  }

  if (!box) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-800">ไม่พบกล่องสุ่มนี้</h2>
          <Link href="/" className="text-red-600 font-bold mt-2 inline-block">กลับหน้าหลัก</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAFA] pb-56 font-sans overflow-x-hidden">

      {/* Top Navigation */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
            <ChevronLeft size={24} strokeWidth={2.5} />
          </Link>
          <h1 className="font-bold text-gray-900 text-sm md:text-base truncate px-4 flex-1 text-center">
            {box.name}
          </h1>
          <div className="flex items-center gap-1 text-gray-600">
            <Link href="/knowledge-base" className="hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
              <HelpCircle size={20} strokeWidth={2} />
            </Link>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: box.name, url: window.location.href }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert("คัดลอกลิ้งก์เรียบร้อยแล้ว!");
                }
              }}
              className="hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
            >
              <Share size={20} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full px-4 pt-6 pb-4 flex flex-col gap-5">

        {/* Hero Section */}
        <div className="bg-[url('/coverrandon.png')] bg-cover bg-center rounded-2xl shadow-sm border border-gray-100 p-4 lg:p-10 relative flex flex-row items-center justify-between gap-2 lg:gap-8 z-10">
          
          {/* Left (Text) */}
          <div className="relative z-10 flex flex-col items-start text-left gap-1 lg:gap-3 flex-1 w-1/2">
            {box.titleImage ? (
              <div className="w-[115%] sm:w-[95%] lg:w-[85%] mt-1 lg:mt-2 z-20 pointer-events-none">
                <img src={box.titleImage} alt="HIGH DROPS" className="w-full h-auto object-contain object-left drop-shadow-md" />
              </div>
            ) : (
              <div className="flex flex-col mt-1 lg:mt-2">
                <h1 className="text-2xl lg:text-5xl font-black italic text-gray-900 leading-[0.85] tracking-tighter drop-shadow-sm">HIGH</h1>
                <h1 className="text-2xl lg:text-5xl font-black italic text-red-600 leading-[0.85] tracking-tighter drop-shadow-sm mt-0.5 lg:mt-1">DROPS</h1>
              </div>
            )}

          </div>

          {/* Right (Image) */}
          <div className="relative z-10 flex-1 flex justify-center items-center h-[200px] sm:h-[280px] lg:h-[380px] w-1/2">
            <div className="absolute bottom-2 lg:bottom-10 w-[160px] sm:w-[220px] lg:w-[350px] h-[40px] sm:h-[50px] lg:h-[80px] border-[3px] lg:border-[6px] border-red-500/10 rounded-[100%] shadow-[inset_0_0_10px_rgba(239,68,68,0.1)]" />
            <div className="absolute bottom-3 lg:bottom-14 w-[130px] sm:w-[180px] lg:w-[280px] h-[35px] sm:h-[40px] lg:h-[60px] border-2 lg:border-4 border-red-400/30 rounded-[100%] bg-white/40 backdrop-blur-sm" />
            <div className="absolute bottom-4 lg:bottom-16 w-[100px] sm:w-[140px] lg:w-[200px] h-[30px] sm:h-[35px] lg:h-[40px] bg-red-100/80 rounded-[100%] shadow-[0_0_15px_rgba(239,68,68,0.4)]" />
            {box.image ? (
              <img src={box.image} alt={box.name} className="relative z-10 w-48 sm:w-56 lg:w-72 object-contain rounded-2xl border-[3px] border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.6)] hover:-translate-y-1 lg:hover:-translate-y-2 hover:shadow-[0_0_45px_rgba(239,68,68,0.8)] transition-all duration-500 ease-out" />
            ) : (
              <div className="relative z-10 w-48 sm:w-56 lg:w-72 h-48 sm:h-56 flex items-center justify-center">
                <Package size={50} className="text-red-200 lg:w-[80px] lg:h-[80px]" />
              </div>
            )}
          </div>
          
        </div>

        {/* Flash Sale Banner */}
        {box.flashSale && (
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-4 flex items-center gap-4 shadow-md">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <Zap size={24} className="text-white fill-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-black text-base leading-tight flex items-center gap-2">
                ⚡ Flash Sale!
                <span className="bg-white/20 text-white text-xs font-black px-2 py-0.5 rounded-full">
                  -{Math.round((1 - box.flashSale.salePrice / box.price) * 100)}%
                </span>
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-orange-100 text-sm line-through">฿{box.price.toLocaleString()}</span>
                <span className="text-white font-black text-lg">฿{box.flashSale.salePrice.toLocaleString()}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-orange-100 text-[10px] font-bold">หมดใน</p>
              <p className="text-white font-black text-base tabular-nums">{flashCountdown}</p>
            </div>
          </div>
        )}

        {/* Free Credits Banner */}
        {freeCredits > 0 && (
          <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-2xl p-4 flex items-center gap-4 shadow-md">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              {gemcoinIcon ? <img src={gemcoinIcon} alt="" className="w-6 h-6 object-contain" /> : <Coins size={24} className="text-white" />}
            </div>
            <div className="flex-1">
              <p className="text-white font-black text-base leading-tight">คุณมีสิทธิ์เปิดฟรี!</p>
              <p className="text-purple-100 text-sm font-medium mt-0.5">จาก GemCoin Exchange — เหลืออีก <span className="font-black text-white">{freeCredits} ครั้ง</span></p>
            </div>
            <button onClick={() => handleDrawClick(1)} className="bg-white text-purple-700 font-black text-sm px-5 py-2.5 rounded-xl hover:bg-purple-50 transition-colors shadow-sm shrink-0">
              เปิดเลย!
            </button>
          </div>
        )}



        {/* Top Rewards */}
        <div className="mt-6 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame size={22} className="text-red-500 fill-red-500" />
              <h2 className="font-black text-xl text-gray-900 tracking-tight">ของรางวัลทั้งหมด</h2>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-4 pb-4">
            {[...box.items]
              .sort((a, b) => (b.itemId?.rarityId?.order || 0) - (a.itemId?.rarityId?.order || 0))
              .map((bi, i) => {
                const item = bi.itemId;
                const rarity = item?.rarityId;
                return (
                  <div key={i} className={`rounded-xl sm:rounded-2xl flex flex-col relative hover:-translate-y-1 hover:shadow-xl transition-all cursor-pointer group overflow-hidden ${!rarity?.backgroundImage ? 'bg-white border-2' : 'border border-white/10'}`} style={{ borderColor: !rarity?.backgroundImage ? (rarity?.color ? `${rarity.color}60` : "#e2e8f0") : undefined }}>



                    {rarity?.backgroundImage && (
                      <div className="absolute inset-0 z-0 bg-[#0a0a14]">
                        <img src={rarity.backgroundImage} alt="bg" className="w-full h-full object-cover opacity-80 group-hover:scale-110 transition-transform duration-700 ease-out" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14] via-[#0a0a14]/60 to-transparent" />
                      </div>
                    )}

                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3 text-[8px] sm:text-[10px] font-black px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full uppercase tracking-wider z-20 text-white shadow-sm flex items-center gap-1" style={{ backgroundColor: rarity?.color || "#64748b" }}>
                      <Sparkles size={8} className="sm:w-[10px] sm:h-[10px]" />
                      <span className="hidden sm:inline">{rarity?.name || "N/A"}</span>
                      <span className="sm:hidden">{rarity?.name?.slice(0, 3)}</span>
                    </div>
                    
                    <div 
                      className="mt-8 sm:mt-12 mx-auto w-[70px] h-[70px] sm:w-[120px] sm:h-[120px] flex items-center justify-center rounded-[10px] sm:rounded-[14px] relative z-10 transition-all duration-300 bg-white/5 backdrop-blur-sm overflow-hidden"
                      style={{
                        boxShadow: rarity?.backgroundImage ? `0 0 15px ${rarity.color}60, inset 0 0 10px ${rarity.color}30` : 'none',
                        border: rarity?.backgroundImage ? `1.5px solid ${rarity.color}` : '2px solid transparent',
                        backgroundColor: !rarity?.backgroundImage ? '#f8fafc' : undefined
                      }}
                    >
                      <div className="relative w-full h-full flex items-center justify-center p-1 sm:p-2">
                        {item?.image ? (
                          <img src={item.image} alt={item.name} className={`w-full h-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] group-hover:scale-110 group-hover:rotate-2 transition-all duration-500 ease-out ${!rarity?.backgroundImage ? "mix-blend-multiply drop-shadow-none" : ""}`} />
                        ) : (
                          <Package size={24} className="text-gray-300 sm:w-10 sm:h-10" />
                        )}
                      </div>
                    </div>
                    <div className="mt-2 mb-2 sm:mt-4 sm:mb-4 flex flex-col items-center text-center relative z-10 px-1.5 sm:px-3">
                      {rarity?.backgroundImage && (
                        <div className="flex items-center w-full justify-center gap-1.5 sm:gap-2 mb-1 sm:mb-2 opacity-70">
                          <div className="h-[1px] w-3 sm:w-6 bg-gradient-to-r from-transparent to-white/60"></div>
                          <Sparkles size={8} className="text-white sm:w-[10px] sm:h-[10px]" />
                          <div className="h-[1px] w-3 sm:w-6 bg-gradient-to-l from-transparent to-white/60"></div>
                        </div>
                      )}
                      <p className={`font-bold text-[9px] sm:text-[13px] line-clamp-1 w-full ${rarity?.backgroundImage ? 'text-white' : 'text-gray-800'}`}>{item?.name}</p>
                      {rarity?.backgroundImage && (
                        <p className="hidden sm:block text-[9px] sm:text-[10px] text-white/50 leading-tight mt-0.5 sm:mt-1 font-medium">ไอเทมระดับ {rarity?.name}</p>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Draw Bar */}
      <div className="fixed bottom-0 left-0 lg:left-[17rem] xl:left-[18rem] right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.06)]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col xl:flex-row items-center gap-4 xl:gap-6">
          <div className="flex items-center gap-2 w-full xl:flex-[1.5]">
            {drawOptions.map((opt) => (
              <button
                key={opt.times}
                onClick={() => handleDrawClick(opt.times)}
                disabled={cannotDraw}
                className={`flex-1 relative flex flex-col items-center justify-center py-2.5 rounded-xl border transition-all active:scale-95 ${
                  cannotDraw ? "bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed" : opt.isBest ? "bg-red-50/50 border-red-200 shadow-sm" : "bg-white border-gray-100 hover:bg-gray-50"
                }`}
              >
                {opt.isBest && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-600 to-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm flex items-center gap-0.5">
                    <Flame size={10} className="fill-white" /> BEST VALUE!
                  </div>
                )}
                <span className="font-black text-lg leading-none text-gray-900">x{opt.times}</span>
                <span className="text-[9px] font-bold text-gray-400 mb-1">DRAW</span>
                <span className="font-black text-sm flex items-center gap-1 text-red-600">
                  <span className="font-sans">฿</span> {(effectivePrice * opt.times).toLocaleString()}
                </span>
              </button>
            ))}
          </div>
          <div className="flex flex-col items-center w-full xl:flex-1">
            {cannotDraw ? (
              <button disabled className="w-full bg-gradient-to-r from-gray-400 to-gray-500 text-white font-black text-xl lg:text-2xl py-3 lg:py-4 rounded-xl shadow-[0_6px_0_#9ca3af] transition-all flex flex-col items-center justify-center cursor-not-allowed">
                <div className="flex items-center gap-2">
                  {isOutOfStock ? "สินค้าหมด (Out of Stock)" : "กล่องนี้ยังไม่พร้อมให้สุ่ม"}
                </div>
                <span className="text-xs font-semibold text-gray-100 mt-1 opacity-90 drop-shadow-sm">ไม่สามารถสุ่มได้ในขณะนี้</span>
              </button>
            ) : (
              <button
                onClick={() => handleDrawClick(1)}
                disabled={isOpening}
                className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 disabled:from-gray-400 disabled:to-gray-300 text-white font-black text-xl lg:text-2xl py-3 lg:py-4 rounded-xl shadow-[0_6px_0_#991b1b,0_10px_20px_rgba(220,38,38,0.3)] active:shadow-[0_0px_0_#991b1b] active:translate-y-[6px] transition-all flex flex-col items-center justify-center group"
              >
                <div className="flex items-center gap-2">
                  <Flame size={24} className="fill-yellow-400 text-yellow-400 group-hover:scale-110 transition-transform" />
                  {isOpening ? "กำลังสุ่ม..." : "เปิดกล่องเลย!"}
                </div>
                <span className="text-xs font-semibold text-red-100 mt-1 opacity-90 drop-shadow-sm">ลุ้นของหายากระดับตำนาน</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && selectedDraw && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsPaymentModalOpen(false)}>
          <div className="bg-[#F8F8F8] w-full max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 flex items-center justify-between bg-white border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-900">ยืนยันการชำระเงิน</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">แอนิเมชัน</span>
                <button onClick={() => setPlayAnimation(!playAnimation)} className={`w-10 h-6 rounded-full relative shadow-inner flex items-center p-0.5 transition-colors ${playAnimation ? "bg-red-600" : "bg-gray-300"}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${playAnimation ? "translate-x-4" : "translate-x-0"}`} />
                </button>
              </div>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div className="bg-gray-900 text-white rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden shadow-lg border border-gray-800">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <div className="flex items-center gap-2 mb-2 relative z-10">
                  <Wallet size={16} className="text-gray-400" />
                  <span className="text-sm font-bold text-gray-300">ยอดเงินคงเหลือ</span>
                </div>
                <div className="flex items-end justify-between mt-2 relative z-10">
                  <span className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
                    <span className="font-sans">฿</span> {balance.toLocaleString()}
                  </span>
                  <button onClick={() => setIsTopupOpen(true)} className="bg-white text-gray-900 font-bold text-sm px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-1 shadow-sm">
                    + เติมเงิน
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="bg-red-50 text-red-600 p-2 rounded-xl"><Ticket size={20} /></div>
                  <span className="font-bold text-gray-800 text-sm">คูปอง</span>
                </div>
                <span className="text-sm font-bold text-gray-400">ไม่มีคูปอง ›</span>
              </div>
              <div className="flex items-start gap-2 px-2 mt-2">
                <ShieldCheck size={16} className="text-gray-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-gray-500 leading-relaxed font-semibold">
                  ระบบการสุ่มของเราใช้ Weighted Random Algorithm มาตรฐาน ยุติธรรม โปร่งใส 100%
                </p>
              </div>
            </div>
            <div className="bg-white p-5 border-t border-gray-100 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 px-1">
                {(() => {
                  const free = Math.min(freeCredits, selectedDraw.times);
                  const paid = selectedDraw.times - free;
                  const actualPrice = effectivePrice * paid;
                  return (
                    <>
                      {free > 0 && (
                        <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2">
                          {gemcoinIcon ? <img src={gemcoinIcon} alt="" className="w-[15px] h-[15px] object-contain" /> : <Coins size={15} className="text-purple-500" />}
                          <span className="text-sm font-bold text-purple-700">ใช้สิทธิ์ฟรี {free} ครั้ง</span>
                          {paid > 0 && <span className="text-xs text-purple-400">+ จ่าย {paid} ครั้ง</span>}
                        </div>
                      )}
                      <div className="flex items-end gap-2">
                        <span className="text-sm font-bold text-gray-500">
                          ทั้งหมด <span className="text-gray-900 text-lg mx-1">{selectedDraw.times}</span> ครั้ง
                        </span>
                        <span className="text-2xl font-black text-red-600 ml-auto flex items-center gap-1">
                          {actualPrice === 0 ? <span className="text-purple-600">ฟรี!</span> : <><span className="font-sans">฿</span> {actualPrice.toLocaleString()}</>}
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>
              {balance >= effectivePrice * Math.max(0, selectedDraw.times - Math.min(freeCredits, selectedDraw.times)) ? (
                <button onClick={handleConfirmOpen} disabled={isOpening} className="w-full bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 font-black py-4 rounded-xl text-sm transition-colors shadow-sm">
                  {isOpening ? "กำลังดำเนินการ..." : "ยืนยันการชำระเงิน"}
                </button>
              ) : (
                <button onClick={() => setIsTopupOpen(true)} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 font-black py-4 rounded-xl text-sm transition-colors cursor-pointer">
                  ยอดเงินไม่เพียงพอ (โปรดเติมเงิน)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Animation Overlay */}
      {isAnimating && (
        <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center">
          {box.animation ? (
            box.animation.match(/\.(mp4|webm|mov)$/i) ? (
              <video
                src={box.animation}
                autoPlay playsInline
                className="w-full h-full object-cover sm:object-contain"
                onEnded={() => { setIsAnimating(false); setShowResult(true); }}
              />
            ) : (
              <img
                src={box.animation}
                alt="opening"
                className="w-full h-full object-cover sm:object-contain"
                onLoad={() => setTimeout(() => { setIsAnimating(false); setShowResult(true); }, 2000)}
              />
            )
          ) : (
            // fallback: ไม่มี animation ข้ามตรงไปผลลัพธ์เลย
            <div className="text-white text-2xl font-black animate-pulse"
              ref={(el) => { if (el) setTimeout(() => { setIsAnimating(false); setShowResult(true); }, 800); }}>
              กำลังเปิดกล่อง...
            </div>
          )}
          <button
            onClick={() => { setIsAnimating(false); setShowResult(true); }}
            className="absolute top-6 right-6 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full font-bold text-sm backdrop-blur-md transition-colors"
          >
            ข้าม (Skip)
          </button>
        </div>
      )}

      {/* Result Modal */}
      {showResult && results.length > 0 && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowResult(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-black text-gray-900 text-center mb-1">ยินดีด้วย! 🎉</h2>
            <p className="text-gray-500 font-semibold text-center mb-5 text-sm">คุณได้รับไอเทมจากการสุ่ม</p>
            <div className={`grid gap-3 mb-6 ${results.length === 1 ? "grid-cols-1 place-items-center" : results.length <= 3 ? "grid-cols-3" : "grid-cols-5"}`}>
              {results.map((r, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  {r.type === "coin_reward" ? (
                    <>
                      <div className="w-20 h-20 rounded-xl flex items-center justify-center border-2 border-purple-300 bg-purple-50">
                        {gemcoinIcon ? <img src={gemcoinIcon} alt="" className="w-10 h-10 object-contain" /> : <Coins size={40} className="text-purple-600" />}
                      </div>
                      <p className="text-xs font-bold text-gray-700 text-center">{r.name}</p>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                        +{r.coinRewardAmount} GEM
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-xl flex items-center justify-center border-2 overflow-hidden relative" style={{ borderColor: r.rarity?.color ? `${r.rarity.color}60` : "#e2e8f0", backgroundColor: r.rarity?.color ? `${r.rarity.color}10` : "#f8fafc" }}>
                        {r.image ? (
                          <img src={r.image} alt={r.name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <span className="text-4xl">🎁</span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-gray-700 text-center line-clamp-2">{r.name}</p>
                      {r.rarity && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: `${r.rarity.color}20`, color: r.rarity.color }}>
                          {r.rarity.name}
                        </span>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => setShowResult(false)} className="w-full bg-red-600 text-white font-black text-lg py-3.5 rounded-xl hover:bg-red-700 transition-transform active:scale-95 shadow-[0_4px_14px_0_rgb(220,38,38,0.39)]">
              รับของรางวัล
            </button>
            <Link href="/inventory" className="block text-center text-sm text-gray-500 font-bold mt-3 hover:text-gray-800">
              ดูกระเป๋าของฉัน →
            </Link>
          </div>
        </div>
      )}

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <TopupModal isOpen={isTopupOpen} onClose={() => setIsTopupOpen(false)} />

      {toast && (
        <div className={`fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl shadow-xl font-bold text-sm text-white flex items-center gap-2 transition-all whitespace-nowrap ${toast.ok ? "bg-emerald-600" : "bg-red-600"}`}>
          {toast.ok ? "✓" : "✕"} {toast.msg}
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `@keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }` }} />
    </div>
  );
}
