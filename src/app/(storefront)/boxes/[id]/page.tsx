"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  Bell, Plus, ChevronRight, Zap, History, Flame, CheckCircle2, ChevronLeft, Ticket, ShieldCheck, Wallet, HelpCircle, Headphones, Share
} from "lucide-react";
import { useSession } from "next-auth/react";

export default function BoxDetailPage({ params: _params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const balance = session ? ((session.user as any)?.coins || 0) : 0;

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedDraw, setSelectedDraw] = useState<{ times: number; price: number } | null>(null);
  
  const [playAnimation, setPlayAnimation] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === "left" ? scrollLeft - clientWidth / 2 : scrollLeft + clientWidth / 2;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  const handleDrawClick = (times: number, price: number) => {
    setSelectedDraw({ times, price });
    setIsPaymentModalOpen(true);
  };

  const winners = [
    { id: 1, name: "John", item: "PSA 10", time: "2 นาทีที่แล้ว", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=John" },
    { id: 2, name: "Mike", item: "Labubu Secret", time: "3 นาทีที่แล้ว", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Mike" },
    { id: 3, name: "Jane", item: "Bearbrick 1000%", time: "5 นาทีที่แล้ว", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Jane" },
    { id: 4, name: "Tom", item: "Pikachu Gold", time: "6 นาทีที่แล้ว", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Tom" },
  ];

  const topRewards = [
    { id: 1, rank: "LEGENDARY", name: "Pikachu Golden Card", chance: "0.3%", image: "/product/pokemon.webp", color: "text-yellow-600", borderColor: "border-yellow-300", bgBadge: "bg-yellow-100" },
    { id: 2, rank: "LEGENDARY", name: "Bearbrick 1000% Gold", chance: "0.5%", image: "/product/pokemon.webp", color: "text-yellow-600", borderColor: "border-yellow-300", bgBadge: "bg-yellow-100" },
    { id: 3, rank: "LEGENDARY", name: "Luffy Gear 5 Figure", chance: "0.7%", image: "/product/pokemon.webp", color: "text-yellow-600", borderColor: "border-yellow-300", bgBadge: "bg-yellow-100" },
    { id: 4, rank: "EPIC", name: "PSA 10 Gem Mint", chance: "1.5%", image: "/product/pokemon.webp", color: "text-purple-600", borderColor: "border-purple-300", bgBadge: "bg-purple-100" },
    { id: 5, rank: "EPIC", name: "Labubu Secret", chance: "2.0%", image: "/product/pokemon.webp", color: "text-purple-600", borderColor: "border-purple-300", bgBadge: "bg-purple-100" },
    { id: 6, rank: "RARE", name: "VSTAR Universe Box", chance: "5.0%", image: "/product/pokemon.webp", color: "text-blue-600", borderColor: "border-blue-300", bgBadge: "bg-blue-100" },
    { id: 7, rank: "RARE", name: "Pokémon Booster Box", chance: "8.0%", image: "/product/pokemon.webp", color: "text-blue-600", borderColor: "border-blue-300", bgBadge: "bg-blue-100" },
  ];

  const dropRates = [
    { label: "LEGENDARY", pct: "0.5%", color: "text-yellow-600", iconColor: "bg-yellow-500", bgIcon: "bg-yellow-100" },
    { label: "EPIC", pct: "9.5%", color: "text-purple-600", iconColor: "bg-purple-500", bgIcon: "bg-purple-100" },
    { label: "RARE", pct: "30%", color: "text-blue-600", iconColor: "bg-blue-500", bgIcon: "bg-blue-100" },
    { label: "COMMON", pct: "60%", color: "text-gray-500", iconColor: "bg-gray-400", bgIcon: "bg-gray-100" },
  ];

  const drawOptions = [
    { times: 1, label: "x1", sub: "DRAW", price: 480, save: null, isBest: false },
    { times: 3, label: "x3", sub: "DRAW", price: 1360, save: "ประหยัด 5%", isBest: false },
    { times: 5, label: "x5", sub: "DRAW", price: 2200, save: "ประหยัด 8%", isBest: false },
    { times: 10, label: "x10", sub: "DRAW", price: 4200, save: "ประหยัด 12%", isBest: true },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAFA] pb-56 font-sans overflow-x-hidden">
      
      {/* ── Original Top Navigation ── */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors">
            <ChevronLeft size={24} strokeWidth={2.5} />
          </Link>
          <h1 className="font-bold text-gray-900 text-sm md:text-base truncate px-4 flex-1 text-center">
            ซีรีส์ซองการ์ดโปเกมอน
          </h1>
          <div className="flex items-center gap-1 text-gray-600">
            <button className="hover:bg-gray-100 p-1.5 rounded-lg transition-colors"><HelpCircle size={20} strokeWidth={2} /></button>
            <button className="hover:bg-gray-100 p-1.5 rounded-lg transition-colors"><Headphones size={20} strokeWidth={2} /></button>
            <button className="hover:bg-gray-100 p-1.5 rounded-lg transition-colors"><Share size={20} strokeWidth={2} /></button>
          </div>
        </div>
      </div>

      {/* ── Live Winners & User Bar ── */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center justify-between text-sm shadow-sm relative z-40">
        {/* Live Winners Ticker */}
        <div className="flex items-center gap-4 flex-1 overflow-hidden">
          <div className="flex items-center gap-1.5 text-red-600 font-bold text-[10px] sm:text-xs bg-red-50 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full whitespace-nowrap border border-red-100 shadow-inner shrink-0">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500 animate-pulse" />
            LIVE WINNERS
          </div>
          <div className="flex gap-6 overflow-hidden relative w-full h-8 items-center">
             <div className="flex gap-6 animate-[marquee_20s_linear_infinite] whitespace-nowrap opacity-90 hover:[animation-play-state:paused] absolute left-0">
               {winners.map((w, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full border border-gray-100 shadow-sm">
                    <img src={w.avatar} className="w-5 h-5 rounded-full bg-white" alt="" />
                    <span className="font-bold text-gray-700 text-xs">{w.name}</span>
                    <span className="text-gray-500 text-xs">ได้ {w.item}</span>
                    <span className="text-gray-400 text-[10px] ml-1">{w.time}</span>
                  </div>
               ))}
               {winners.map((w, i) => (
                  <div key={`copy-${i}`} className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full border border-gray-100 shadow-sm">
                    <img src={w.avatar} className="w-5 h-5 rounded-full bg-white" alt="" />
                    <span className="font-bold text-gray-700 text-xs">{w.name}</span>
                    <span className="text-gray-500 text-xs">ได้ {w.item}</span>
                    <span className="text-gray-400 text-[10px] ml-1">{w.time}</span>
                  </div>
               ))}
             </div>
          </div>
        </div>

      </div>

      <div className="max-w-6xl mx-auto w-full px-4 pt-6 pb-4 flex flex-col gap-5">

        {/* ── Hero Section ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-10 relative flex flex-col lg:flex-row items-center justify-between gap-8 z-10">
           {/* Background Decorations */}
           <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden rounded-2xl z-0">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[radial-gradient(circle,rgba(254,226,226,0.8)_0%,rgba(255,255,255,0)_70%)]" />
              {/* Confetti */}
              <div className="absolute top-1/4 left-1/4 w-3 h-8 bg-red-400/40 rotate-45 rounded-sm" />
              <div className="absolute top-1/3 right-1/4 w-4 h-4 bg-red-500/40 rotate-12 rounded-sm" />
              <div className="absolute bottom-1/4 left-1/3 w-3 h-3 bg-red-400/50 rounded-full" />
              <div className="absolute bottom-1/3 right-1/3 w-2 h-6 bg-red-300/60 -rotate-12 rounded-sm" />
           </div>

           {/* Left Content */}
           <div className="relative z-10 flex flex-col items-start gap-3 flex-1 w-full lg:w-auto">
              <div className="bg-gradient-to-r from-red-50 to-white text-red-600 text-xs font-bold px-3 py-1.5 rounded-full border border-red-100 shadow-sm">
                ซีรีส์ซองการ์ดโปเกมอนสุดพิเศษ!
              </div>
              <div className="flex flex-col mt-2">
                 <h1 className="text-5xl lg:text-7xl font-black italic text-gray-900 leading-[0.85] tracking-tighter drop-shadow-sm">
                   HIGH
                 </h1>
                 <h1 className="text-5xl lg:text-7xl font-black italic text-red-600 leading-[0.85] tracking-tighter drop-shadow-sm mt-1">
                   DROPS
                 </h1>
              </div>
              <p className="text-gray-500 font-semibold text-base mt-2">
                ลุ้นของหายาก ระดับตำนาน
              </p>
              
              <div className="flex items-center gap-3 mt-4">
                 <button className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-[0_4px_14px_0_rgb(220,38,38,0.39)] transition-transform active:scale-95 text-sm">
                    <span className="drop-shadow-sm font-sans">฿</span> 480
                 </button>
                 <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition-colors flex items-center gap-1 text-sm shadow-sm">
                    ดูรายละเอียด <ChevronRight size={16} />
                 </button>
              </div>


           </div>

           {/* Center Gacha Box */}
           <div className="relative z-10 flex-[1.5] flex justify-center items-center h-[280px] lg:h-[380px] w-full">
              {/* Podium Rings */}
              <div className="absolute bottom-4 lg:bottom-10 w-[250px] lg:w-[350px] h-[60px] lg:h-[80px] border-[6px] border-red-500/10 rounded-[100%] shadow-[inset_0_0_20px_rgba(239,68,68,0.1)]" />
              <div className="absolute bottom-6 lg:bottom-14 w-[200px] lg:w-[280px] h-[50px] lg:h-[60px] border-4 border-red-400/30 rounded-[100%] bg-white/40 backdrop-blur-sm" />
              <div className="absolute bottom-8 lg:bottom-16 w-[150px] lg:w-[200px] h-[40px] lg:h-[40px] bg-red-100/80 rounded-[100%] shadow-[0_0_30px_rgba(239,68,68,0.4)]" />
              
              <img
                src="/product/pokemon.webp" // Original box placeholder
                alt="Gacha Box"
                className="relative z-10 w-56 lg:w-72 object-contain drop-shadow-[0_20px_30px_rgba(220,38,38,0.4)] hover:-translate-y-2 transition-transform duration-500 ease-out"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://via.placeholder.com/300/ffffff/ff0000?text=GACHA+BOX";
                }}
              />
           </div>

           {/* Right Info Cards */}
           <div className="relative z-10 flex flex-col gap-3 flex-1 w-full lg:w-auto">
              {/* Drop Rates Card */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-100 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-3">
                 <h3 className="font-bold text-gray-800 text-sm">โอกาสในการได้รับ</h3>
                 <div className="flex flex-col gap-2.5">
                    {dropRates.map((d) => (
                       <div key={d.label} className="flex items-center justify-between bg-gray-50/50 rounded-lg px-2 py-1">
                          <div className="flex items-center gap-2">
                             <div className={`w-3.5 h-3.5 rounded-sm flex items-center justify-center rotate-45 ${d.bgIcon} overflow-hidden shadow-sm`}>
                                <div className={`w-1.5 h-1.5 ${d.iconColor}`} />
                             </div>
                             <span className={`font-black text-xs ${d.color} tracking-wide`}>{d.label}</span>
                          </div>
                          <span className={`font-black text-sm ${d.color}`}>{d.pct}</span>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Guarantee Card */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-100 p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex items-center justify-between">
                 <div className="flex flex-col flex-1 pr-3">
                    <h3 className="font-black text-gray-800 text-sm">การันตี 100%</h3>
                    <p className="text-gray-400 text-[10px] font-semibold mt-0.5">เมื่อเปิดครบ 100 ครั้ง</p>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="text-red-600 font-black text-sm">20 <span className="text-gray-300 font-bold mx-1">/</span> <span className="text-gray-500 font-bold">100</span></span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-100 h-2 rounded-full mt-2 overflow-hidden shadow-inner">
                       <div className="bg-gradient-to-r from-red-500 to-red-600 h-full rounded-full relative" style={{ width: "20%" }}>
                          <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_25%,rgba(255,255,255,0.2)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.2)_75%,rgba(255,255,255,0.2)_100%)] bg-[length:10px_10px] animate-[progress_1s_linear_infinite]" />
                       </div>
                    </div>
                 </div>
                 <div className="w-14 h-14 bg-gradient-to-br from-red-50 to-white rounded-xl flex items-center justify-center shadow-sm border border-red-100 shrink-0">
                    <span className="text-3xl drop-shadow-sm">🎁</span>
                 </div>
              </div>
           </div>
        </div>

        {/* ── Middle Stats Bar ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex flex-wrap md:flex-nowrap items-center justify-between gap-4">
           <div className="flex-1 flex items-center justify-center min-w-[80px]">
              <div className="flex flex-col items-center">
                 <span className="font-black text-xl text-gray-900 leading-none">SP</span>
                 <span className="text-gray-500 text-xs font-bold mt-1">10%</span>
              </div>
           </div>
           
           <div className="flex-[2] flex justify-center w-full md:w-auto order-last md:order-none min-w-[200px]">
              <div className="bg-red-50 text-red-600 px-6 py-2.5 rounded-full font-black flex items-center gap-2 border border-red-100 shadow-sm text-sm">
                 <Zap size={16} className="fill-red-600" />
                 สุ่มครั้งที่ 1253279
              </div>
           </div>

           <div className="flex-1 flex items-center justify-center min-w-[80px]">
              <div className="flex flex-col items-center">
                 <span className="font-black text-xl text-gray-900 leading-none">B</span>
                 <span className="text-gray-500 text-xs font-bold mt-1">90%</span>
              </div>
           </div>

           <div className="pr-1 flex justify-end">
              <button className="bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-1.5 hover:bg-red-700 transition-colors shadow-sm text-sm">
                 <History size={16} /> ประวัติ
              </button>
           </div>
        </div>

        {/* ── Top Rewards Section ── */}
        <div className="mt-2 bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative group/slider">
           <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                 <Flame size={22} className="text-red-500 fill-red-500" />
                 <h2 className="font-black text-xl text-gray-900 tracking-tight">TOP REWARDS</h2>
              </div>
              
              <div className="flex items-center gap-2">
                 <div className="hidden sm:flex items-center gap-1 mr-2 opacity-0 group-hover/slider:opacity-100 transition-opacity">
                    <button onClick={() => scroll('left')} className="p-1.5 rounded-full border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors shadow-sm">
                       <ChevronLeft size={16} strokeWidth={2.5} />
                    </button>
                    <button onClick={() => scroll('right')} className="p-1.5 rounded-full border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors shadow-sm">
                       <ChevronRight size={16} strokeWidth={2.5} />
                    </button>
                 </div>
                 <button className="text-[11px] font-bold text-gray-600 hover:text-gray-900 flex items-center gap-0.5 bg-white border border-gray-200 px-3 py-1.5 rounded-full shadow-sm hover:bg-gray-50 transition-colors shrink-0">
                    ดูของรางวัลทั้งหมด <ChevronRight size={14} />
                 </button>
              </div>
           </div>

           {/* Horizontal Scrollable List */}
           <div ref={scrollRef} className="flex overflow-x-auto gap-4 pb-4 snap-x [&::-webkit-scrollbar]:hidden scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {topRewards.map((reward) => (
                 <div key={reward.id} className={`snap-start min-w-[150px] max-w-[150px] bg-white rounded-xl border-2 ${reward.borderColor} p-3 flex flex-col relative hover:shadow-md transition-shadow cursor-pointer group`}>
                    <div className={`absolute top-2 left-2 ${reward.bgBadge} ${reward.color} text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider z-10`}>
                       {reward.rank}
                    </div>
                    <div className="h-[140px] mt-6 flex items-center justify-center overflow-hidden rounded-lg bg-gray-50/50 group-hover:bg-gray-100 transition-colors p-2">
                       <img 
                          src={reward.image} 
                          alt={reward.name} 
                          className="w-full h-full object-contain mix-blend-multiply drop-shadow-md group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                             (e.target as HTMLImageElement).src = "https://via.placeholder.com/150/f3f4f6/9ca3af?text=ITEM";
                          }}
                       />
                    </div>
                    <div className="mt-4 flex flex-col gap-1 text-center">
                       <p className="font-bold text-gray-800 text-xs line-clamp-2 leading-tight h-8">{reward.name}</p>
                       <p className={`font-black text-sm ${reward.color}`}>{reward.chance}</p>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </div>

      {/* ── Fixed Bottom Draw Bar ── */}
      <div className="fixed bottom-0 left-0 lg:left-[17rem] xl:left-[18rem] right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.06)]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col xl:flex-row items-center gap-4 xl:gap-6">
          
          {/* Draw options */}
          <div className="flex items-center gap-2 w-full xl:flex-[1.5]">
             {drawOptions.map((opt) => (
                <button
                   key={opt.times}
                   onClick={() => handleDrawClick(opt.times, opt.price)}
                   className={`flex-1 relative flex flex-col items-center justify-center py-2.5 rounded-xl border transition-all active:scale-95 ${
                      opt.isBest 
                         ? "bg-red-50/50 border-red-200 shadow-sm" 
                         : "bg-white border-gray-100 hover:bg-gray-50"
                   }`}
                >
                   {opt.isBest && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-600 to-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm flex items-center gap-0.5">
                         <Flame size={10} className="fill-white" /> BEST VALUE!
                      </div>
                   )}
                   <span className={`font-black text-lg leading-none ${opt.isBest ? 'text-gray-900' : 'text-gray-900'}`}>
                      x{opt.times}
                   </span>
                   <span className="text-[9px] font-bold text-gray-400 mb-1">DRAW</span>
                   <span className={`font-black text-sm flex items-center gap-1 ${opt.isBest ? 'text-red-600' : 'text-red-600'}`}>
                      <span className="font-sans">฿</span> {opt.price.toLocaleString()}
                   </span>
                   {opt.save ? (
                      <span className="text-[9px] font-semibold text-gray-500 mt-0.5">{opt.save}</span>
                   ) : (
                      <span className="text-[9px] font-semibold text-transparent mt-0.5">-</span>
                   )}
                </button>
             ))}
          </div>

          {/* Main CTA */}
          <div className="flex flex-col items-center w-full xl:flex-1">
             <button
                onClick={() => handleDrawClick(1, 480)}
                className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-black text-xl lg:text-2xl py-3 lg:py-4 rounded-xl shadow-[0_6px_0_#991b1b,0_10px_20px_rgba(220,38,38,0.3)] active:shadow-[0_0px_0_#991b1b] active:translate-y-[6px] transition-all flex flex-col items-center justify-center group"
             >
                <div className="flex items-center gap-2">
                   <Flame size={24} className="fill-yellow-400 text-yellow-400 group-hover:scale-110 transition-transform" />
                   เปิดกล่องเลย!
                </div>
                <span className="text-xs font-semibold text-red-100 mt-1 opacity-90 drop-shadow-sm">ลุ้นของหายากระดับตำนาน</span>
             </button>
             <div className="flex items-center gap-1.5 mt-3 lg:mt-4 text-gray-500 text-[10px] sm:text-xs font-bold">
                <CheckCircle2 size={14} className="text-red-500" /> การันตีของหายากทุก 100 ครั้ง
             </div>
          </div>
        </div>
      </div>

      {/* ── Payment Modal ── */}
      {isPaymentModalOpen && selectedDraw && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsPaymentModalOpen(false)}
        >
          <div
            className="bg-[#F8F8F8] w-full max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-300 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between bg-white border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-900">ยืนยันการชำระเงิน</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">แอนิเมชันการสุ่ม</span>
                <button 
                  onClick={() => setPlayAnimation(!playAnimation)}
                  className={`w-10 h-6 rounded-full relative shadow-inner flex items-center p-0.5 transition-colors ${playAnimation ? 'bg-red-600' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${playAnimation ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
            {/* Body */}
            <div className="p-4 flex flex-col gap-3">
              <div className="bg-gray-900 text-white rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden shadow-lg border border-gray-800">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <div className="flex items-center gap-2 mb-2 relative z-10">
                  <Wallet size={16} className="text-gray-400" />
                  <span className="text-sm font-bold text-gray-300">ยอดเงินคงเหลือในกระเป๋า</span>
                </div>
                <div className="flex items-end justify-between mt-2 relative z-10">
                  <span className="text-3xl font-black tracking-tight text-white flex items-center gap-2"><span className="font-sans">฿</span> {balance.toLocaleString()}</span>
                  <button className="bg-white text-gray-900 font-bold text-sm px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-1 shadow-sm">
                    + เติมเงิน
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="bg-red-50 text-red-600 p-2 rounded-xl"><Ticket size={20} /></div>
                  <span className="font-bold text-gray-800 text-sm">คูปอง</span>
                </div>
                <span className="text-sm font-bold text-gray-400 hover:text-gray-600 cursor-pointer">ไม่มีคูปอง ›</span>
              </div>
              <div className="flex items-start gap-2 px-2 mt-2">
                <ShieldCheck size={16} className="text-gray-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-gray-500 leading-relaxed font-semibold">
                  ระบบการสุ่มของแพลตฟอร์มเราได้รับการรับรองจากหน่วยงานมาตรฐาน มั่นใจได้ว่าการสุ่มรางวัลในทุกครั้งมีความยุติธรรมและโปร่งใส 100%
                </p>
              </div>
            </div>
            {/* Footer */}
            <div className="bg-white p-5 border-t border-gray-100 flex flex-col gap-4">
              <div className="flex items-end gap-2 px-1">
                <span className="text-sm font-bold text-gray-500">ทั้งหมด <span className="text-gray-900 text-lg mx-1">{selectedDraw.times}</span> ครั้ง</span>
                <span className="text-2xl font-black text-red-600 ml-auto flex items-center gap-1"><span className="font-sans">฿</span> {selectedDraw.price.toLocaleString()}</span>
              </div>
              {balance >= selectedDraw.price ? (
                <button 
                  onClick={() => {
                    setIsPaymentModalOpen(false);
                    if (playAnimation) {
                      setIsAnimating(true);
                    } else {
                      setShowResult(true);
                    }
                  }}
                  className="w-full bg-red-600 text-white hover:bg-red-700 font-black py-4 rounded-xl text-sm transition-colors shadow-sm"
                >
                  ยืนยันการชำระเงิน
                </button>
              ) : (
                <button className="w-full bg-gray-100 text-gray-400 font-black py-4 rounded-xl text-sm transition-colors cursor-not-allowed">
                  ยอดเงินไม่เพียงพอ (โปรดเติมเงิน)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Animation Overlay ── */}
      {isAnimating && (
        <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center">
          <video 
            src="/animationbox.mp4" 
            autoPlay 
            playsInline
            className="w-full h-full object-cover sm:object-contain"
            onEnded={() => {
              setIsAnimating(false);
              setShowResult(true);
            }}
          />
          <button 
            onClick={() => {
              setIsAnimating(false);
              setShowResult(true);
            }}
            className="absolute top-6 right-6 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full font-bold text-sm backdrop-blur-md transition-colors"
          >
            ข้าม (Skip)
          </button>
        </div>
      )}

      {/* ── Result Modal (Placeholder) ── */}
      {showResult && (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowResult(false)}>
           <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <h2 className="text-3xl font-black text-gray-900 mb-2">ยินดีด้วย!</h2>
              <p className="text-gray-500 font-semibold mb-6 text-sm">คุณได้รับไอเทมจากการสุ่มครั้งนี้</p>
              
              <div className="w-40 h-40 mx-auto bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl mb-6 flex items-center justify-center border-2 border-yellow-200 shadow-inner relative overflow-hidden">
                 <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.4)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_2s_infinite]" />
                 <span className="text-6xl drop-shadow-md relative z-10">🎁</span>
              </div>
              
              <button 
                 onClick={() => setShowResult(false)}
                 className="w-full bg-red-600 text-white font-black text-lg py-3.5 rounded-xl hover:bg-red-700 transition-transform active:scale-95 shadow-[0_4px_14px_0_rgb(220,38,38,0.39)]"
              >
                 รับของรางวัล
              </button>
           </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}} />
    </div>
  );
}

