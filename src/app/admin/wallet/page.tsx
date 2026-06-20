"use client";

import { useState, useEffect } from "react";
import {
  Wallet, TrendingUp, TrendingDown, ArrowDownRight, ArrowUpRight,
  ShieldCheck, Users, Box, Store, Crown, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WalletData {
  totalCoinsInSystem: number;
  usersWithCoins: number;
  totalTopups: { amount: number; count: number };
  totalWithdraws: { amount: number; count: number };
  thisMonthTopups: number;
  lastMonthTopups: number;
  topupChangePercent: number;
  withdrawPercent: number;
  boxRevenue: { amount: number; count: number };
  marketVolume: { amount: number; count: number };
  topTopupUsers: {
    _id: string;
    name: string;
    avatar?: string;
    coins: number;
    totalTopup: number;
    count: number;
  }[];
  recentTopups: {
    _id: string;
    userId: { name: string; avatar?: string; email?: string };
    amount: number;
    balanceAfter: number;
    description?: string;
    createdAt: string;
  }[];
  coinDistribution: { label: string; count: number }[];
}

export default function WalletOverview() {
  const [data, setData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    fetch("/api/admin/wallet")
      .then((r) => r.json())
      .then((d) => { if (!d.error) setData(d); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
        <div className="flex justify-center py-20 text-slate-400 text-sm">กำลังโหลดข้อมูลการเงิน...</div>
      </div>
    );
  }

  const totalDistribution = data?.coinDistribution.reduce((s, b) => s + b.count, 0) || 1;

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">กระเป๋าเงิน (Wallet Overview)</h1>
          <p className="text-sm text-slate-500 mt-1">สรุปข้อมูลการเงินและเหรียญในระบบแบบ real-time</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm transition-colors shrink-0"
        >
          <RefreshCw size={14} />
          รีเฟรช
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Total coins */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl p-6 shadow-lg shadow-indigo-500/20 text-white relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
              <Wallet size={20} className="text-white" />
            </div>
            <h3 className="font-bold text-indigo-100 text-sm">เหรียญในระบบทั้งหมด</h3>
          </div>
          <div className="text-3xl font-black tracking-tight">
            {(data?.totalCoinsInSystem || 0).toLocaleString()}
            <span className="text-sm font-medium text-indigo-200 ml-1">บาท</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-indigo-200 font-medium">
            <ShieldCheck size={14} />
            {data?.usersWithCoins.toLocaleString()} บัญชีที่มีเหรียญ
          </div>
        </div>

        {/* Total topups */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <ArrowDownRight size={20} className="text-green-600" />
            </div>
            <h3 className="font-bold text-slate-500 text-sm">ยอดเติมเงินรวม</h3>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">
            {(data?.totalTopups.amount || 0).toLocaleString()}
            <span className="text-sm font-medium text-slate-400 ml-1">บาท</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-bold w-max px-2 py-0.5 rounded-md"
            style={{ color: (data?.topupChangePercent || 0) >= 0 ? "#16a34a" : "#dc2626", backgroundColor: (data?.topupChangePercent || 0) >= 0 ? "#f0fdf4" : "#fef2f2" }}>
            {(data?.topupChangePercent || 0) >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {(data?.topupChangePercent || 0) >= 0 ? "+" : ""}{(data?.topupChangePercent || 0).toFixed(1)}% เดือนนี้
          </div>
        </div>

        {/* Total withdraws */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <ArrowUpRight size={20} className="text-red-600" />
            </div>
            <h3 className="font-bold text-slate-500 text-sm">ยอดถอนเงินรวม</h3>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">
            {(data?.totalWithdraws.amount || 0).toLocaleString()}
            <span className="text-sm font-medium text-slate-400 ml-1">บาท</span>
          </div>
          <div className="mt-3 text-xs text-slate-500 font-medium">
            คิดเป็น {(data?.withdrawPercent || 0).toFixed(1)}% ของยอดเติมทั้งหมด
          </div>
        </div>

        {/* Users with coins */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Users size={20} className="text-blue-600" />
            </div>
            <h3 className="font-bold text-slate-500 text-sm">ผู้เล่นที่มีเหรียญ</h3>
          </div>
          <div className="text-2xl font-black text-slate-800 tracking-tight">
            {(data?.usersWithCoins || 0).toLocaleString()}
            <span className="text-sm font-medium text-slate-400 ml-1">บัญชี</span>
          </div>
          <div className="mt-3 text-xs text-slate-500 font-medium">
            เฉลี่ย {data && data.usersWithCoins > 0
              ? Math.round(data.totalCoinsInSystem / data.usersWithCoins).toLocaleString()
              : 0} บาท/บัญชี
          </div>
        </div>
      </div>

      {/* Revenue Breakdown + Coin Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Revenue Cards */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
              <Box size={22} className="text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 font-medium">รายได้จากการเปิดกล่อง</p>
              <p className="text-xl font-black text-slate-800 tracking-tight">
                {(data?.boxRevenue.amount || 0).toLocaleString()}
                <span className="text-xs font-medium text-slate-400 ml-1">บาท</span>
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-slate-400">จำนวนครั้ง</p>
              <p className="text-lg font-black text-slate-600">{(data?.boxRevenue.count || 0).toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
              <Store size={22} className="text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-slate-500 font-medium">มูลค่าตลาด (Marketplace)</p>
              <p className="text-xl font-black text-slate-800 tracking-tight">
                {(data?.marketVolume.amount || 0).toLocaleString()}
                <span className="text-xs font-medium text-slate-400 ml-1">บาท</span>
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-slate-400">ออเดอร์</p>
              <p className="text-lg font-black text-slate-600">{(data?.marketVolume.count || 0).toLocaleString()}</p>
            </div>
          </div>

          {/* This month vs last month */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-4">เปรียบเทียบยอดเติมเงิน</h3>
            <div className="flex flex-col gap-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium text-slate-500">เดือนนี้</span>
                  <span className="text-xs font-bold text-slate-800">{(data?.thisMonthTopups || 0).toLocaleString()} บาท</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{
                      width: `${Math.min(100, data && data.lastMonthTopups > 0
                        ? (data.thisMonthTopups / Math.max(data.thisMonthTopups, data.lastMonthTopups)) * 100
                        : 100)}%`
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium text-slate-500">เดือนที่แล้ว</span>
                  <span className="text-xs font-bold text-slate-800">{(data?.lastMonthTopups || 0).toLocaleString()} บาท</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-300 rounded-full"
                    style={{
                      width: `${Math.min(100, data && data.thisMonthTopups > 0
                        ? (data.lastMonthTopups / Math.max(data.thisMonthTopups, data.lastMonthTopups)) * 100
                        : 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Coin Distribution */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4">การกระจายเหรียญผู้เล่น</h3>
          {data?.coinDistribution.length ? (
            <div className="flex flex-col gap-3">
              {data.coinDistribution.map((bucket, i) => {
                const pct = Math.round((bucket.count / totalDistribution) * 100);
                const colors = ["bg-slate-200", "bg-blue-400", "bg-indigo-500", "bg-purple-500", "bg-red-500"];
                return (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-medium text-slate-500">{bucket.label} บาท</span>
                      <span className="text-xs font-bold text-slate-700">{bucket.count} คน ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", colors[i] || "bg-slate-400")} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-slate-400 text-sm">ยังไม่มีข้อมูล</div>
          )}
        </div>

        {/* Top topup users */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Crown size={16} className="text-amber-500" />
            ผู้เล่นที่เติมเงินสูงสุด
          </h3>
          {data?.topTopupUsers.length ? (
            <div className="flex flex-col gap-3">
              {data.topTopupUsers.map((u, i) => (
                <div key={u._id} className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-slate-400 w-4 shrink-0">{i + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden shrink-0">
                    {u.avatar
                      ? <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500">{u.name?.charAt(0)}</div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{u.name}</p>
                    <p className="text-[10px] text-slate-400">{u.count} ครั้ง</p>
                  </div>
                  <p className="text-xs font-black text-indigo-600 shrink-0">฿{u.totalTopup.toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-slate-400 text-sm">ยังไม่มีข้อมูล</div>
          )}
        </div>
      </div>

      {/* Recent Topups */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-700 mb-4">รายการเติมเงินล่าสุด</h3>
        {data?.recentTopups.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  {["ผู้ใช้", "อีเมล", "จำนวน", "ยอดคงเหลือหลังเติม", "หมายเหตุ", "วันที่"].map((h, i) => (
                    <th key={i} className="pb-3 text-[11px] font-bold text-slate-400 whitespace-nowrap px-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recentTopups.map((tx) => (
                  <tr key={tx._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 overflow-hidden shrink-0">
                          {tx.userId?.avatar
                            ? <img src={tx.userId.avatar} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-500">{tx.userId?.name?.charAt(0)}</div>
                          }
                        </div>
                        <span className="text-xs font-bold text-slate-800 truncate max-w-[100px]">{tx.userId?.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-500 truncate max-w-[140px]">{tx.userId?.email || "–"}</td>
                    <td className="py-3 px-3 text-xs font-black text-green-600">+{tx.amount.toLocaleString()} บาท</td>
                    <td className="py-3 px-3 text-xs font-bold text-slate-700">{tx.balanceAfter.toLocaleString()} บาท</td>
                    <td className="py-3 px-3 text-xs text-slate-500">{tx.description || "–"}</td>
                    <td className="py-3 px-3 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center py-10 text-slate-400 text-sm">ยังไม่มีรายการเติมเงิน</div>
        )}
      </div>

    </div>
  );
}
