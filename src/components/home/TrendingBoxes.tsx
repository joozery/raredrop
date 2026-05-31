import React from 'react';
import Link from 'next/link';
import { Flame } from "lucide-react";

export default function TrendingBoxes() {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          กล่องสุดฮิต <Flame className="text-orange-500 fill-orange-500" size={20} />
        </h2>
      </div>
      
      <div className="relative group">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-3 pr-8 -mx-2 px-2">
          <button className="bg-[#DC2626] text-white text-[11px] font-bold px-4 py-1.5 rounded-lg whitespace-nowrap shadow-sm shrink-0">ทั้งหมด</button>
          {[
            { name: 'Anime', icon: '🎭' },
            { name: 'Labubu', icon: '🐰' },
            { name: 'Pokémon', icon: '⚡' },
            { name: 'Bearbrick', icon: '🐻' },
            { name: 'Sneaker', icon: '👟' },
            { name: 'Luxury', icon: '💎' },
            { name: 'TCG', icon: '🎴' },
            { name: 'Gaming', icon: '🎮' }
          ].map(cat => (
            <button key={cat.name} className="bg-white text-gray-800 border border-gray-200/80 text-[11px] font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-50 whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <span className="text-[13px]">{cat.icon}</span> {cat.name}
            </button>
          ))}
        </div>
        
        {/* Right Scroll Arrow Overlay */}
        <div className="absolute right-0 top-0 bottom-3 w-16 bg-gradient-to-l from-[#F8F8F8] via-[#F8F8F8]/80 to-transparent pointer-events-none flex items-center justify-end pr-1">
          <button className="w-7 h-7 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-sm pointer-events-auto hover:bg-gray-50 text-gray-500 transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      </div>

        {/* Items Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-1">
          {[
            { id: 1, name: "Anime Legends Box", price: 99, tag: "ฮิตสุด", img: "AnimeBox" },
            { id: 2, name: "Pokémon Ultimate Box", price: 129, tag: "ใหม่", img: "PokemonBox" },
            { id: 3, name: "Labubu Secret Box", price: 199, tag: "ลิมิเต็ด", img: "LabubuBox" },
            { id: 4, name: "Bearbrick 100% Box", price: 149, tag: "", img: "BearBox" },
            { id: 5, name: "Sneaker Mystery Box", price: 299, tag: "ยอดนิยม", img: "SneakerBox" }
          ].map(box => (
            <Link href={`/boxes/${box.id}`} key={box.id} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow group relative cursor-pointer flex flex-col">
              {box.tag && (
                <span className="absolute top-2 left-2 z-10 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  {box.tag}
                </span>
              )}
              <div className={`w-full aspect-square rounded-lg flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-105 overflow-hidden bg-gray-50`}>
                <img src={`/product/pokemon.webp`} alt={box.name} className="w-full h-full object-cover mix-blend-multiply opacity-90" />
              </div>
              <h3 className="font-bold text-gray-900 text-[13px] text-center leading-tight mb-1">{box.name}</h3>
              <p className="text-gray-500 text-[11px] mb-3 text-center">เริ่มต้น <span className="text-primary font-bold text-sm">฿{box.price}</span></p>
              <button className="mt-auto w-full bg-primary text-white font-bold py-2 rounded-lg text-xs transition-transform active:scale-95 shadow-sm">
                เปิดกล่อง
              </button>
            </Link>
          ))}
        </div>
    </section>
  );
}
