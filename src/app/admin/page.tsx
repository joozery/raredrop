"use client";

import { 
  CircleDollarSign, Box, UserPlus, ClipboardList, TrendingUp, WalletCards,
  ArrowUpRight, ArrowDownRight, MoreVertical, Users, Diamond, ShoppingCart
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from "@/lib/utils";

const kpiData = [
  { title: "รายได้วันนี้", value: "฿125,000", change: "+ 12.5%", isUp: true, icon: CircleDollarSign, bg: "bg-red-50", color: "text-red-500" },
  { title: "กล่องถูกเปิด", value: "4,582", change: "+ 8.2%", isUp: true, icon: Box, bg: "bg-blue-50", color: "text-blue-500" },
  { title: "ผู้ใช้ใหม่", value: "328", change: "+ 15.3%", isUp: true, icon: UserPlus, bg: "bg-purple-50", color: "text-purple-500" },
  { title: "ออเดอร์ค้างส่ง", value: "24", change: "- 5.1%", isUp: false, icon: ClipboardList, bg: "bg-orange-50", color: "text-orange-500" },
  { title: "มูลค่าตลาดวันนี้", value: "฿58,000", change: "+ 10.7%", isUp: true, icon: TrendingUp, bg: "bg-emerald-50", color: "text-emerald-500" },
  { title: "กำไรสุทธิ", value: "฿42,250", change: "+ 11.3%", isUp: true, icon: WalletCards, bg: "bg-amber-50", color: "text-amber-500" },
];

const chartData = [
  { name: '13 พ.ค.', value: 40000 },
  { name: '14 พ.ค.', value: 80000 },
  { name: '15 พ.ค.', value: 60000 },
  { name: '16 พ.ค.', value: 75000 },
  { name: '17 พ.ค.', value: 120000 },
  { name: '18 พ.ค.', value: 85000 },
  { name: '19 พ.ค.', value: 125000 },
];

const topBoxes = [
  { id: 1, name: "Anime Legends Box", opened: "15,800", revenue: "฿485,200", img: "AnimeBox" },
  { id: 2, name: "Labubu Secret Box", opened: "12,450", revenue: "฿373,500", img: "LabubuBox" },
  { id: 3, name: "Pokémon Master Box", opened: "9,250", revenue: "฿277,500", img: "PokeBox" },
  { id: 4, name: "Luxury Watch Box", opened: "6,200", revenue: "฿186,000", img: "WatchBox" },
  { id: 5, name: "Hypebeast Box", opened: "4,800", revenue: "฿134,400", img: "ShoeBox" },
];

const recentActivities = [
  { id: 1, user: "JohnDoe", action: "เปิด Anime Legends Box", time: "2 นาทีที่แล้ว", type: "open", color: "bg-red-50 text-red-500", icon: Box },
  { id: 2, user: "Mind_Th", action: "ได้รับ Labubu Secret", badge: "SSR", time: "5 นาทีที่แล้ว", type: "win", color: "bg-blue-50 text-blue-500", icon: Box },
  { id: 3, user: "JaneSmith", action: "เติมเงิน 500 RD", time: "10 นาทีที่แล้ว", type: "deposit", color: "bg-orange-50 text-orange-500", icon: WalletCards },
  { id: 4, user: "Kong123", action: "ขาย Pikachu PSA 10", time: "15 นาทีที่แล้ว", type: "sell", color: "bg-purple-50 text-purple-500", icon: TrendingUp },
  { id: 5, user: "PeterPan", action: "ถอนเงิน 2,000 บาท", time: "20 นาทีที่แล้ว", type: "withdraw", color: "bg-emerald-50 text-emerald-500", icon: CircleDollarSign },
];

const recentOrders = [
  { id: "#RD2505190001", user: "JohnDoe", userImg: "John", item: "Labubu The Monsters", rarity: "SECRET", qty: 1, total: "฿12,900", status: "รอจัดส่ง", statusColor: "bg-amber-100 text-amber-700", date: "19 พ.ค. 2025 14:35", img: "LabubuToy" },
  { id: "#RD2505190002", user: "Mind_Th", userImg: "Mind", item: "Pikachu PSA 10", rarity: "SSR", qty: 1, total: "฿8,500", status: "รอจัดส่ง", statusColor: "bg-amber-100 text-amber-700", date: "19 พ.ค. 2025 14:21", img: "PikaCard" },
  { id: "#RD2505190003", user: "JaneSmith", userImg: "Jane", item: "Rolex Daytona Black", rarity: "SSR", qty: 1, total: "฿78,000", status: "จัดส่งแล้ว", statusColor: "bg-emerald-100 text-emerald-700", date: "19 พ.ค. 2025 13:50", img: "RolexWatch" },
  { id: "#RD2505180004", user: "Kong123", userImg: "Kong", item: "Bearbrick 1000%", rarity: "SR", qty: 1, total: "฿18,900", status: "ยกเลิก", statusColor: "bg-red-100 text-red-700", date: "18 พ.ค. 2025 23:10", img: "BearbrickToy" },
  { id: "#RD2505180005", user: "PeterPan", userImg: "Peter", item: "Supreme Box Logo Hoodie", rarity: "R", qty: 1, total: "฿9,900", status: "จัดส่งแล้ว", statusColor: "bg-emerald-100 text-emerald-700", date: "18 พ.ค. 2025 22:45", img: "SupremeH" },
];

export default function AdminDashboard() {
  return (
    <div className="flex flex-col gap-6">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-6 gap-4">
        {kpiData.map((kpi, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col relative overflow-hidden group">
            <div className="flex items-start justify-between mb-2">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-2", kpi.bg, kpi.color)}>
                <kpi.icon size={20} />
              </div>
              <div className={cn("flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded", kpi.isUp ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50")}>
                {kpi.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {kpi.change}
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-1">{kpi.title}</p>
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">{kpi.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        
        {/* Revenue Chart */}
        <div className="col-span-6 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-slate-800">รายได้รวม</h2>
            <select className="bg-slate-50 border border-slate-200 text-slate-600 text-xs rounded-lg px-3 py-1.5 outline-none cursor-pointer">
              <option>รายวัน</option>
              <option>รายเดือน</option>
              <option>รายปี</option>
            </select>
          </div>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
            <span className="text-xs text-slate-500">รายได้ (บาท)</span>
          </div>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val / 1000}K`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: "#ef4444", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Boxes */}
        <div className="col-span-3 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-slate-800">กล่องยอดนิยม</h2>
            <button className="text-xs font-bold text-red-600 hover:underline">ดูทั้งหมด</button>
          </div>
          <div className="flex flex-col gap-4">
            {topBoxes.map((box, i) => (
              <div key={box.id} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0">
                  {i + 1}
                </div>
                <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                  <img src={`https://picsum.photos/seed/${box.img}/100/100`} alt={box.name} className="w-full h-full object-cover mix-blend-multiply" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[13px] font-bold text-slate-800 truncate">{box.name}</h4>
                  <p className="text-[10px] text-slate-500">เปิดแล้ว {box.opened} ครั้ง</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-slate-400">รายได้รวม</p>
                  <p className="text-xs font-bold text-slate-800">{box.revenue}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-span-3 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-slate-800">กิจกรรมล่าสุด</h2>
            <button className="text-xs font-bold text-red-600 hover:underline">ดูทั้งหมด</button>
          </div>
          <div className="flex flex-col gap-5 relative before:absolute before:left-5 before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-100">
            {recentActivities.map((act) => (
              <div key={act.id} className="flex items-start gap-4 relative z-10">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm", act.color)}>
                  <act.icon size={16} />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h4 className="text-[13px] font-bold text-slate-800 truncate">{act.user}</h4>
                  <p className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    {act.action}
                    {act.badge && <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">{act.badge}</span>}
                  </p>
                </div>
                <div className="text-[9px] text-slate-400 font-medium pt-1.5 flex items-center gap-1.5 shrink-0">
                  {act.time}
                  <div className="w-1.5 h-1.5 rounded-full bg-red-600"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Recent Orders Table */}
        <div className="col-span-9 bg-white border border-slate-200 rounded-xl p-5 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-slate-800">ออเดอร์ล่าสุด</h2>
            <button className="text-xs font-bold text-red-600 hover:underline">ดูทั้งหมด</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-3 text-[11px] font-bold text-slate-500 whitespace-nowrap px-4">Order ID</th>
                  <th className="pb-3 text-[11px] font-bold text-slate-500 whitespace-nowrap px-4">ผู้ใช้</th>
                  <th className="pb-3 text-[11px] font-bold text-slate-500 whitespace-nowrap px-4">สินค้า</th>
                  <th className="pb-3 text-[11px] font-bold text-slate-500 whitespace-nowrap text-center px-4">จำนวน</th>
                  <th className="pb-3 text-[11px] font-bold text-slate-500 whitespace-nowrap px-4">ยอดรวม</th>
                  <th className="pb-3 text-[11px] font-bold text-slate-500 whitespace-nowrap text-center px-4">สถานะ</th>
                  <th className="pb-3 text-[11px] font-bold text-slate-500 whitespace-nowrap px-4">วันที่</th>
                  <th className="pb-3 text-[11px] font-bold text-slate-500 whitespace-nowrap px-4"></th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentOrders.map((order, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 text-[11px] font-medium text-slate-500">{order.id}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <img src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${order.userImg}`} className="w-6 h-6 rounded-full bg-slate-100" />
                        <span className="font-bold text-slate-800 text-xs">{order.user}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-slate-100 overflow-hidden border border-slate-200">
                           <img src={`https://picsum.photos/seed/${order.img}/100/100`} className="w-full h-full object-cover mix-blend-multiply" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-xs line-clamp-1">{order.item}</span>
                          <span className="text-[9px] font-bold text-purple-600 bg-purple-50 w-max px-1 rounded">{order.rarity}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-slate-600 text-xs">{order.qty}</td>
                    <td className="py-3 px-4 font-bold text-slate-800 text-xs">{order.total}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={cn("text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap", order.statusColor)}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[11px] text-slate-500">{order.date}</td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-slate-400 hover:text-slate-600 p-1"><MoreVertical size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="col-span-3 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col">
          <h2 className="text-base font-bold text-slate-800 mb-6">สรุปภาพรวม</h2>
          
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                  <Users size={14} />
                </div>
                <span className="text-xs font-bold text-slate-600">ผู้ใช้ทั้งหมด</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-sm">28,540</span>
                <span className="text-[10px] font-bold text-emerald-500 flex items-center"><ArrowUpRight size={10} /> 9.3%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center">
                  <Box size={14} />
                </div>
                <span className="text-xs font-bold text-slate-600">กล่องทั้งหมด</span>
              </div>
              <span className="font-bold text-slate-800 text-sm">42</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center">
                  <Diamond size={14} />
                </div>
                <span className="text-xs font-bold text-slate-600">ไอเทมทั้งหมด</span>
              </div>
              <span className="font-bold text-slate-800 text-sm">1,245</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
                  <ShoppingCart size={14} />
                </div>
                <span className="text-xs font-bold text-slate-600">มูลค่าสต็อกทั้งหมด</span>
              </div>
              <span className="font-bold text-slate-800 text-sm">฿3,245,000</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                  <div className="border border-emerald-500 rounded-full w-3.5 h-3.5 flex items-center justify-center"><span className="text-[8px] font-bold">+</span></div>
                </div>
                <span className="text-xs font-bold text-slate-600">ยอดเติมเงินวันนี้</span>
              </div>
              <span className="font-bold text-slate-800 text-sm">฿58,000</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
                   <div className="border border-red-500 rounded-full w-3.5 h-3.5 flex items-center justify-center"><span className="text-[8px] font-bold">-</span></div>
                </div>
                <span className="text-xs font-bold text-slate-600">ยอดถอนเงินวันนี้</span>
              </div>
              <span className="font-bold text-slate-800 text-sm">฿12,000</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
