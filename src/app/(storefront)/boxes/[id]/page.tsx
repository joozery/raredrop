"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Users, History, Trophy, HelpCircle, Headphones, Share, Wallet, Ticket, ShieldCheck, X } from "lucide-react";

export default function BoxDetailPage({ params }: { params: { id: string } }) {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedDraw, setSelectedDraw] = useState<{times: number, price: number} | null>(null);

  const boxPrice = 49; // Mock base price

  const handleDrawClick = (times: number) => {
    setSelectedDraw({ times, price: boxPrice * times });
    setIsPaymentModalOpen(true);
  };

  // Mock data for the items in the box
  const items = [
    { id: 1, name: 'ชุดเสริม MEGA "Ninja S..."', price: "480.00", chance: "2%", rank: "SP", color: "bg-red-600" },
    { id: 2, name: 'ชุดเสริม Scarlet & Viol...', price: "450.00", chance: "2%", rank: "SP", color: "bg-red-600" },
    { id: 3, name: 'ชุดเสริม Scarlet & Viol...', price: "420.00", chance: "2%", rank: "SP", color: "bg-red-600" },
    { id: 4, name: "Pokemon Dark Pack", price: "400.00", chance: "2%", rank: "SP", color: "bg-red-600" },
    { id: 5, name: "Pokemon White Pack", price: "380.00", chance: "2%", rank: "SP", color: "bg-red-600" },
    { id: 6, name: "Pokemon Basic Card", price: "50.00", chance: "90%", rank: "B", color: "bg-purple-500" },
  ];

  const recentWinners = [
    { id: 1, name: "saypoe", time: "3 นาทีที่แล้ว", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=saypoe" },
    { id: 2, name: "saypoe", time: "3 นาทีที่แล้ว", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=saypoe" },
    { id: 3, name: "YingOsihi", time: "3 นาทีที่แล้ว", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=ying" },
    { id: 4, name: "saypoe", time: "3 นาทีที่แล้ว", avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=saypoe" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 lg:bg-[#F8F8F8] relative pb-24 font-sans">
      {/* Top Navigation */}
      <div className="sticky top-0 z-50 bg-slate-50 lg:bg-[#F8F8F8] border-b lg:border-none border-slate-200">
        <div className="max-w-5xl mx-auto w-full px-4 py-3 flex items-center justify-between">
          <Link href="/" className="text-slate-800 active:bg-slate-200 hover:bg-slate-200 transition-colors p-1.5 rounded-lg">
            <ChevronLeft size={24} strokeWidth={2.5} />
          </Link>
          <h1 className="flex-1 text-center font-bold text-slate-900 truncate px-4">ซีรีส์ซองการ์ดโปเกมอนสุ...</h1>
          <div className="flex items-center gap-3 text-slate-800">
            <button className="hover:bg-slate-200 p-1.5 rounded-lg transition-colors"><HelpCircle size={22} strokeWidth={2} /></button>
            <button className="hover:bg-slate-200 p-1.5 rounded-lg transition-colors"><Headphones size={22} strokeWidth={2} /></button>
            <button className="hover:bg-slate-200 p-1.5 rounded-lg transition-colors"><Share size={22} strokeWidth={2} /></button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full p-4 flex flex-col gap-4">
        {/* Two Column Layout for Top Section */}
        <div className="flex flex-row items-stretch gap-2 md:gap-4 lg:gap-8">
          
          {/* Left Column: Winners & Online */}
          <div className="flex-1 flex flex-col gap-2">
            {recentWinners.map((w) => (
              <div key={w.id} className="bg-white rounded-lg p-2 lg:p-3 flex items-center justify-between shadow-sm border border-slate-100">
                 <div className="flex items-center gap-2 lg:gap-3">
                   <img src={w.avatar} className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-slate-100" alt="avatar" />
                   <span className="font-bold text-slate-800 text-xs lg:text-sm">{w.name}</span>
                 </div>
                 <div className="flex items-center gap-2 lg:gap-3">
                   <span className="text-[10px] lg:text-xs text-slate-400">{w.time}</span>
                   <span className="bg-red-600 text-white text-[9px] lg:text-[10px] font-black px-1.5 lg:px-2 py-0.5 rounded">SP</span>
                 </div>
              </div>
            ))}
            
            {/* Online Users */}
            <div className="bg-white rounded-lg p-2 lg:p-3 flex items-center gap-2 shadow-sm border border-slate-100 mt-1 lg:mt-2">
               <div className="bg-orange-500 rounded p-1 lg:p-1.5">
                 <Users size={12} className="text-white lg:w-4 lg:h-4" />
               </div>
               <div className="flex -space-x-1.5 lg:-space-x-2">
                 <img src="https://api.dicebear.com/9.x/avataaars/svg?seed=A" className="w-5 h-5 lg:w-6 lg:h-6 rounded-full border border-white bg-slate-200" />
                 <img src="https://api.dicebear.com/9.x/avataaars/svg?seed=B" className="w-5 h-5 lg:w-6 lg:h-6 rounded-full border border-white bg-slate-200" />
                 <img src="https://api.dicebear.com/9.x/avataaars/svg?seed=C" className="w-5 h-5 lg:w-6 lg:h-6 rounded-full border border-white bg-slate-200" />
               </div>
               <span className="text-[11px] lg:text-xs font-medium text-slate-600">
                 <span className="font-bold text-slate-800">4</span> คนกำลังออนไลน์ ›
               </span>
            </div>
          </div>

          {/* Right Column: Graphic & Plate */}
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-2 lg:py-8">
            {/* Mock HIGH DROPS Graphic */}
            <div className="relative w-full flex items-center justify-center">
               <div className="absolute inset-0 blur-2xl bg-orange-400/20 rounded-full scale-[2] lg:scale-[3]"></div>
               <h2 className="text-4xl lg:text-5xl font-black italic text-center drop-shadow-lg z-10 leading-none">
                 <span className="text-orange-500 drop-shadow-[0_2px_0_#FFF] lg:drop-shadow-[0_3px_0_#FFF]">HIGH</span><br/>
                 <span className="text-red-600 drop-shadow-[0_2px_0_#FFF] lg:drop-shadow-[0_3px_0_#FFF]">DROPS</span>
               </h2>
               {/* Decorative sparks */}
               <div className="absolute top-0 right-10 lg:right-20 w-3 h-6 bg-orange-500 rotate-45 rounded-full"></div>
               <div className="absolute bottom-4 left-10 lg:left-20 w-4 h-4 bg-red-500 rotate-12 rounded-full"></div>
            </div>

            {/* Spinning Plate */}
            <div className="w-[140px] lg:w-[180px] h-10 lg:h-12 bg-slate-200 rounded-[100%] shadow-inner flex items-center justify-center relative overflow-hidden mt-8 lg:mt-12 border-b-[4px] lg:border-b-[6px] border-slate-300">
               <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-transparent"></div>
               <div className="bg-slate-300/50 px-3 py-1 rounded-full z-10 text-[8px] lg:text-[10px] text-slate-600 font-bold border border-slate-300/50">RAREDROP</div>
            </div>
          </div>

        </div>

        {/* Drop Rate Stats */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 lg:p-6 relative mt-4 lg:mt-8">
          <div className="absolute -top-4 lg:-top-5 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 md:px-8 py-1.5 lg:py-2 rounded-full font-black text-sm md:text-xl shadow-lg flex items-center gap-1.5 border-2 border-yellow-500 whitespace-nowrap">
            <span className="text-yellow-400">⚡</span> สุ่มครั้งที่ 1253279
          </div>
          
          <div className="pt-4 lg:pt-6 flex items-center justify-between text-center">
            <div className="flex-1 flex flex-col items-center">
              <span className="font-black text-slate-800 lg:text-xl">SP</span>
              <span className="text-xs lg:text-sm text-slate-500 font-bold">10%</span>
            </div>
            <div className="w-px h-8 lg:h-12 bg-slate-200 mx-2 lg:mx-4"></div>
            <div className="flex-1 flex flex-col items-center">
              <span className="font-black text-slate-800 lg:text-xl">B</span>
              <span className="text-xs lg:text-sm text-slate-500 font-bold">90%</span>
            </div>
            <div className="flex-1 flex justify-end">
              <button className="bg-red-600 text-white flex items-center gap-1.5 px-3 lg:px-5 py-2 lg:py-2.5 rounded-lg text-xs lg:text-sm font-bold shadow-sm active:scale-95 transition-transform hover:bg-red-700">
                <History size={16} /> ประวัติ
              </button>
            </div>
          </div>
        </div>

        {/* Items Grid */}
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 lg:gap-4 mt-4 lg:mt-6">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl lg:rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-slate-100 relative group flex flex-col">
              {/* Rank Tag */}
              <div className={`absolute top-0 right-0 ${item.color} text-white text-[10px] lg:text-xs font-black px-2 lg:px-3 py-0.5 lg:py-1 rounded-bl-lg lg:rounded-bl-xl z-10 shadow-sm`}>
                {item.rank}
              </div>
              
              {/* Chance Tag */}
              <div className="absolute bottom-[65px] lg:bottom-[75px] right-2 bg-slate-900/70 backdrop-blur-sm text-white text-[9px] lg:text-[10px] font-bold px-1.5 lg:px-2 py-0.5 rounded z-10">
                {item.chance}
              </div>

              {/* Image Container */}
              <div className="w-full aspect-[3/4] bg-[#F0F2F5] relative overflow-hidden flex items-center justify-center p-2 lg:p-4">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-400 to-transparent"></div>
                <img 
                  src="/product/item/goods1878.webp" 
                  alt={item.name} 
                  className="w-full h-full object-contain relative z-0 transition-transform duration-300 group-hover:scale-110 drop-shadow-md"
                />
              </div>

              {/* Details */}
              <div className="p-2 lg:p-3 flex flex-col items-center text-center flex-1 justify-between bg-white z-10 relative border-t border-slate-50">
                <h3 className="text-[10px] lg:text-xs font-bold text-slate-800 leading-tight line-clamp-2 w-full">{item.name}</h3>
                <p className="text-[11px] lg:text-sm font-black text-red-600 mt-1 lg:mt-2">฿{item.price}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Fixed Draw Buttons */}
      <div className="fixed bottom-0 left-0 lg:left-72 right-0 bg-white border-t border-slate-200 p-3 lg:p-4 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
        <div className="max-w-5xl mx-auto flex items-center gap-2 lg:gap-4">
          {[1, 3, 5, 10].map((num) => (
            <button 
              key={num} 
              onClick={() => handleDrawClick(num)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl lg:rounded-2xl py-2 lg:py-3 flex flex-col items-center justify-center shadow-[0_4px_0_rgb(185,28,28)] lg:shadow-[0_6px_0_rgb(185,28,28)] active:shadow-none active:translate-y-1 transition-all"
            >
              <span className="font-black text-lg lg:text-2xl leading-none italic">x{num}</span>
              <span className="text-[10px] lg:text-xs font-bold uppercase tracking-widest mt-0.5 lg:mt-1 opacity-90">DRAW</span>
            </button>
          ))}
        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && selectedDraw && (
        <div 
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsPaymentModalOpen(false)}
        >
          <div 
            className="bg-[#F8F8F8] w-full max-w-md sm:rounded-2xl rounded-t-3xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 flex items-center justify-between bg-white border-b border-gray-100 relative">
              <h3 className="font-bold text-lg text-gray-900">ยืนยันการชำระเงิน</h3>
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500">แอนิเมชันการสุ่ม</span>
                <button className="w-10 h-6 rounded-full bg-red-600 relative transition-colors shadow-inner flex items-center p-0.5">
                  <div className="w-5 h-5 rounded-full bg-white shadow-sm transform translate-x-4 transition-transform"></div>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 flex flex-col gap-3">
              {/* Wallet Card */}
              <div className="bg-[#222] text-white rounded-xl p-4 flex flex-col justify-between relative overflow-hidden shadow-lg border border-[#333]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="flex items-center gap-2 mb-2 relative z-10">
                  <Wallet size={16} className="text-gray-300" />
                  <span className="text-sm font-medium text-gray-300">ยอดเงินคงเหลือในกระเป๋า</span>
                </div>
                <div className="flex items-end justify-between mt-2 relative z-10">
                  <span className="text-3xl font-bold tracking-tight">฿0.00</span>
                  <button className="bg-white text-gray-900 font-bold text-sm px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1 shadow-sm">
                    <span>+</span> เติมเงิน
                  </button>
                </div>
              </div>

              {/* Coupon Card */}
              <div className="bg-white rounded-xl p-4 flex items-center justify-between shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 text-red-600 p-1.5 rounded-lg">
                    <Ticket size={20} />
                  </div>
                  <span className="font-bold text-gray-800">คูปอง</span>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <span className="text-sm font-medium">ไม่มีคูปอง</span>
                  <ChevronLeft size={16} className="rotate-180" />
                </div>
              </div>

              {/* Trust Badge */}
              <div className="flex items-start gap-2 px-2 mt-2">
                <ShieldCheck size={16} className="text-gray-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                  ระบบการสุ่มของแพลตฟอร์มเราได้รับการรับรองจากหน่วยงานมาตรฐาน มั่นใจได้ว่าการสุ่มรางวัลในทุกครั้งมีความยุติธรรมและโปร่งใส 100%
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-white p-4 pb-safe border-t border-gray-100 flex flex-col gap-3">
              <div className="flex items-end gap-2 px-1">
                <span className="text-sm font-bold text-gray-500">ทั้งหมด <span className="text-gray-900 text-lg">{selectedDraw.times}</span> ครั้ง</span>
                <span className="text-xl font-black text-red-600 ml-auto">฿{selectedDraw.price.toFixed(2)}</span>
              </div>
              <button 
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl text-sm transition-colors shadow-sm"
                onClick={() => {
                  // Keep it open or redirect to top up
                }}
              >
                ยอดเงินไม่เพียงพอ (โปรดเติมเงิน)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
