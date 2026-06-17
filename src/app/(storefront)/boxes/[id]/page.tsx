"use client";

import React, { useState, useRef, useEffect, use } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, Zap, History, Flame, CheckCircle2, Ticket,
  ShieldCheck, Wallet, HelpCircle, Headphones, Share, Package, Coins,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LoginModal } from "@/components/auth/LoginModal";

interface RarityData { name: string; color: string; order: number }
interface ItemData { _id: string; name: string; image: string; price: number; rarityId: RarityData }
interface BoxItem { itemId: ItemData; probability: number }
interface BoxData {
  _id: string; name: string; description?: string; image: string; animation?: string;
  price: number; items: BoxItem[]; pityCount: number; pityThreshold: number; freeCredits: number;
}
interface DrawResult {
  itemId: string; name: string; image: string; price: number; rarity: RarityData;
  type?: "item" | "coin_reward"; coinRewardAmount?: number;
}

export default function BoxDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const balance = (session?.user as any)?.coins || 0;

  const [box, setBox] = useState<BoxData | null>(null);
  const [loading, setLoading] = useState(true);

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedDraw, setSelectedDraw] = useState<{ times: number; price: number } | null>(null);
  const [playAnimation, setPlayAnimation] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [results, setResults] = useState<DrawResult[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [pityCount, setPityCount] = useState(0);
  const [freeCredits, setFreeCredits] = useState(0);

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
    if (!box) return;
    setSelectedDraw({ times, price: box.price * times });
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

      if (!res.ok) { alert(data.error || "เกิดข้อผิดพลาด"); setIsOpening(false); return; }

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
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setIsOpening(false);
    }
  };

  // Group items by rarity for drop rate display
  const rarityGroups = box?.items.reduce((acc: Record<string, { prob: number; color: string; order: number }>, bi) => {
    const r = bi.itemId?.rarityId;
    if (!r) return acc;
    if (!acc[r.name]) acc[r.name] = { prob: 0, color: r.color, order: r.order };
    acc[r.name].prob += bi.probability;
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
            <button className="hover:bg-gray-100 p-1.5 rounded-lg transition-colors"><HelpCircle size={20} strokeWidth={2} /></button>
            <button className="hover:bg-gray-100 p-1.5 rounded-lg transition-colors"><Headphones size={20} strokeWidth={2} /></button>
            <button className="hover:bg-gray-100 p-1.5 rounded-lg transition-colors"><Share size={20} strokeWidth={2} /></button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full px-4 pt-6 pb-4 flex flex-col gap-5">

        {/* Hero Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-10 relative flex flex-col lg:flex-row items-center justify-between gap-8 z-10">
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden rounded-2xl z-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[radial-gradient(circle,rgba(254,226,226,0.8)_0%,rgba(255,255,255,0)_70%)]" />
          </div>

          {/* Left */}
          <div className="relative z-10 flex flex-col items-start gap-3 flex-1 w-full lg:w-auto">
            <div className="bg-gradient-to-r from-red-50 to-white text-red-600 text-xs font-bold px-3 py-1.5 rounded-full border border-red-100 shadow-sm">
              {box.description || "กล่องสุ่มสุดพิเศษ!"}
            </div>
            <div className="flex flex-col mt-2">
              <h1 className="text-5xl lg:text-7xl font-black italic text-gray-900 leading-[0.85] tracking-tighter drop-shadow-sm">HIGH</h1>
              <h1 className="text-5xl lg:text-7xl font-black italic text-red-600 leading-[0.85] tracking-tighter drop-shadow-sm mt-1">DROPS</h1>
            </div>
            <p className="text-gray-500 font-semibold text-base mt-2">ลุ้นของหายาก ระดับตำนาน</p>
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => handleDrawClick(1)}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-[0_4px_14px_0_rgb(220,38,38,0.39)] transition-transform active:scale-95 text-sm"
              >
                <span className="font-sans">฿</span> {box.price.toLocaleString()}
              </button>
            </div>
          </div>

          {/* Center Box */}
          <div className="relative z-10 flex-[1.5] flex justify-center items-center h-[280px] lg:h-[380px] w-full">
            <div className="absolute bottom-4 lg:bottom-10 w-[250px] lg:w-[350px] h-[60px] lg:h-[80px] border-[6px] border-red-500/10 rounded-[100%] shadow-[inset_0_0_20px_rgba(239,68,68,0.1)]" />
            <div className="absolute bottom-6 lg:bottom-14 w-[200px] lg:w-[280px] h-[50px] lg:h-[60px] border-4 border-red-400/30 rounded-[100%] bg-white/40 backdrop-blur-sm" />
            <div className="absolute bottom-8 lg:bottom-16 w-[150px] lg:w-[200px] h-[40px] lg:h-[40px] bg-red-100/80 rounded-[100%] shadow-[0_0_30px_rgba(239,68,68,0.4)]" />
            {box.image ? (
              <img src={box.image} alt={box.name} className="relative z-10 w-56 lg:w-72 object-contain drop-shadow-[0_20px_30px_rgba(220,38,38,0.4)] hover:-translate-y-2 transition-transform duration-500 ease-out" />
            ) : (
              <div className="relative z-10 w-56 lg:w-72 h-56 flex items-center justify-center">
                <Package size={80} className="text-red-200" />
              </div>
            )}
          </div>

          {/* Right Cards */}
          <div className="relative z-10 flex flex-col gap-3 flex-1 w-full lg:w-auto">
            <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-100 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-3">
              <h3 className="font-bold text-gray-800 text-sm">ระดับความหายาก</h3>
              <div className="flex flex-col gap-2.5">
                {dropRates.length > 0 ? dropRates.map((d) => (
                  <div key={d.label} className="flex items-center gap-2 bg-gray-50/50 rounded-lg px-2 py-1">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: d.color }} />
                    <span className="font-black text-xs tracking-wide" style={{ color: d.color }}>{d.label}</span>
                  </div>
                )) : (
                  <p className="text-xs text-gray-400">ยังไม่มีข้อมูล</p>
                )}
              </div>
            </div>

            {/* Pity Card */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-100 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center justify-between">
              <div className="flex flex-col flex-1 pr-3">
                <h3 className="font-black text-gray-800 text-sm">การันตี 100%</h3>
                <p className="text-gray-400 text-[10px] font-semibold mt-0.5">เมื่อเปิดครบ {box.pityThreshold} ครั้ง</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-red-600 font-black text-sm">
                    {pityCount} <span className="text-gray-300 font-bold mx-1">/</span>
                    <span className="text-gray-500 font-bold">{box.pityThreshold}</span>
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full mt-2 overflow-hidden shadow-inner">
                  <div className="bg-gradient-to-r from-red-500 to-red-600 h-full rounded-full transition-all duration-500" style={{ width: `${pityPct}%` }} />
                </div>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-red-50 to-white rounded-xl flex items-center justify-center shadow-sm border border-red-100 shrink-0">
                <span className="text-3xl drop-shadow-sm">🎁</span>
              </div>
            </div>
          </div>
        </div>

        {/* Free Credits Banner */}
        {box.freeCredits > 0 && (
          <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-2xl p-4 flex items-center gap-4 shadow-md">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <Coins size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-black text-base leading-tight">คุณมีสิทธิ์เปิดฟรี!</p>
              <p className="text-purple-100 text-sm font-medium mt-0.5">จาก GemCoin Exchange — เหลืออีก <span className="font-black text-white">{box.freeCredits} ครั้ง</span></p>
            </div>
            <button onClick={() => handleDrawClick(1)} className="bg-white text-purple-700 font-black text-sm px-5 py-2.5 rounded-xl hover:bg-purple-50 transition-colors shadow-sm shrink-0">
              เปิดเลย!
            </button>
          </div>
        )}

        {/* Stats Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex flex-wrap md:flex-nowrap items-center justify-between gap-4">
          <div className="flex-1 flex items-center justify-center min-w-[80px]">
            <div className="flex flex-col items-center">
              <span className="font-black text-xl text-gray-900 leading-none">{box.items.length}</span>
              <span className="text-gray-500 text-xs font-bold mt-1">ไอเทม</span>
            </div>
          </div>
          <div className="flex-[2] flex justify-center w-full md:w-auto order-last md:order-none min-w-[200px]">
            <div className="bg-red-50 text-red-600 px-6 py-2.5 rounded-full font-black flex items-center gap-2 border border-red-100 shadow-sm text-sm">
              <Zap size={16} className="fill-red-600" /> ราคา ฿{box.price.toLocaleString()} / ครั้ง
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center min-w-[80px]">
            <div className="flex flex-col items-center">
              <span className="font-black text-xl text-gray-900 leading-none">
                {box.pityThreshold}
              </span>
              <span className="text-gray-500 text-xs font-bold mt-1">การันตี</span>
            </div>
          </div>
          <div className="pr-1 flex justify-end">
            <button className="bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 hover:bg-red-700 transition-colors shadow-sm text-sm">
              <History size={16} /> ประวัติ
            </button>
          </div>
        </div>

        {/* Top Rewards */}
        <div className="mt-2 bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative group/slider">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Flame size={22} className="text-red-500 fill-red-500" />
              <h2 className="font-black text-xl text-gray-900 tracking-tight">TOP REWARDS</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1 mr-2 opacity-0 group-hover/slider:opacity-100 transition-opacity">
                <button onClick={() => scroll("left")} className="p-1.5 rounded-full border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors shadow-sm">
                  <ChevronLeft size={16} strokeWidth={2.5} />
                </button>
                <button onClick={() => scroll("right")} className="p-1.5 rounded-full border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors shadow-sm">
                  <ChevronRight size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
          <div ref={scrollRef} className="flex overflow-x-auto gap-4 pb-4 snap-x [&::-webkit-scrollbar]:hidden scroll-smooth" style={{ scrollbarWidth: "none" }}>
            {[...box.items]
              .sort((a, b) => (b.itemId?.rarityId?.order || 0) - (a.itemId?.rarityId?.order || 0))
              .map((bi, i) => {
                const item = bi.itemId;
                const rarity = item?.rarityId;
                return (
                  <div key={i} className="snap-start min-w-[150px] max-w-[150px] bg-white rounded-xl border-2 p-3 flex flex-col relative hover:shadow-md transition-shadow cursor-pointer group" style={{ borderColor: rarity?.color ? `${rarity.color}60` : "#e2e8f0" }}>
                    <div className="absolute top-2 left-2 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider z-10" style={{ backgroundColor: rarity?.color ? `${rarity.color}20` : "#f1f5f9", color: rarity?.color || "#64748b" }}>
                      {rarity?.name || "N/A"}
                    </div>
                    <div className="h-[140px] mt-6 flex items-center justify-center overflow-hidden rounded-lg bg-gray-50/50 group-hover:bg-gray-100 transition-colors p-2">
                      {item?.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply drop-shadow-md group-hover:scale-110 transition-transform duration-300" />
                      ) : (
                        <Package size={40} className="text-gray-300" />
                      )}
                    </div>
                    <div className="mt-4 flex flex-col gap-1 text-center">
                      <p className="font-bold text-gray-800 text-xs line-clamp-2 leading-tight">{item?.name}</p>
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
                className={`flex-1 relative flex flex-col items-center justify-center py-2.5 rounded-xl border transition-all active:scale-95 ${opt.isBest ? "bg-red-50/50 border-red-200 shadow-sm" : "bg-white border-gray-100 hover:bg-gray-50"}`}
              >
                {opt.isBest && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-600 to-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm flex items-center gap-0.5">
                    <Flame size={10} className="fill-white" /> BEST VALUE!
                  </div>
                )}
                <span className="font-black text-lg leading-none text-gray-900">x{opt.times}</span>
                <span className="text-[9px] font-bold text-gray-400 mb-1">DRAW</span>
                <span className="font-black text-sm flex items-center gap-1 text-red-600">
                  <span className="font-sans">฿</span> {(box.price * opt.times).toLocaleString()}
                </span>
                {opt.save ? (
                  <span className="text-[9px] font-semibold text-gray-500 mt-0.5">{opt.save}</span>
                ) : (
                  <span className="text-[9px] font-semibold text-transparent mt-0.5">-</span>
                )}
              </button>
            ))}
          </div>
          <div className="flex flex-col items-center w-full xl:flex-1">
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
            <div className="flex items-center gap-1.5 mt-3 lg:mt-4 text-gray-500 text-[10px] sm:text-xs font-bold">
              <CheckCircle2 size={14} className="text-red-500" /> การันตีของหายากทุก {box.pityThreshold} ครั้ง
            </div>
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
                  <Link href="/profile" className="bg-white text-gray-900 font-bold text-sm px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-1 shadow-sm">
                    + เติมเงิน
                  </Link>
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
                  const actualPrice = box!.price * paid;
                  return (
                    <>
                      {free > 0 && (
                        <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2">
                          <Coins size={15} className="text-purple-500" />
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
              {balance >= selectedDraw.price ? (
                <button onClick={handleConfirmOpen} disabled={isOpening} className="w-full bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 font-black py-4 rounded-xl text-sm transition-colors shadow-sm">
                  {isOpening ? "กำลังดำเนินการ..." : "ยืนยันการชำระเงิน"}
                </button>
              ) : (
                <button className="w-full bg-gray-100 text-gray-400 font-black py-4 rounded-xl text-sm cursor-not-allowed">
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
                        <span className="text-4xl">💎</span>
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

      <style dangerouslySetInnerHTML={{ __html: `@keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }` }} />
    </div>
  );
}
