"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp, TrendingDown, Box, Users, Store, Package,
  BarChart3, RefreshCw, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { cn } from "@/lib/utils";

interface ReportData {
  summary: {
    thisMonth: { boxRevenue: number; topups: number; marketVolume: number };
    lastMonth: { boxRevenue: number; topups: number; marketVolume: number };
    changes: { boxRevenue: number; topups: number; marketVolume: number };
    totalUsers: number;
    totalOrders: number;
    totalInventories: number;
  };
  revenueByType: { _id: string; label: string; total: number; count: number }[];
  dailyBoxRevenue: { _id: string; revenue: number; count: number }[];
  dailyTopup: { _id: string; revenue: number; count: number }[];
  userGrowth: { _id: string; count: number }[];
  topItems: {
    _id: string; name: string; image: string; price: number;
    rarityName: string; rarityColor: string; count: number;
  }[];
  topBoxes: {
    _id: string; name: string; image: string; price: number;
    openCount: number; revenue: number;
  }[];
}

function ChangeBadge({ pct }: { pct: number }) {
  const up = pct >= 0;
  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-md",
      up ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
    )}>
      {up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
      {up ? "+" : ""}{pct.toFixed(1)}%
    </span>
  );
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    fetch("/api/admin/reports")
      .then((r) => r.json())
      .then((d) => { if (!d.error) setData(d); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const chartData = (() => {
    if (!data) return [];
    const map: Record<string, { date: string; box: number; topup: number }> = {};
    data.dailyBoxRevenue.forEach((d) => {
      if (!map[d._id]) map[d._id] = { date: d._id.slice(5), box: 0, topup: 0 };
      map[d._id].box = d.revenue;
    });
    data.dailyTopup.forEach((d) => {
      if (!map[d._id]) map[d._id] = { date: d._id.slice(5), box: 0, topup: 0 };
      map[d._id].topup = d.revenue;
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  })();

  const userChartData = data?.userGrowth.map((d) => ({
    date: d._id.slice(5),
    users: d.count,
  })) || [];

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
        <div className="flex justify-center py-20 text-slate-400 text-sm">กำลังโหลดรายงาน...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">รายงานและสถิติ</h1>
          <p className="text-sm text-slate-500 mt-1">ข้อมูลรายได้ ผู้เล่น และกิจกรรมในระบบ (30 วันล่าสุด)</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm transition-colors shrink-0"
        >
          <RefreshCw size={14} />
          รีเฟรช
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "รายได้จากกล่อง (เดือนนี้)",
            value: `฿${(data?.summary.thisMonth.boxRevenue || 0).toLocaleString()}`,
            change: data?.summary.changes.boxRevenue || 0,
            icon: Box,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "ยอดเติมเงิน (เดือนนี้)",
            value: `฿${(data?.summary.thisMonth.topups || 0).toLocaleString()}`,
            change: data?.summary.changes.topups || 0,
            icon: TrendingUp,
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "มูลค่าตลาด (เดือนนี้)",
            value: `฿${(data?.summary.thisMonth.marketVolume || 0).toLocaleString()}`,
            change: data?.summary.changes.marketVolume || 0,
            icon: Store,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
        ].map((card, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", card.bg)}>
                <card.icon size={20} className={card.color} />
              </div>
              <ChangeBadge pct={card.change} />
            </div>
            <p className="text-xs text-slate-500 font-medium">{card.label}</p>
            <p className="text-2xl font-black text-slate-800 tracking-tight mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-sm font-bold text-slate-700 mb-6">รายได้รายวัน (30 วันล่าสุด)</h2>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b" }} dy={8} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                formatter={(v: any) => [`฿${Number(v).toLocaleString()}`, ""]}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
              <Line type="monotone" dataKey="box" stroke="#3b82f6" strokeWidth={2.5} dot={false} name="รายได้กล่อง (฿)" />
              <Line type="monotone" dataKey="topup" stroke="#10b981" strokeWidth={2.5} dot={false} name="ยอดเติมเงิน (฿)" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex justify-center items-center h-40 text-slate-400 text-sm">ยังไม่มีข้อมูล</div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* User Growth */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-700 mb-6 flex items-center gap-2">
            <Users size={16} className="text-slate-400" />
            ผู้เล่นใหม่รายวัน (30 วัน)
          </h2>
          {userChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={userChartData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#94a3b8" }} interval={4} dy={6} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                <Bar dataKey="users" fill="#6366f1" radius={[3, 3, 0, 0]} name="ผู้เล่นใหม่" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-40 text-slate-400 text-sm">ยังไม่มีข้อมูล</div>
          )}
        </div>

        {/* Revenue by type */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-700 mb-4">สัดส่วนรายได้ตามประเภท (เดือนนี้)</h2>
          {data?.revenueByType.length ? (
            <div className="flex flex-col gap-3">
              {(() => {
                const total = data.revenueByType.reduce((s, r) => s + r.total, 0) || 1;
                const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", "bg-red-500", "bg-indigo-500", "bg-slate-400"];
                return data.revenueByType.map((r, i) => {
                  const pct = Math.round((r.total / total) * 100);
                  return (
                    <div key={r._id}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-medium text-slate-600">{r.label}</span>
                        <span className="text-xs font-bold text-slate-800">฿{r.total.toLocaleString()} ({pct}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", colors[i] || "bg-slate-400")} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <div className="flex justify-center items-center h-32 text-slate-400 text-sm">ยังไม่มีข้อมูล</div>
          )}
        </div>

        {/* Counts */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col gap-4">
          <h2 className="text-sm font-bold text-slate-700">สรุปตัวเลขรวม</h2>
          {[
            { label: "ผู้เล่นทั้งหมด", value: data?.summary.totalUsers || 0, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "ออเดอร์ตลาดทั้งหมด", value: data?.summary.totalOrders || 0, icon: Store, color: "text-purple-500", bg: "bg-purple-50" },
            { label: "ไอเทมในระบบ", value: data?.summary.totalInventories || 0, icon: Package, color: "text-orange-500", bg: "bg-orange-50" },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", s.bg)}>
                <s.icon size={16} className={s.color} />
              </div>
              <div>
                <p className="text-[11px] text-slate-500">{s.label}</p>
                <p className="text-lg font-black text-slate-800">{s.value.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top Boxes */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Box size={16} className="text-slate-400" />
            กล่องยอดนิยมสูงสุด
          </h2>
          {data?.topBoxes.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["#", "กล่อง", "เปิด", "รายได้"].map((h, i) => (
                      <th key={i} className="pb-2 text-[11px] font-bold text-slate-400 px-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.topBoxes.map((box, i) => (
                    <tr key={box._id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="py-2 px-2 text-[11px] font-bold text-slate-400">{i + 1}</td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center p-0.5 shrink-0">
                            {box.image
                              ? <img src={box.image} alt="" className="w-full h-full object-contain" />
                              : <Box size={12} className="text-slate-400" />
                            }
                          </div>
                          <span className="text-xs font-bold text-slate-800 truncate max-w-[120px]">{box.name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-xs font-bold text-slate-600">{(box.openCount ?? 0).toLocaleString()}</td>
                      <td className="py-2 px-2 text-xs font-black text-blue-600">฿{(box.revenue ?? 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex justify-center items-center h-32 text-slate-400 text-sm">ยังไม่มีข้อมูล</div>
          )}
        </div>

        {/* Top Items */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
            <Package size={16} className="text-slate-400" />
            ไอเทมที่ได้รับมากที่สุด
          </h2>
          {data?.topItems.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["#", "ไอเทม", "ความหายาก", "ครั้ง"].map((h, i) => (
                      <th key={i} className="pb-2 text-[11px] font-bold text-slate-400 px-2">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.topItems.map((item, i) => (
                    <tr key={item._id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="py-2 px-2 text-[11px] font-bold text-slate-400">{i + 1}</td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center p-0.5 shrink-0">
                            {item.image
                              ? <img src={item.image} alt="" className="w-full h-full object-contain" />
                              : <Package size={12} className="text-slate-400" />
                            }
                          </div>
                          <span className="text-xs font-bold text-slate-800 truncate max-w-[110px]">{item.name}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        {item.rarityName && (
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                            style={{ color: item.rarityColor, backgroundColor: `${item.rarityColor}20` }}
                          >
                            {item.rarityName}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-xs font-black text-slate-700">{(item.count ?? 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex justify-center items-center h-32 text-slate-400 text-sm">ยังไม่มีข้อมูล</div>
          )}
        </div>
      </div>

    </div>
  );
}
