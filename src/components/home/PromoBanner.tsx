import React from 'react';

export default function PromoBanner() {
  return (
    <div className="rounded-xl p-5 text-white shadow-lg relative overflow-hidden shadow-primary/20 cursor-pointer group">
      <div className="absolute inset-0 bg-[url('https://pub-ee29977ae9524b05b628923eee00188a.r2.dev/banner/bannerright.png')] bg-cover bg-center scale-[1.15] origin-center"></div>
      <div className="relative z-10">
        <h3 className="font-bold text-lg leading-tight">เติมครั้งแรก<br/>รับโบนัสเพิ่มสูงสุด</h3>
        <p className="text-3xl font-black mt-1 text-yellow-300 drop-shadow-md">+20%</p>
        <button className="mt-4 bg-white text-primary font-bold text-xs px-4 py-2 rounded-lg shadow-md group-hover:scale-105 transition-transform">
          เติมเงินเลย
        </button>
      </div>
    </div>
  );
}
