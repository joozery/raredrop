"use client";

import { useState, useEffect } from "react";
import { Search, Box as BoxIcon, User, Archive, Coins, Truck, Store } from "lucide-react";

interface UserData {
  _id: string;
  name: string;
  avatar?: string;
  email?: string;
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

interface BoxData {
  name: string;
}

interface InventoryData {
  _id: string;
  userId: UserData;
  itemId: ItemData;
  boxId?: BoxData;
  status: "kept" | "sold" | "delivered" | "market";
  acquiredAt: string;
}

export default function ManageInventories() {
  const [inventories, setInventories] = useState<InventoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = "/api/admin/inventories";
      if (statusFilter) url += `?status=${statusFilter}`;
      
      const res = await fetch(url);
      if (res.ok) {
        setInventories(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/inventories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!res.ok) throw new Error("Failed to update status");
      
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredInventories = inventories.filter(inv => 
    inv.userId?.name.toLowerCase().includes(search.toLowerCase()) || 
    inv.itemId?.name.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'kept': return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100"><Archive size={10} /> เก็บในคลัง</span>;
      case 'sold': return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200"><Coins size={10} /> ขายคืนระบบ</span>;
      case 'delivered': return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100"><Truck size={10} /> จัดส่งแล้ว</span>;
      case 'market': return <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100"><Store size={10} /> วางขายในตลาด</span>;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">คลังไอเทมผู้เล่น (Player Inventories)</h1>
        <p className="text-sm text-slate-500 mt-1">ดูและจัดการไอเทมที่ผู้เล่นเปิดได้จากกล่องสุ่ม</p>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="relative w-80">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="ค้นหาชื่อผู้เล่น หรือชื่อไอเทม..." 
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
              <option value="kept">เก็บในคลัง (Kept)</option>
              <option value="sold">ขายคืนระบบ (Sold)</option>
              <option value="delivered">จัดส่งแล้ว (Delivered)</option>
              <option value="market">วางขายในตลาด (Market)</option>
            </select>
          </div>
          
          <div className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
            รายการทั้งหมด: <span className="text-red-600 font-black ml-1">{inventories.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ผู้ครอบครอง (Owner)</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ไอเทม</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ที่มา (Source)</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">สถานะ</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">วันที่ได้รับ</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">ปรับสถานะ</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100/80">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">กำลังโหลดข้อมูล...</td>
                </tr>
              ) : filteredInventories.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">ไม่พบข้อมูล</td>
                </tr>
              ) : filteredInventories.map((inv) => (
                <tr key={inv._id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {inv.userId?.avatar ? <img src={inv.userId.avatar} alt="avatar" className="w-full h-full object-cover" /> : <User size={14} className="text-slate-400" />}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{inv.userId?.name || 'Unknown'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {inv.itemId ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center p-1 shrink-0">
                          <img src={inv.itemId.image} alt={inv.itemId.name} className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-xs line-clamp-1">{inv.itemId.name}</div>
                          {inv.itemId.rarityId && (
                            <span className="text-[9px] font-bold" style={{ color: inv.itemId.rarityId.color }}>
                              {inv.itemId.rarityId.name}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">ไอเทมถูกลบจากระบบ</span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    {inv.boxId ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600">
                        <BoxIcon size={10} /> {inv.boxId.name}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">ไม่ระบุที่มา</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center">
                    {getStatusBadge(inv.status)}
                  </td>
                  <td className="py-4 px-6 text-slate-500 text-[11px] font-medium">
                    {new Date(inv.acquiredAt).toLocaleString("th-TH", { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <select 
                      value={inv.status}
                      onChange={(e) => handleStatusChange(inv._id, e.target.value)}
                      className="bg-white border border-slate-200 text-xs rounded-lg px-2 py-1 outline-none focus:border-red-500 font-medium text-slate-600"
                      disabled={inv.status === 'sold'}
                    >
                      <option value="kept">เก็บในคลัง</option>
                      <option value="delivered">จัดส่งแล้ว</option>
                      <option value="sold" disabled>ขายคืนระบบ</option>
                      <option value="market" disabled>วางขายในตลาด</option>
                    </select>
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
