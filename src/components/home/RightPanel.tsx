"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, Truck, Users, Package, Headset, Scale, Gift, ShoppingBag } from "lucide-react";

export default function RightPanel() {

  useEffect(() => {
    // Other initializations if needed
  }, []);

  return (
    <div className="w-[320px] shrink-0 flex flex-col gap-6 hide-scrollbar">

      {/* Why LuxusX */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h3 className="font-bold mb-4">ทำไมต้อง LuxusX?</h3>
        <div className="grid grid-cols-4 gap-2">
          <div className="p-2 bg-gray-50 rounded-lg text-center flex flex-col items-center gap-1.5">
            <ShieldCheck size={16} className="text-primary" />
            <p className="text-[8px] font-medium text-gray-800 leading-tight">ของแท้ 100%<br /><span className="text-gray-400">ผ่านการคัดสรร</span></p>
          </div>
          <div className="p-2 bg-gray-50 rounded-lg text-center flex flex-col items-center gap-1.5">
            <Truck size={16} className="text-primary" />
            <p className="text-[8px] font-medium text-gray-800 leading-tight">จัดส่งทั่วไทย<br /><span className="text-gray-400">รวดเร็ว ปลอดภัย</span></p>
          </div>
          <div className="p-2 bg-gray-50 rounded-lg text-center flex flex-col items-center gap-1.5">
            <Scale size={16} className="text-primary" />
            <p className="text-[8px] font-medium text-gray-800 leading-tight">ระบบยุติธรรม<br /><span className="text-gray-400">โอกาสเท่าเทียม</span></p>
          </div>
          <div className="p-2 bg-gray-50 rounded-lg text-center flex flex-col items-center gap-1.5">
            <Headset size={16} className="text-primary" />
            <p className="text-[8px] font-medium text-gray-800 leading-tight">ซัพพอร์ต 24/7<br /><span className="text-gray-400">พร้อมดูแลคุณ</span></p>
          </div>
        </div>
      </div>



    </div>
  );
}
