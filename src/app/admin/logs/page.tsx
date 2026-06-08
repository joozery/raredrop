"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, RefreshCw, ArrowUpRight, ArrowDownRight, Box, Store, ShieldCheck, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserData {
  _id: string;
  name: string;
  avatar?: string;
  email?: string;
}

interface LogEntry {
  _id: string;
  userId: UserData;
  type: string;
  amount: number;
  balanceAfter: number;
  description?: string;
  createdAt: string;
}

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string; sign: string }> = {
  topup:       { label: "เติมเงิน",      icon: ArrowDownRight, color: "text-green-600",  bg: "bg-green-50",  sign: "+" },
  withdraw:    { label: "ถอนเงิน",       icon: ArrowUpRight,   color: "text-red-600",    bg: "bg-red-50",    sign: "-" },
  buy_box:     { label: "เปิดกล่อง",     icon: Box,            color: "text-blue-600",   bg: "bg-blue-50",   sign: "-" },
  sell_item:   { label: "ขายคืนระบบ",    icon: ArrowRightLeft, color: "text-orange-600", bg: "bg-orange-50", sign: "+" },
  market_buy:  { label: "ซื้อจากตลาด",  icon: Store,          color: "text-purple-600", bg: "bg-purple-50", sign: "-" },
  market_sell: { label: "ขายในตลาด",    icon: Store,          color: "text-indigo-600", bg: "bg-indigo-50", sign: "+" },
  admin_adjust:{ label: "Admin ปรับ",    icon: ShieldCheck,    color: "text-slate-600",  bg: "bg-slate-50",  sign: "±" },
};

const PAGE_SIZE = 50;

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    let url = "/api/admin/transactions";
    if (typeFilter) url += `?type=${typeFilter}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setLogs(d); })
      .finally(() => setLoading(false));
  }, [typeFilter]);

  useEffect(() => {
    fetchLogs();
    setPage(1);
  }, [fetchLogs]);

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase();
    return (
      l.userId?.name?.toLowerCase().includes(q) ||
      l.userId?.email?.toLowerCase().includes(q) ||
      l.description?.toLowerCase().includes(q) ||
      l.type?.toLowerCase().includes(q)
    );
  });

  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = filtered.length > page * PAGE_SIZE;

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">บันทึกระบบ (System Logs)</h1>
          <p className="text-sm text-slate-500 mt-1">ธุรกรรมและกิจกรรมทางการเงินทั้งหมดในระบบ</p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm transition-colors"
        >
          <RefreshCw size={14} />
          รีเฟรช
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหาผู้ใช้, อีเมล, หมายเหตุ..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 bg-white"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-slate-700 font-medium"
        >
          <option value="">ทุกประเภท</option>
          {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
        <span className="text-sm text-slate-500 font-medium">
          {filtered.length.toLocaleString()} รายการ
        </span>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20 text-slate-400 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              กำลังโหลด...
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
            <ArrowRightLeft size={36} className="opacity-20" />
            <p className="text-sm font-medium">ไม่พบรายการ</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    {["เวลา", "ผู้ใช้", "ประเภท", "จำนวน", "ยอดคงเหลือหลัง", "หมายเหตุ"].map((h, i) => (
                      <th key={i} className="py-3 px-4 text-[11px] font-bold text-slate-400 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((log) => {
                    const cfg = TYPE_CONFIG[log.type] || { label: log.type, icon: ArrowRightLeft, color: "text-slate-600", bg: "bg-slate-50", sign: "" };
                    const IconComp = cfg.icon;
                    const isPositive = cfg.sign === "+";
                    return (
                      <tr key={log._id} className="border-b border-slate-50 hover:bg-slate-50/40 transition-colors">
                        <td className="py-3 px-4 text-[11px] text-slate-400 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleDateString("th-TH", {
                            day: "2-digit", month: "short", year: "numeric",
                          })}
                          <br />
                          <span className="font-mono text-[10px]">
                            {new Date(log.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 overflow-hidden shrink-0">
                              {log.userId?.avatar
                                ? <img src={log.userId.avatar} alt="" className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-500">
                                    {log.userId?.name?.charAt(0) || "?"}
                                  </div>
                              }
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 leading-none">{log.userId?.name || "–"}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{log.userId?.email || "–"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={cn(
                            "inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full",
                            cfg.color, cfg.bg
                          )}>
                            <IconComp size={11} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={cn(
                            "text-sm font-black",
                            isPositive ? "text-green-600" : log.type === "admin_adjust" ? "text-slate-600" : "text-red-600"
                          )}>
                            {cfg.sign}{Math.abs(log.amount).toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1">บาท</span>
                        </td>
                        <td className="py-3 px-4 text-xs font-bold text-slate-700">
                          {log.balanceAfter.toLocaleString()} บาท
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500 max-w-[200px] truncate">
                          {log.description || "–"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {hasMore && (
              <div className="flex justify-center py-4 border-t border-slate-100">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="px-6 py-2 text-sm font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  โหลดเพิ่มเติม ({filtered.length - page * PAGE_SIZE} รายการ)
                </button>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
