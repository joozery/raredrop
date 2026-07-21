"use client";

import { useEffect, useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";
import { History, Star, Trophy, ArrowLeft, RefreshCw, ChevronLeft, ChevronRight, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

interface RoundHistory {
  roundNumber: number;
  cardsTotal: number;
  cardsOpened: number;
  revenue: number;
  openCount: number;
  playerCount: number;
  completedAt: string;
  startedAt: string;
  completedReason: "all_opened" | "special";
  specialPrize: {
    name: string;
    title: string;
    icon?: string;
    openedByName?: string;
    openedAt?: string;
  } | null;
}

const PAGE_SIZE = 10;

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: RoundHistory }>;
  label?: string;
}

function CustomTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const r = payload[0].payload;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-xs min-w-[160px]">
      <p className="font-black text-slate-800 mb-2">รอบ #{r.roundNumber}</p>
      <p className="text-green-600 font-black text-base mb-1">฿{r.revenue.toLocaleString()}</p>
      <div className="flex flex-col gap-0.5 text-slate-500">
        <p>{r.openCount} ครั้ง · {r.playerCount} คน</p>
        <p>{r.cardsOpened}/{r.cardsTotal} ใบ</p>
        {r.completedReason === "special" && r.specialPrize && (
          <p className="text-amber-600 font-bold mt-1 flex items-center gap-1">
            <Star size={10} className="fill-amber-500 text-amber-500" />
            {r.specialPrize.name}
          </p>
        )}
      </div>
    </div>
  );
}

export default function CardRoundHistoryPage() {
  const [history, setHistory] = useState<RoundHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchHistory = () => {
    setLoading(true);
    fetch("/api/admin/card-rounds/history", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setHistory(d); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchHistory(); }, []);

  const totalRevenue = useMemo(() => history.reduce((s, r) => s + r.revenue, 0), [history]);
  const specialCount = useMemo(() => history.filter((r) => r.completedReason === "special").length, [history]);
  const avgRevenue = useMemo(() => history.length > 0 ? Math.round(totalRevenue / history.length) : 0, [totalRevenue, history.length]);
  const totalPlayers = useMemo(() => history.reduce((s, r) => s + r.playerCount, 0), [history]);

  // กราฟแสดงรอบล่าสุด 20 รอบ เรียงจากเก่าไปใหม่
  const chartData = useMemo(() => [...history].reverse().slice(-20), [history]);

  const totalPages = Math.ceil(history.length / PAGE_SIZE);
  const paged = useMemo(() => history.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [history, page]);

  const maxRevenue = useMemo(() => Math.max(...history.map((r) => r.revenue), 1), [history]);

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/cards"
            className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">ประวัติรอบสุ่มการ์ด</h1>
            <p className="text-sm text-slate-500 mt-0.5">สรุปรายได้และรางวัลพิเศษแต่ละรอบ</p>
          </div>
        </div>
        <button
          onClick={fetchHistory}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm transition-colors shrink-0"
        >
          <RefreshCw size={14} />
          รีเฟรช
        </button>
      </div>

      {/* Summary Cards */}
      {!loading && history.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-green-100 rounded-lg flex items-center justify-center">
                <Trophy size={14} className="text-green-600" />
              </div>
              <p className="text-xs font-bold text-slate-500">รายได้รวม</p>
            </div>
            <p className="text-2xl font-black text-green-600">฿{totalRevenue.toLocaleString()}</p>
            <p className="text-[11px] text-slate-400 mt-1">{history.length} รอบ</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp size={14} className="text-blue-600" />
              </div>
              <p className="text-xs font-bold text-slate-500">เฉลี่ย/รอบ</p>
            </div>
            <p className="text-2xl font-black text-slate-800">฿{avgRevenue.toLocaleString()}</p>
            <p className="text-[11px] text-slate-400 mt-1">บาท ต่อรอบ</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
                <Star size={14} className="text-amber-600" />
              </div>
              <p className="text-xs font-bold text-slate-500">รางวัลพิเศษ</p>
            </div>
            <p className="text-2xl font-black text-amber-500">
              {specialCount}
              <span className="text-base font-bold text-slate-400"> / {history.length}</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {history.length > 0 ? Math.round((specialCount / history.length) * 100) : 0}% ของทั้งหมด
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users size={14} className="text-purple-600" />
              </div>
              <p className="text-xs font-bold text-slate-500">ผู้เล่นรวม</p>
            </div>
            <p className="text-2xl font-black text-slate-800">{totalPlayers.toLocaleString()}</p>
            <p className="text-[11px] text-slate-400 mt-1">ครั้งเปิดการ์ด</p>
          </div>
        </div>
      )}

      {/* Chart */}
      {!loading && chartData.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-700 mb-3">รายได้แต่ละรอบ ({chartData.length} รอบล่าสุด)</h2>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 flex-1">
                <span className="w-3 h-8 rounded-sm bg-emerald-500 shrink-0" />
                <div>
                  <p className="text-[11px] font-black text-emerald-700">รอบปกติ</p>
                  <p className="text-[10px] text-slate-400 leading-snug">เปิดการ์ดครบทุกใบในรอบ</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 flex-1">
                <span className="w-3 h-8 rounded-sm bg-amber-400 shrink-0" />
                <div>
                  <p className="text-[11px] font-black text-amber-600">รางวัลพิเศษออก</p>
                  <p className="text-[10px] text-slate-400 leading-snug">มีคนเปิดการ์ดรางวัลพิเศษ — รอบจบก่อนครบ</p>
                </div>
              </div>
            </div>
          </div>
          <div className="px-4 py-6">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="roundNumber"
                  tickFormatter={(v) => `#${v}`}
                  tick={{ fontSize: 11, fontWeight: 700, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `฿${v >= 1000 ? `${v / 1000}k` : v}`}
                  tick={{ fontSize: 11, fontWeight: 600, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc", radius: 8 }} />
                <ReferenceLine
                  y={avgRevenue}
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  label={{ value: `เฉลี่ย ฿${avgRevenue.toLocaleString()}`, position: "insideTopRight", fontSize: 10, fill: "#94a3b8", fontWeight: 700 }}
                />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {chartData.map((r) => (
                    <Cell
                      key={r.roundNumber}
                      fill={r.completedReason === "special" ? "#fbbf24" : "#10b981"}
                      fillOpacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <History size={15} className="text-slate-400" />
          <h2 className="text-sm font-bold text-slate-700">รายละเอียดแต่ละรอบ</h2>
          {history.length > 0 && (
            <span className="ml-auto text-[10px] font-bold text-slate-400">
              {history.length} รอบทั้งหมด
            </span>
          )}
        </div>

        {loading ? (
          <div className="px-6 py-16 text-center">
            <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">กำลังโหลด...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="px-6 py-16 text-center text-slate-400 text-sm">ยังไม่มีรอบที่จบแล้ว</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    <th className="py-3 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">รอบ</th>
                    <th className="py-3 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">วันที่จบรอบ</th>
                    <th className="py-3 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">ผู้เล่น</th>
                    <th className="py-3 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">รายได้</th>
                    <th className="py-3 px-5 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">รางวัลพิเศษ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paged.map((r) => {
                    const completedDate = new Date(r.completedAt);
                    const isSpecial = r.completedReason === "special";
                    const revenuePct = Math.round((r.revenue / maxRevenue) * 100);
                    return (
                      <tr key={r.roundNumber} className={`hover:bg-slate-50/60 transition-colors ${isSpecial ? "bg-amber-50/30" : ""}`}>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2">
                            {isSpecial && <Star size={12} className="fill-amber-400 text-amber-400 shrink-0" />}
                            <span className="font-black text-slate-800">#{r.roundNumber}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 ml-[20px]">{r.cardsOpened}/{r.cardsTotal} ใบ</p>
                        </td>
                        <td className="py-4 px-5">
                          <p className="font-bold text-slate-700 text-xs">
                            {completedDate.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {completedDate.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.
                          </p>
                        </td>
                        <td className="py-4 px-5 text-center">
                          <span className="font-black text-slate-700">{r.playerCount}</span>
                          <span className="text-slate-400 text-xs"> คน</span>
                          <p className="text-[10px] text-slate-400 mt-0.5">{r.openCount} ครั้ง</p>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex flex-col items-end gap-1.5">
                            <span className={`font-black text-lg ${isSpecial ? "text-amber-500" : "text-green-600"}`}>
                              ฿{r.revenue.toLocaleString()}
                            </span>
                            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isSpecial ? "bg-amber-400" : "bg-emerald-500"}`}
                                style={{ width: `${revenuePct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-center">
                          {isSpecial && r.specialPrize ? (
                            <div className="flex flex-col items-center gap-1">
                              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 px-2 py-1 rounded-lg">
                                {r.specialPrize.icon && (
                                  <img src={r.specialPrize.icon} alt={r.specialPrize.name} className="w-4 h-4 object-contain rounded" />
                                )}
                                <span className="text-[10px] font-black text-amber-600">{r.specialPrize.name}</span>
                              </div>
                              {r.specialPrize.openedByName && (
                                <span className="text-[9px] text-slate-400">โดย {r.specialPrize.openedByName}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between gap-4">
                <p className="text-xs text-slate-500 font-medium">
                  แสดง {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, history.length)} จาก {history.length} รอบ
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={15} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .reduce<(number | "...")[]>((acc, p, i, arr) => {
                      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, i) =>
                      p === "..." ? (
                        <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-slate-400 font-bold">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setPage(p as number)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                            page === p
                              ? "bg-red-600 text-white shadow-sm"
                              : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
