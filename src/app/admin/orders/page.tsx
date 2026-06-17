"use client";

import { useState, useEffect } from "react";
import { Search, User, ShoppingBag, Clock, Tag, Eye, X } from "lucide-react";

interface UserData {
  _id: string;
  name: string;
  avatar?: string;
  email?: string;
}

interface PurchaseData {
  _id: string;
  userId: UserData;
  shopListingId: string;
  listingTitle: string;
  listingImage?: string;
  pricePaid: number;
  deliveredData: string;
  createdAt: string;
}

export default function ManageOrders() {
  const [purchases, setPurchases] = useState<PurchaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewData, setViewData] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/purchases");
      if (res.ok) {
        setPurchases(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const filtered = purchases.filter(p =>
    p.listingTitle?.toLowerCase().includes(search.toLowerCase()) ||
    p.userId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">ออเดอร์คำสั่งซื้อ (Shop Orders)</h1>
        <p className="text-sm text-slate-500 mt-1">ประวัติการซื้อสินค้าจากร้านค้าทั้งหมด</p>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="relative w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อผู้ซื้อ หรือชื่อสินค้า..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-red-500 transition-all font-medium text-slate-700"
            />
          </div>

          <div className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
            รายการทั้งหมด: <span className="text-red-600 font-black ml-1">{purchases.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">วันเวลา</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ผู้ซื้อ</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">สินค้า</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">ราคาที่จ่าย</th>
                <th className="py-4 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">Account ที่ส่ง</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100/80">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">กำลังโหลดข้อมูล...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">ไม่พบออเดอร์</td>
                </tr>
              ) : filtered.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6 text-slate-500 text-[11px] font-medium">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} />
                      {new Date(p.createdAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden shrink-0">
                        {p.userId?.avatar
                          ? <img src={p.userId.avatar} alt="avatar" className="w-full h-full object-cover" />
                          : <User size={14} className="text-slate-400 m-auto mt-2" />
                        }
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-xs">{p.userId?.name || "Unknown"}</div>
                        {p.userId?.email && <div className="text-[10px] text-slate-400">{p.userId.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      {p.listingImage ? (
                        <img src={p.listingImage} alt={p.listingTitle} className="w-10 h-10 rounded-lg object-cover border border-slate-100 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                          <ShoppingBag size={16} className="text-slate-300" />
                        </div>
                      )}
                      <span className="font-bold text-slate-800 text-xs line-clamp-2">{p.listingTitle}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="inline-flex items-center gap-1 font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                      <Tag size={12} />
                      {p.pricePaid.toLocaleString()}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <button
                      onClick={() => setViewData(p.deliveredData)}
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Eye size={12} /> ดูข้อมูล
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: view delivered data */}
      {viewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setViewData(null)}>
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">ข้อมูล Account ที่ส่งให้ผู้ซื้อ</h3>
              <button onClick={() => setViewData(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <pre className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                {viewData}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
