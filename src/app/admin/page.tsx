"use client";

import { useEffect, useState } from "react";
import {
  CircleDollarSign, Box, UserPlus, ClipboardList, TrendingUp, WalletCards,
  ArrowUpRight, ArrowDownRight, Users, Diamond, ShoppingCart, MoreVertical, Package,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface DashboardData {
  kpi: {
    todayRevenue: number; boxOpenedToday: number; newUsersToday: number;
    pendingDeliveries: number; todayMarketVolume: number; todayTopups: number;
  };
  overview: { totalUsers: number; totalBoxes: number; totalItems: number; systemCoins: number };
  revenueChart: { _id: string; revenue: number; count: number }[];
  topBoxes: { _id: string; name: string; image: string; openCount: number; revenue: number }[];
  recentActivity: {
    _id: string; type: string; amount: number; description: string;
    createdAt: string; userId: { name: string; avatar?: string };
  }[];
  recentOrders: {
    _id: string; price: number; status: string; createdAt: string;
    sellerId: { name: string; avatar?: string };
    buyerId?: { name: string };
    itemId: { name: string; image: string; rarityId: { name: string; color: string } };
  }[];
}

const typeLabel: Record<string, { label: string; color: string }> = {
  topup: { label: "เติมเงิน", color: "text-emerald-600" },
  withdraw: { label: "ถอนเงิน", color: "text-red-600" },
  buy_box: { label: "เปิดกล่อง", color: "text-blue-600" },
  sell_item: { label: "ขายคืน", color: "text-orange-600" },
  market_buy: { label: "ซื้อจากตลาด", color: "text-purple-600" },
  market_sell: { label: "ขายในตลาด", color: "text-indigo-600" },
  admin_adjust: { label: "Admin ปรับ", color: "text-gray-600" },
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then((d) => { if (!d.error) setData(d); })
      .finally(() => setLoading(false));
  }, []);

  const kpiCards = data
    ? [
        { title: "รายได้วันนี้", value: `฿${data.kpi.todayRevenue.toLocaleString()}`, icon: CircleDollarSign, bg: "bg-red-50", color: "text-red-500" },
        { title: "กล่องถูกเปิด", value: data.kpi.boxOpenedToday.toLocaleString(), icon: Box, bg: "bg-blue-50", color: "text-blue-500" },
        { title: "ผู้ใช้ใหม่", value: data.kpi.newUsersToday.toLocaleString(), icon: UserPlus, bg: "bg-purple-50", color: "text-purple-500" },
        { title: "รอจัดส่ง", value: data.kpi.pendingDeliveries.toLocaleString(), icon: ClipboardList, bg: "bg-orange-50", color: "text-orange-500" },
        { title: "มูลค่าตลาดวันนี้", value: `฿${data.kpi.todayMarketVolume.toLocaleString()}`, icon: TrendingUp, bg: "bg-emerald-50", color: "text-emerald-500" },
        { title: "ยอดเติมเงินวันนี้", value: `฿${data.kpi.todayTopups.toLocaleString()}`, icon: WalletCards, bg: "bg-amber-50", color: "text-amber-500" },
      ]
    : [];

  const chartData = data?.revenueChart.map((d) => ({
    name: d._id.slice(5), // MM-DD
    value: d.revenue,
    count: d.count,
  })) || [];

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm h-28 animate-pulse bg-gradient-to-br from-slate-50 to-white" />
          ))}
        </div>
        <div className="flex justify-center py-20 text-slate-400 text-sm font-medium">กำลังโหลดข้อมูลแบบ real-time...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((kpi, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col relative overflow-hidden group">
            <div className="flex items-start justify-between mb-2">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-2", kpi.bg, kpi.color)}>
                <kpi.icon size={20} />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-1">{kpi.title}</p>
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">{kpi.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Revenue Chart */}
        <div className="lg:col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-slate-800">รายได้จากการเปิดกล่อง (7 วันล่าสุด)</h2>
          </div>
          {chartData.length > 0 ? (
            <>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                <span className="text-xs text-slate-500">รายได้ (บาท)</span>
              </div>
              <div className="flex-1 w-full min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b" }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} itemStyle={{ color: "#0f172a", fontWeight: "bold" }} />
                    <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: "#ef4444", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} name="รายได้ (฿)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 flex-col gap-2">
              <TrendingUp size={40} className="opacity-20" />
              <p className="text-sm font-medium">ยังไม่มีข้อมูลรายได้</p>
            </div>
          )}
        </div>

        {/* Top Boxes */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-slate-800">กล่องยอดนิยม</h2>
          </div>
          {data?.topBoxes.length ? (
            <div className="flex flex-col gap-4">
              {data.topBoxes.map((box, i) => (
                <div key={box._id} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">{i + 1}</div>
                  <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden shrink-0 p-1 flex items-center justify-center">
                    {box.image ? <img src={box.image} alt={box.name} className="w-full h-full object-contain" /> : <Package size={16} className="text-slate-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[13px] font-bold text-slate-800 truncate">{box.name}</h4>
                    <p className="text-[10px] text-slate-500">เปิดแล้ว {box.openCount.toLocaleString()} ครั้ง</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-slate-400">รายได้รวม</p>
                    <p className="text-xs font-bold text-slate-800">฿{box.revenue.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
              <Box size={32} className="opacity-20" />
              <p className="text-sm">ยังไม่มีข้อมูล</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-slate-800">กิจกรรมล่าสุด</h2>
          </div>
          {data?.recentActivity.length ? (
            <div className="flex flex-col gap-4 relative before:absolute before:left-5 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-100">
              {data.recentActivity.map((act) => {
                const info = typeLabel[act.type] || { label: act.type, color: "text-slate-600" };
                return (
                  <div key={act._id} className="flex items-start gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-white border-4 border-white shadow-sm shrink-0 overflow-hidden">
                      {act.userId?.avatar ? (
                        <img src={act.userId.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                          {act.userId?.name?.charAt(0) || "?"}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <h4 className="text-[13px] font-bold text-slate-800 truncate">{act.userId?.name}</h4>
                      <p className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1">
                        <span className={`font-bold ${info.color}`}>{info.label}</span>
                        <span className={`font-black text-xs ${act.amount > 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {act.amount > 0 ? "+" : ""}฿{Math.abs(act.amount).toLocaleString()}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
              <WalletCards size={32} className="opacity-20" />
              <p className="text-sm">ยังไม่มีกิจกรรม</p>
            </div>
          )}
        </div>

      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Recent Marketplace Orders */}
        <div className="lg:col-span-9 bg-white border border-slate-200 rounded-xl p-5 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-slate-800">ออเดอร์ตลาดล่าสุด</h2>
          </div>
          {data?.recentOrders.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["Order ID", "ผู้ขาย", "สินค้า", "ราคา", "สถานะ", "วันที่", ""].map((h, i) => (
                      <th key={i} className="pb-3 text-[11px] font-bold text-slate-500 whitespace-nowrap px-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {data.recentOrders.map((order, i) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 text-[11px] font-medium text-slate-500">{order._id.slice(-8).toUpperCase()}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {order.sellerId?.avatar ? (
                            <img src={order.sellerId.avatar} className="w-6 h-6 rounded-full bg-slate-100" alt="" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                              {order.sellerId?.name?.charAt(0)}
                            </div>
                          )}
                          <span className="font-bold text-slate-800 text-xs">{order.sellerId?.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center p-0.5">
                            {order.itemId?.image ? (
                              <img src={order.itemId.image} className="w-full h-full object-contain" alt="" />
                            ) : (
                              <Package size={14} className="text-slate-400" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-xs line-clamp-1">{order.itemId?.name}</span>
                            {order.itemId?.rarityId && (
                              <span className="text-[9px] font-bold w-max px-1 rounded" style={{ color: order.itemId.rarityId.color, backgroundColor: `${order.itemId.rarityId.color}20` }}>
                                {order.itemId.rarityId.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800 text-xs">฿{order.price.toLocaleString()}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap",
                          order.status === "active" ? "bg-amber-100 text-amber-700" : order.status === "sold" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                        )}>
                          {order.status === "active" ? "วางขาย" : order.status === "sold" ? "ขายแล้ว" : "ยกเลิก"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-500">
                        {new Date(order.createdAt).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button className="text-slate-400 hover:text-slate-600 p-1"><MoreVertical size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
              <ShoppingCart size={32} className="opacity-20" />
              <p className="text-sm">ยังไม่มีออเดอร์</p>
            </div>
          )}
        </div>

        {/* Overview Stats */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col">
          <h2 className="text-base font-bold text-slate-800 mb-6">สรุปภาพรวมระบบ</h2>
          <div className="flex flex-col gap-6">
            {data && [
              { icon: Users, label: "ผู้ใช้ทั้งหมด", val: data.overview.totalUsers.toLocaleString(), color: "text-blue-500", bg: "bg-blue-50" },
              { icon: Box, label: "กล่องทั้งหมด", val: data.overview.totalBoxes.toLocaleString(), color: "text-purple-500", bg: "bg-purple-50" },
              { icon: Diamond, label: "ไอเทมทั้งหมด", val: data.overview.totalItems.toLocaleString(), color: "text-amber-500", bg: "bg-amber-50" },
              { icon: ShoppingCart, label: "เหรียญในระบบ", val: `฿${data.overview.systemCoins.toLocaleString()}`, color: "text-orange-500", bg: "bg-orange-50" },
              { icon: ArrowUpRight, label: "เติมเงินวันนี้", val: `฿${data.kpi.todayTopups.toLocaleString()}`, color: "text-emerald-500", bg: "bg-emerald-50" },
              { icon: ArrowDownRight, label: "รอจัดส่ง", val: `${data.kpi.pendingDeliveries} รายการ`, color: "text-red-500", bg: "bg-red-50" },
            ].map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", s.bg, s.color)}>
                    <s.icon size={14} />
                  </div>
                  <span className="text-xs font-bold text-slate-600">{s.label}</span>
                </div>
                <span className="font-bold text-slate-800 text-sm">{s.val}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
