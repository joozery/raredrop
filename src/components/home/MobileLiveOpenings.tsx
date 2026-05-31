import React from 'react';

export default function MobileLiveOpenings() {
  const feeds = [
    { u: "Player123", i: "Labubu Secret", p: "฿12,900" },
    { u: "HunterX", i: "Pikachu PSA 10", p: "฿9,800" },
    { u: "MightyBear", i: "Bearbrick 400%", p: "฿6,500" },
    { u: "SneakerHead", i: "Nike Dunk Low", p: "฿4,200" }
  ];

  return (
    <section className="block lg:hidden mt-2 mb-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold flex items-center gap-2">
          ไลฟ์เปิดกล่อง
          <span className="bg-red-100 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" /> LIVE
          </span>
        </h3>
        <button className="text-[11px] text-primary font-semibold hover:underline flex items-center gap-1">ดูทั้งหมด ›</button>
      </div>
      
      <div className="flex overflow-x-auto gap-3 hide-scrollbar -mx-4 px-4 pb-2">
        {feeds.map((feed, i) => (
          <div key={i} className="w-[130px] shrink-0 bg-white border border-gray-100 rounded-xl p-3 shadow-sm flex flex-col items-center text-center">
            <div className="flex items-center justify-center gap-2 mb-2 w-full">
               <div className="w-10 h-10 rounded-full bg-gray-100 shrink-0 border-2 border-white shadow-sm overflow-hidden">
                 <img src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${feed.u}`} alt={feed.u} className="w-full h-full object-cover" />
               </div>
               <div className="w-10 h-10 bg-gray-100 rounded-md shrink-0 overflow-hidden shadow-sm border border-gray-100">
                 <img src={`https://picsum.photos/seed/${feed.i.replace(/\s+/g, '')}/100/100`} alt={feed.i} className="w-full h-full object-cover" />
               </div>
            </div>
            <p className="text-xs font-bold text-gray-900 truncate w-full">{feed.u}</p>
            <p className="text-[9px] text-gray-500 truncate w-full mt-0.5">เปิดได้ {feed.i}</p>
            <p className="text-[10px] text-primary font-semibold mt-1">{feed.p}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
