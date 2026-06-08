"use client";

import { useState, useEffect } from "react";
import { Search, User, Store, Tag, Clock, CheckCircle2, XCircle, Trash2 } from "lucide-react";

interface UserData {
  _id: string;
  name: string;
  avatar?: string;
}

interface RarityData {
  name: string;
  color: string;
}

interface ItemData {
  _id: string;
  name: string;
  image: string;
  price: number;
  rarityId: RarityData;
}

interface OrderData {
  _id: string;
  sellerId: UserData;
  buyerId?: UserData;
  itemId: ItemData;
  price: number;
  status: "active" | "sold" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

export default function ManageOrders() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = "/api/admin/orders";
      if (statusFilter) url += `?status=${statusFilter}`;
      
      const res = await fetch(url);
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleCancelOrder = async (id: string) => {
    if (!confirm("คุณต้องการยกเลิกคำสั่งซื้อนี้ใช่หรือไม่? ไอเทมจะถูกส่งคืนกลับไปยังคลังของผู้ขาย")) return;
    
    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" })
      });
      
      if (!res.ok) throw new Error("Failed to cancel order");
      
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredOrders = orders.filter(o => 
    o.sellerId?.name.toLowerCase().includes(search.toLowerCase()) || 
    o.itemId?.name.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100"><Store size={12} /> วางขายอยู่</span>;
      case 'sold': return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100"><CheckCircle2 size={12} /> ขายแล้ว</span>;
      case 'cancelled': return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200"><XCircle size={12} /> ยกเลิกแล้ว</span>;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">ประวัติคำสั่งซื้อ/ขายในตลาด (Marketplace Orders)</h1>
        <p className="text-sm text-slate-500 mt-1">ดูประวัติการซื้อขายไอเทมระหว่างผู้เล่นด้วยกันเอง</p>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="relative w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="ค้นหาชื่อผู้ขาย หรือชื่อไอเทม..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-slate-200 text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-red-500 transition-all font-medium text-slate-700"
              />
            </div>
            
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-slate-200 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-red-500 font-medium text-slate-700"
            >
              <option value="">ทุกสถานะ</option>
              <option value="active">วางขายอยู่ (Active)</option>
              <option value="sold">ขายแล้ว (Sold)</option>
              <option value="cancelled">ยกเลิกแล้ว (Cancelled)</option>
            </select>
          </div>
          
          <div className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
            รายการทั้งหมด: <span className="text-red-600 font-black ml-1">{orders.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">วันเวลาที่ลงขาย</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ผู้ขาย (Seller)</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ไอเทมที่ขาย</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">ราคาตั้งขาย</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">สถานะ</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ผู้ซื้อ (Buyer)</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">กำลังโหลดข้อมูล...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">ไม่พบคำสั่งซื้อ/ขาย</td>
                </tr>
              ) : filteredOrders.map((order) => (
                <tr key={order._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6 text-slate-500 text-[11px] font-medium">
                    <div className="flex items-center gap-1.5"><Clock size={12} /> {new Date(order.createdAt).toLocaleString("th-TH", { dateStyle: 'short', timeStyle: 'short' })}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden shrink-0">
                        {order.sellerId?.avatar ? <img src={order.sellerId.avatar} alt="avatar" className="w-full h-full object-cover" /> : <User size={14} className="text-slate-400 m-auto mt-2" />}
                      </div>
                      <span className="font-bold text-slate-800 text-xs">{order.sellerId?.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {order.itemId ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center p-1 shrink-0">
                          <img src={order.itemId.image} alt={order.itemId.name} className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-xs line-clamp-1">{order.itemId.name}</div>
                          {order.itemId.rarityId && (
                            <span className="text-[9px] font-bold" style={{ color: order.itemId.rarityId.color }}>
                              {order.itemId.rarityId.name}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">ไอเทมถูกลบ</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="inline-flex items-center gap-1 font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                      <Tag size={12} />
                      {order.price.toLocaleString()}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="py-4 px-6">
                    {order.buyerId ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 overflow-hidden shrink-0">
                          {order.buyerId.avatar ? <img src={order.buyerId.avatar} alt="avatar" className="w-full h-full object-cover" /> : <User size={10} className="text-slate-400 m-auto mt-1" />}
                        </div>
                        <span className="font-bold text-slate-800 text-[11px]">{order.buyerId.name}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">-</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    {order.status === 'active' && (
                      <button 
                        onClick={() => handleCancelOrder(order._id)}
                        className="text-red-500 bg-red-50 hover:bg-red-600 hover:text-white border border-red-100 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors"
                        title="ยกเลิกคำสั่งขาย"
                      >
                        ยกเลิก
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
