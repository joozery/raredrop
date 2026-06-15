import React from 'react';

export default function HeroBanner() {
  return (
    <div className="relative w-full h-80 bg-[url('https://pub-ee29977ae9524b05b628923eee00188a.r2.dev/banner/cover/cover.png')] bg-cover bg-center rounded-xl overflow-hidden border border-red-100 p-10 flex items-center shadow-sm">
      <div className="relative z-10 max-w-lg">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
          เปิดลุ้นของสะสมสุดพิเศษ<br/>
          <span className="text-primary flex items-center gap-2 mt-2">
            จากทั่วโลก <span className="text-primary text-2xl">✦</span>
          </span>
        </h1>
        <p className="text-gray-600 mt-4 text-base">
          กล่องสุ่มหลากหลาย สินค้าพรีเมียม<br/>ลุ้นได้จริง ส่งถึงมือคุณ
        </p>
        <div className="flex gap-4 mt-8">
          <button className="bg-primary text-white font-bold py-3 px-8 rounded-lg shadow-lg shadow-primary/30 hover:bg-primary/90 transition-transform active:scale-95">
            เปิดกล่องเลย
          </button>
          <button className="bg-white text-gray-900 font-bold py-3 px-8 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors">
            ดูทั้งหมด
          </button>
        </div>
      </div>
    </div>
  );
}
