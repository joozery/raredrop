"use client";

import { useState, useEffect } from "react";
import { Search, User, ShoppingBag, Clock, Tag, Eye, X, Package, CheckCircle2, Send, Loader2 } from "lucide-react";

interface UserData {
  _id: string;
  name: string;
  avatar?: string;
  email?: string;
}

interface OrderRow {
  id: string;
  type: "shop" | "deliver";
  createdAt: string;
  user: UserData | null;
  title: string;
  image?: string;
  // ซื้อจากร้าน
  buyerUid?: string;
  quantity?: number;
  totalPrice?: number;
  deliveredData?: string[];
  // ขอรับของจริง
  uid?: string;
  ign?: string;
  channel?: string;
  fulfilled: boolean;
}

export default function ManageOrders() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewData, setViewData] = useState<string | null>(null);
  const [doneMessage, setDoneMessage] = useState("");
  const [savingMsg, setSavingMsg] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/purchases", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
        setDoneMessage(data.doneMessage || "");
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const saveDoneMessage = async () => {
    setSavingMsg(true);
    try {
      await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "order_done_message", value: doneMessage.trim() }),
      });
    } catch {} finally {
      setSavingMsg(false);
    }
  };

  const markDone = async (order: OrderRow) => {
    setProcessingId(order.id);
    try {
      const res = await fetch("/api/admin/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: order.type, id: order.id }),
      });
      if (res.ok) {
        setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, fulfilled: true } : o)));
      }
    } catch {} finally {
      setProcessingId(null);
    }
  };

  const filtered = orders.filter((o) =>
    o.title?.toLowerCase().includes(search.toLowerCase()) ||
    o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    (o.buyerUid || o.uid || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">ออเดอร์คำสั่งซื้อ (Orders)</h1>
        <p className="text-sm text-slate-500 mt-1">รวมออเดอร์ซื้อจากร้าน และคำขอรับของจริง — กดจบงานเพื่อแจ้งลูกค้าทางแชท</p>
      </div>

      {/* Preset done message */}
      <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="shrink-0">
            <p className="text-sm font-bold text-slate-700">ข้อความแจ้งลูกค้าเมื่อกดจบงาน</p>
            <p className="text-xs text-slate-400 mt-0.5">จะถูกส่งเข้าแชทของลูกค้าอัตโนมัติเมื่อกดปุ่มจบงาน</p>
          </div>
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={doneMessage}
              onChange={(e) => setDoneMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveDoneMessage(); }}
              placeholder="เช่น เติมเรียบร้อยแล้วครับ ✅"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/10 font-medium text-slate-700"
            />
            <button
              onClick={saveDoneMessage}
              disabled={savingMsg}
              className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:bg-slate-300 transition-colors shrink-0"
            >
              {savingMsg ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm flex flex-col overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อลูกค้า / สินค้า / UID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-red-500 transition-all font-medium text-slate-700"
            />
          </div>

          <div className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm shrink-0">
            รายการทั้งหมด: <span className="text-red-600 font-black ml-1">{orders.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">วันเวลา</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ประเภท</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ลูกค้า</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">รายการ</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">UID</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ชื่อในเกม</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">จำนวน</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">ราคา</th>
                <th className="py-4 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100/80">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">กำลังโหลดข้อมูล...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">ไม่พบออเดอร์</td>
                </tr>
              ) : filtered.map((o) => (
                <tr key={`${o.type}-${o.id}`} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-5 text-slate-500 text-[11px] font-medium whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} />
                      {new Date(o.createdAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    {o.type === "shop" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded-lg whitespace-nowrap">
                        <ShoppingBag size={11} /> ซื้อจากร้าน
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg whitespace-nowrap">
                        <Package size={11} /> รับของจริง
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden shrink-0">
                        {o.user?.avatar
                          ? <img src={o.user.avatar} alt="avatar" className="w-full h-full object-cover" />
                          : <User size={14} className="text-slate-400 m-auto mt-2" />
                        }
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-xs whitespace-nowrap">{o.user?.name || "Unknown"}</div>
                        {o.user?.email && <div className="text-[10px] text-slate-400">{o.user.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      {o.image ? (
                        <img src={o.image} alt={o.title} className="w-10 h-10 rounded-lg object-cover border border-slate-100 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                          <ShoppingBag size={16} className="text-slate-300" />
                        </div>
                      )}
                      <span className="font-bold text-slate-800 text-xs line-clamp-2 max-w-[160px]">{o.title}</span>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <span className="font-mono text-xs font-bold text-slate-700">{o.uid || "—"}</span>
                  </td>
                  <td className="py-4 px-5">
                    {/* ซื้อจากร้าน: ค่า UID/Username ที่ลูกค้ากรอกตอนซื้อ มาแสดงในช่องชื่อในเกม */}
                    <span className="text-xs font-bold text-slate-700">{o.ign || o.buyerUid || "—"}</span>
                  </td>
                  <td className="py-4 px-5 text-center">
                    {o.type === "shop"
                      ? <span className="inline-block min-w-[24px] font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-xs">{o.quantity}</span>
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="py-4 px-5 text-right">
                    {o.type === "shop" ? (
                      <div className="inline-flex items-center gap-1 font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100 whitespace-nowrap">
                        <Tag size={12} />
                        {(o.totalPrice || 0).toLocaleString()}
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center justify-center gap-1.5">
                      {o.type === "shop" && o.deliveredData && o.deliveredData.length > 0 && (
                        <button
                          onClick={() => setViewData(o.deliveredData!.join("\n\n———\n\n"))}
                          className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                        >
                          <Eye size={12} /> ดูข้อมูล
                        </button>
                      )}
                      {o.fulfilled ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-lg whitespace-nowrap">
                          <CheckCircle2 size={12} /> จบงานแล้ว
                        </span>
                      ) : (
                        <button
                          onClick={() => markDone(o)}
                          disabled={processingId === o.id}
                          className="inline-flex items-center gap-1.5 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                        >
                          {processingId === o.id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                          จบงาน
                        </button>
                      )}
                    </div>
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
