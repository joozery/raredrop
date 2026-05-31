import React from 'react';

export default function MarketplacePreview() {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">ไอเท็มน่าสนใจในตลาด</h2>
        <button className="text-[11px] text-primary font-semibold hover:underline flex items-center gap-1">ดูทั้งหมด ›</button>
      </div>
      
      <div className="flex overflow-x-auto lg:grid lg:grid-cols-5 gap-3 hide-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0 pb-2 lg:pb-0">
         {[
          { id: 1, name: "Pikachu PSA 10", price: "9,800", trend: "+ 12.5%", tag: "HOT", img: "PikaCard" },
          { id: 2, name: "Labubu Secret", price: "12,900", trend: "- 4.3%", tag: "ใหม่", img: "LabubuToy" },
          { id: 3, name: "Bearbrick 400%", price: "6,500", trend: "+ 8.7%", tag: "", img: "BearbrickToy" },
          { id: 4, name: "Rolex Submariner", price: "250,000", trend: "+ 5.2%", tag: "", img: "RolexWatch" },
          { id: 5, name: "Nike Dunk Low", price: "4,200", trend: "- 2.1%", tag: "", img: "NikeShoe" }
        ].map(item => (
          <div key={item.id} className="w-[140px] shrink-0 lg:w-auto bg-white border border-gray-100 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col relative">
            {item.tag && (
              <span className="absolute top-2 left-2 z-10 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                {item.tag}
              </span>
            )}
            <div className="w-full aspect-square rounded-lg flex items-center justify-center mb-3 overflow-hidden bg-gray-50">
              <img src={`/product/pokemon.webp`} alt={item.name} className="w-full h-full object-cover mix-blend-multiply opacity-90 transition-transform duration-300 hover:scale-105" />
            </div>
            <h3 className="font-bold text-gray-900 text-xs line-clamp-1">{item.name}</h3>
            <p className="text-[9px] text-gray-400 mt-1">ราคาเริ่มต้น</p>
            <div className="mt-0.5 flex items-end justify-between">
              <span className="font-bold text-gray-900 text-sm">฿{item.price}</span>
              <span className={`text-[10px] font-bold flex items-center gap-0.5 ${item.trend.includes('+') ? 'text-green-500' : 'text-red-500'}`}>
                {item.trend.includes('+') ? '▲' : '▼'} {item.trend.replace(/[+-]/g, '').trim()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
