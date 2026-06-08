"use client";

import { useState, useEffect } from "react";
import { Wallet, TrendingUp, ArrowDownRight, ArrowUpRight, ShieldCheck, User } from "lucide-react";

export default function WalletOverview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCoinsInSystem: 0,
    totalTopups: 0,
    totalWithdraws: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real scenario, this would be an API call to aggregate data
    // For now, we simulate fetching aggregated stats
    setTimeout(() => {
      setStats({
        totalUsers: 1420,
        totalCoinsInSystem: 1542000,
        totalTopups: 2850000,
        totalWithdraws: 1308000,
      });
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">ภาพรวมกระเป๋าเงินระบบ (Wallet Overview)</h1>
        <p className="text-sm text-slate-500 mt-1">สรุปข้อมูลการเงินและเหรียญคงเหลือในระบบทั้งหมด</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
            กำลังโหลดข้อมูลเศรษฐกิจของระบบ...
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-6 shadow-lg shadow-indigo-500/20 text-white relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                <Wallet size={20} className="text-white" />
              </div>
              <h3 className="font-bold text-indigo-100 text-sm">เหรียญในระบบทั้งหมด</h3>
            </div>
            <div className="text-3xl font-black tracking-tight">{stats.totalCoinsInSystem.toLocaleString()} <span className="text-sm font-medium text-indigo-200">บาท</span></div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-indigo-200 font-medium">
              <ShieldCheck size={14} /> สำรองพร้อมจ่าย 100%
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <ArrowDownRight size={20} className="text-green-600" />
              </div>
              <h3 className="font-bold text-slate-500 text-sm">ยอดเติมเงินรวม</h3>
            </div>
            <div className="text-2xl font-black text-slate-800 tracking-tight">{stats.totalTopups.toLocaleString()} <span className="text-sm font-medium text-slate-400">บาท</span></div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-green-600 font-bold bg-green-50 w-max px-2 py-0.5 rounded-md">
              <TrendingUp size={12} /> +12.5% เดือนนี้
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <ArrowUpRight size={20} className="text-red-600" />
              </div>
              <h3 className="font-bold text-slate-500 text-sm">ยอดถอนเงินรวม</h3>
            </div>
            <div className="text-2xl font-black text-slate-800 tracking-tight">{stats.totalWithdraws.toLocaleString()} <span className="text-sm font-medium text-slate-400">บาท</span></div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              คิดเป็น 45.8% ของยอดเติม
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <User size={20} className="text-blue-600" />
              </div>
              <h3 className="font-bold text-slate-500 text-sm">ผู้เล่นที่มีเหรียญ</h3>
            </div>
            <div className="text-2xl font-black text-slate-800 tracking-tight">{stats.totalUsers.toLocaleString()} <span className="text-sm font-medium text-slate-400">บัญชี</span></div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              เฉลี่ย 1,085 บาท/บัญชี
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
