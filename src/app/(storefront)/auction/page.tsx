"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import dayjs from "dayjs";
import "dayjs/locale/th";
dayjs.locale("th");
import {
  Gavel, Clock, Users, Crown, Flame, AlertCircle,
  ChevronLeft, ChevronRight, Trophy,
  Star, ChevronUp, Server, ShieldCheck, Zap, Sparkles, CheckCircle2, Award, ArrowUpRight, MessageCircle, X
} from "lucide-react";
import { useBalance } from "@/contexts/BalanceContext";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Round {
  id: string; title: string; gameImages: string[]; gameImage: string;
  description: string; highlights: string[]; tag: string; tagColor: string;
  server: string; accountLevel: number; startBid: number; currentBid: number;
  minBidStep: number; endsAt: Date; status: string; isHot: boolean;
  verified: boolean; topBidder: string | null; totalBids: number;
}

function mapRound(a: any): Round {
  const imgs: string[] = a.gameImages?.length ? a.gameImages : a.gameImage ? [a.gameImage] : [];
  return {
    id: a._id, title: a.title, gameImages: imgs, gameImage: imgs[0] || "",
    description: a.description || "", highlights: a.highlights || [],
    tag: a.tag, tagColor: a.tagColor, server: a.server || "TH",
    accountLevel: a.accountLevel || 1, startBid: a.startBid,
    currentBid: a.currentBid, minBidStep: a.minBidStep,
    endsAt: new Date(a.endsAt), status: a.status,
    isHot: a.isHot, verified: a.verified,
    topBidder: a.topBidder || null, totalBids: a.totalBids,
  };
}

// ─── Hooks ───────────────────────────────────────────────────────────────────
function useCountdown(endsAt: Date) {
  const calc = useCallback(() => {
    const diff = endsAt.getTime() - Date.now();
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, total: 0 };
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
      total: diff,
    };
  }, [endsAt]);
  const [t, setT] = useState(calc);
  useEffect(() => { const id = setInterval(() => setT(calc()), 1000); return () => clearInterval(id); }, [calc]);
  return t;
}

// ─── Desktop Gallery ────────────────────────────────────────────────────────
function Gallery({ images, verified }: { images: string[]; verified?: boolean }) {
  const [idx, setIdx] = useState(0);
  const imgs = images.length ? images : ["/product/pokemon.webp"];
  const isVid = (u: string) => /\.(mp4|webm|mov)(\?|$)/i.test(u);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-[16/10] border border-slate-200/80 shadow-md group">
        {isVid(imgs[idx])
          ? <video key={imgs[idx]} src={imgs[idx]} className="w-full h-full object-cover" autoPlay loop muted playsInline />
          : <img key={imgs[idx]} src={imgs[idx]} alt="" className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" onError={(e) => { (e.target as HTMLImageElement).src = "/product/pokemon.webp"; }} />}

        {imgs.length > 1 && <>
          <button onClick={() => setIdx((i) => (i - 1 + imgs.length) % imgs.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-md cursor-pointer">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => setIdx((i) => (i + 1) % imgs.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-md cursor-pointer">
            <ChevronRight size={20} />
          </button>
          <span className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-xs font-extrabold px-3 py-1 rounded-full border border-white/10">
            {idx + 1} / {imgs.length}
          </span>
        </>}
      </div>

      {imgs.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto hide-scrollbar py-1">
          {imgs.map((img, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${i === idx ? "border-red-600 shadow-md scale-105" : "border-slate-200 opacity-60 hover:opacity-100"}`}>
              {isVid(img)
                ? <video src={img} className="w-full h-full object-cover" muted />
                : <img src={img} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "/product/pokemon.webp"; }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── High-Tech Countdown Clock ───────────────────────────────────────────────
function BigCountdown({ endsAt }: { endsAt: Date }) {
  const { d, h, m, s, total } = useCountdown(endsAt);
  const urgent = total > 0 && total < 60 * 10 * 1000;

  if (total <= 0) return (
    <div className="bg-slate-900 text-white rounded-2xl p-4 text-center border border-slate-800 shadow-sm">
      <p className="text-slate-400 font-bold text-sm">สิ้นสุดการประมูลแล้ว</p>
    </div>
  );

  const units = d > 0
    ? [{ v: d, l: "วัน" }, { v: h, l: "ชม." }, { v: m, l: "นาที" }, { v: s, l: "วินาที" }]
    : [{ v: h, l: "ชั่วโมง" }, { v: m, l: "นาที" }, { v: s, l: "วินาที" }];

  return (
    <div className={`rounded-2xl p-5 border transition-all relative overflow-hidden ${urgent ? "bg-gradient-to-br from-red-950 via-slate-950 to-red-900 border-red-600/70 text-white shadow-xl shadow-red-950/60" : "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border-slate-800 text-white shadow-md"}`}>
      <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2.5">
        <p className={`text-xs font-black flex items-center gap-1.5 uppercase tracking-wider ${urgent ? "text-red-400 animate-pulse" : "text-amber-400"}`}>
          <Clock size={15} className={urgent ? "animate-spin text-red-400" : "text-amber-400"} />
          {urgent ? "⚡ เหลือเวลาน้อยมาก!" : "นับถอยหลังปิดประมูล"}
        </p>
        <span className="text-[10px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">LIVE TIMER</span>
      </div>

      <div className="flex justify-center items-center gap-2.5">
        {units.map(({ v, l }, i) => (
          <React.Fragment key={l}>
            {i > 0 && <span className={`text-xl font-black mb-3 ${urgent ? "text-red-400" : "text-slate-600"}`}>:</span>}
            <div className="flex flex-col items-center gap-1 flex-1">
              <div className={`w-full py-3 rounded-xl border flex items-center justify-center font-black text-2xl sm:text-3xl tabular-nums shadow-inner ${urgent ? "bg-red-600 border-red-500 text-white animate-pulse" : "bg-slate-800/90 border-slate-700/80 text-amber-400"}`}>
                {String(v).padStart(2, "0")}
              </div>
              <span className={`text-[10px] font-bold ${urgent ? "text-red-300" : "text-slate-400"}`}>{l}</span>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── Compact Countdown ────────────────────────────────────────────────────────
function CompactCountdown({ endsAt }: { endsAt: Date }) {
  const { d, h, m, s, total } = useCountdown(endsAt);
  const urgent = total > 0 && total < 60 * 10 * 1000;
  if (total <= 0) return <p className="text-slate-400 font-bold text-sm">หมดเวลา</p>;
  const str = d > 0 ? `${d}ว. ${h}ชม.` : h > 0 ? `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}` : `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  return <p className={`font-black text-xl tabular-nums leading-tight ${urgent ? "text-red-600 animate-pulse" : "text-slate-900"}`}>{str}</p>;
}

function SmallCountdown({ endsAt }: { endsAt: Date }) {
  const { h, m, s, total } = useCountdown(endsAt);
  if (total <= 0) return <span className="text-[10px] text-slate-400 font-bold">หมดเวลา</span>;
  const urgent = total < 60 * 60 * 1000;
  return <span className={`text-xs font-black ${urgent ? "text-red-600 animate-pulse" : "text-slate-700"}`}>{h > 0 ? `${h}ช. ${m}น.` : `${m}:${String(s).padStart(2,"0")}`}</span>;
}

// ─── Bid History List ─────────────────────────────────────────────────────────
function BidHistory({ bids, totalBids }: { bids: { user: string; amount: number; time: string; isTop?: boolean }[]; totalBids: number }) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-2">
          <Trophy size={15} className="text-amber-500" />
          <h3 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">ประวัติการเสนอราคา</h3>
        </div>
        <span className="text-[10px] bg-red-600 text-white font-extrabold px-2.5 py-0.5 rounded-full shadow-xs">
          {totalBids} ครั้ง
        </span>
      </div>
      {bids.length === 0 ? (
        <div className="py-8 text-center flex flex-col items-center gap-2 text-slate-400">
          <Gavel size={24} className="opacity-30" />
          <p className="text-xs font-bold">ยังไม่มีผู้เสนอราคา เป็นคนแรกเลย!</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
          {bids.slice(0, 10).map((b, i) => (
            <div key={i} className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${b.isTop ? "bg-amber-50/80" : "hover:bg-slate-50"}`}>
              <div className="w-5 flex justify-center shrink-0">
                {i === 0 ? <Crown size={16} className="text-amber-500 drop-shadow-xs" />
                  : i === 1 ? <Award size={14} className="text-slate-400" />
                  : i === 2 ? <Award size={14} className="text-amber-700/60" />
                  : <span className="text-[10px] text-slate-400 font-bold">#{i + 1}</span>}
              </div>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-extrabold shrink-0 shadow-xs"
                style={{ backgroundColor: i === 0 ? "#e11d48" : "#64748b" }}
              >
                {b.user.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate text-slate-800">{b.user}</p>
                <p className="text-[10px] text-slate-400">{b.time}</p>
              </div>
              <span className={`font-extrabold text-xs shrink-0 ${b.isTop ? "text-red-600" : "text-slate-700"}`}>
                ฿{b.amount.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface WinItem { _id: string; title: string; gameImages: string[]; winnerBid?: number; currentBid: number }
interface EndedWinner { name: string; amount: number; title: string }

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AuctionPage() {
  const { data: session } = useSession();
  const { refreshBalance } = useBalance();
  const router = useRouter();
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState(0);
  const [isBidding, setIsBidding] = useState(false);
  const [bids, setBids] = useState<{ user: string; amount: number; time: string; isTop?: boolean }[]>([]);
  const [currentBid, setCurrentBid] = useState(0);
  const [totalBids, setTotalBids] = useState(0);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [rtActivity, setRtActivity] = useState<string | null>(null);
  const [winnerPopup, setWinnerPopup] = useState<WinItem | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [liveEndsAt, setLiveEndsAt] = useState<Date | null>(null);
  const [endedWinner, setEndedWinner] = useState<EndedWinner | null>(null);

  const currentRoundRef = useRef<Round | null>(null);
  const minBidStepRef   = useRef(0);
  const bidsRef         = useRef<{ user: string; amount: number; time: string }[]>([]);
  const currentBidRef   = useRef(0);

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchRounds = useCallback(async () => {
    try {
      const res = await fetch("/api/auction");
      if (res.ok) setRounds((await res.json() as any[]).map(mapRound));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRounds(); }, [fetchRounds]);

  const checkMyWins = useCallback(() => {
    if (!session) return;
    fetch("/api/auction/my-wins")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setWinnerPopup(data[0]);
      })
      .catch(() => {});
  }, [session]);

  // เช็ค unclaimed wins ตอนโหลด + ทุก 30 วินาที
  useEffect(() => {
    checkMyWins();
    const id = setInterval(checkMyWins, 30_000);
    return () => clearInterval(id);
  }, [checkMyWins]);

  // Socket.IO real-time
  useEffect(() => {
    const socket: Socket = io({ path: "/socket.io" });

    socket.on("auction:bid", (data: { auctionId: string; amount: number; displayName: string; totalBids: number; newEndsAt?: string }) => {
      if (!currentRoundRef.current || data.auctionId !== currentRoundRef.current.id) return;

      const timeStr = dayjs().format("D MMM HH:mm");

      setCurrentBid(data.amount);
      currentBidRef.current = data.amount;
      setTotalBids(data.totalBids);

      // อัปเดตเวลาสิ้นสุดถ้ามีการต่อเวลา (anti-snipe)
      if (data.newEndsAt) setLiveEndsAt(new Date(data.newEndsAt));

      setBids((prev) => {
        const next = [
          { user: data.displayName, amount: data.amount, time: timeStr, isTop: true },
          ...prev.slice(0, 9).map((b) => ({ ...b, isTop: false })),
        ];
        bidsRef.current = next;
        return next;
      });

      setBidAmount((prev) => {
        const newMin = data.amount + minBidStepRef.current;
        return prev <= data.amount ? newMin : prev;
      });

      // อัปเดตยอดเครดิตทุกคนที่เปิดหน้าอยู่ (คนแพ้จะได้เห็นเครดิตคืนทันที)
      refreshBalance();

      setRtActivity(data.displayName);
      setTimeout(() => setRtActivity(null), 2500);
    });

    // รับ event เมื่อ admin/auto-end ปิดประมูลและประกาศผู้ชนะ
    socket.on("auction:winner", (data: { auctionId: string; winnerId: string; title: string; winnerBid: number; topBidder?: string }) => {
      if (data.topBidder && data.winnerBid) {
        setEndedWinner({ name: data.topBidder, amount: data.winnerBid, title: data.title });
      }
      fetch("/api/auction/my-wins")
        .then((r) => r.json())
        .then((myData) => {
          if (Array.isArray(myData) && myData.length > 0) setWinnerPopup(myData[0]);
        })
        .catch(() => {});
    });

    return () => { socket.disconnect(); };
  }, []);

  const now = new Date();
  const activeRounds   = rounds.filter((r) => r.status === "active" && r.endsAt > now).sort((a, b) => a.endsAt.getTime() - b.endsAt.getTime());
  const currentRound   = activeRounds[0] ?? null;
  const upcomingRounds = activeRounds.slice(1);
  const pastRounds     = rounds.filter((r) => r.status === "ended" || r.endsAt <= now).sort((a, b) => b.endsAt.getTime() - a.endsAt.getTime());

  useEffect(() => {
    if (!currentRound) { currentRoundRef.current = null; return; }
    currentRoundRef.current = currentRound;
    minBidStepRef.current   = currentRound.minBidStep;
    setCurrentBid(currentRound.currentBid);
    currentBidRef.current = currentRound.currentBid;
    setTotalBids(currentRound.totalBids);
    setBidAmount(currentRound.currentBid + currentRound.minBidStep);
    setLiveEndsAt(null);
    setEndedWinner(null);
    fetch(`/api/auction/${currentRound.id}`).then((r) => r.json()).then((data) => {
      if (data.bids) setBids(data.bids.map((b: any, i: number) => ({
        user: b.displayName, amount: b.amount,
        time: dayjs(b.createdAt).format("D MMM HH:mm"),
        isTop: i === 0,
      })));
    }).catch(() => {});
  }, [currentRound?.id]);

  // เมื่อ countdown ถึง 0 → trigger end ทันที แล้วเช็ค winner
  const effectiveEndsAt = liveEndsAt ?? currentRound?.endsAt ?? null;
  useEffect(() => {
    if (!effectiveEndsAt) return;
    const diff = effectiveEndsAt.getTime() - Date.now();
    if (diff <= 0) return;
    const auctionId = currentRoundRef.current?.id;
    const titleSnapshot = currentRoundRef.current?.title || "";
    const id = setTimeout(async () => {
      // ประกาศผู้ชนะสำหรับทุกคนจาก bids state
      if (bidsRef.current.length > 0) {
        setEndedWinner({ name: bidsRef.current[0].user, amount: currentBidRef.current, title: titleSnapshot });
      }
      // trigger end บน server (idempotent) → emits auction:winner via Socket.IO
      if (auctionId) {
        try {
          await fetch(`/api/auction/${auctionId}/end`, { method: "POST" });
        } catch {}
      }
      // เช็ค my-wins สำหรับ user ที่ชนะ
      fetch("/api/auction/my-wins")
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data) && data.length > 0) setWinnerPopup(data[0]); })
        .catch(() => {});
    }, diff + 2000);
    return () => clearTimeout(id);
  }, [effectiveEndsAt]);

  const handleBid = async () => {
    if (!currentRound || isBidding) return;
    if (!session) { showToast("กรุณาเข้าสู่ระบบก่อนประมูล", false); return; }
    const min = currentBid + currentRound.minBidStep;
    if (bidAmount < min) { showToast(`ต้องเสนออย่างน้อย ฿${min.toLocaleString()}`, false); return; }
    setIsBidding(true);
    try {
      const res = await fetch(`/api/auction/${currentRound.id}/bid`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: bidAmount }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "เกิดข้อผิดพลาด", false); return; }
      showToast(`ประมูล ฿${bidAmount.toLocaleString()} สำเร็จ!`);
      refreshBalance();
    } finally { setIsBidding(false); }
  };

  const handleClaim = async () => {
    if (!winnerPopup || claiming) return;
    setClaiming(true);
    try {
      const res = await fetch(`/api/auction/${winnerPopup._id}/claim`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "เกิดข้อผิดพลาด", false); return; }
      setWinnerPopup(null);
      router.push(data.conversationId ? `/chat?c=${data.conversationId}` : "/chat");
    } catch {
      showToast("เกิดข้อผิดพลาด กรุณาลองใหม่", false);
    } finally {
      setClaiming(false);
    }
  };

  if (loading) return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto flex flex-col gap-4">
      <div className="h-96 bg-slate-100 rounded-3xl animate-pulse" />
    </div>
  );

  const minNext = currentRound ? currentBid + currentRound.minBidStep : 0;
  const activeEndsAt = liveEndsAt ?? currentRound?.endsAt ?? new Date(0);
  const isEnded = currentRound ? activeEndsAt <= now : true;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 pb-32 lg:pb-12 min-h-screen">

      <div>
        {/* ── Winner Announcement Banner ── */}
        {endedWinner && (
          <div className="relative bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 rounded-3xl shadow-lg mb-6 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.25),transparent)]" />
            <div className="relative flex items-center gap-4 px-5 py-4">
              <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0 shadow-md">
                <Crown size={24} className="text-white drop-shadow" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-black text-base leading-tight drop-shadow-sm">
                  🏆 ผู้ชนะการประมูล!
                </p>
                <p className="text-amber-100 text-sm font-semibold mt-0.5 truncate">
                  <span className="font-black text-white">{endedWinner.name}</span>
                  {" "}คว้าชัย{endedWinner.title ? ` "${endedWinner.title}"` : ""}
                  {" "}ด้วยราคา{" "}
                  <span className="font-black text-white">฿{endedWinner.amount.toLocaleString()}</span>
                </p>
              </div>
              <button onClick={() => setEndedWinner(null)} className="w-7 h-7 bg-black/10 hover:bg-black/20 rounded-full flex items-center justify-center text-white shrink-0 transition-colors cursor-pointer">
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ── No Active Round ── */}
        {!currentRound ? (
          <div className="bg-white border border-slate-200/80 rounded-3xl py-16 flex flex-col items-center text-center shadow-xs mb-8">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4 text-slate-400">
              <Gavel size={32} />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">ยังไม่มีรอบประมูลที่เปิดอยู่ขณะนี้</h2>
            <p className="text-xs text-slate-500 max-w-sm">ติดตามรอบถัดไปด้านล่าง หรือรอการประกาศรอบประมูลใหม่จากทีมงาน</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-3xl shadow-lg overflow-hidden mb-8">
            {/* Round Status Top Bar */}
            <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 px-5 sm:px-6 py-3.5 flex items-center justify-between text-white shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
                </span>
                <span className="font-black text-sm tracking-wide uppercase truncate drop-shadow-xs">
                  🔥 รอบที่กำลังประมูลอยู่ตอนนี้ (LIVE STAGE)
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-extrabold text-white bg-black/20 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
                  <Users size={13} className="inline mr-1" /> {totalBids} บิดแล้ว
                </span>
                {currentRound.isHot && (
                  <span className="text-[11px] font-black bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider shadow-xs">
                    <Flame size={11} className="fill-slate-950" /> HOT
                  </span>
                )}
              </div>
            </div>

            {/* Real-time bid notification banner */}
            {rtActivity && (
              <div className="bg-amber-500 text-slate-950 px-5 py-2.5 flex items-center gap-2.5 font-bold text-xs animate-pulse">
                <Sparkles size={16} className="text-slate-950 shrink-0" />
                <p className="truncate">
                  🎉 <span className="font-black underline">{rtActivity}</span> เพิ่งเสนอราคาประมูลใหม่พุ่งขึ้นแล้ว!
                </p>
                <span className="text-[10px] font-black bg-slate-950 text-amber-400 ml-auto px-2 py-0.5 rounded">LIVE</span>
              </div>
            )}

            {/* Main Content Layout */}
            <div className="p-5 sm:p-6 lg:p-8 flex flex-col lg:flex-row gap-8">
              {/* ── LEFT COLUMN: Gallery & Account Specifications ── */}
              <div className="flex-1 min-w-0 flex flex-col gap-5">
                <Gallery images={currentRound.gameImages} verified={currentRound.verified} />

                {/* Mobile Countdown & Current Bid Grid */}
                <div className="lg:hidden grid grid-cols-2 gap-3">
                  <div className={`rounded-2xl p-3.5 border ${activeEndsAt.getTime() - Date.now() < 60*10*1000 ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200/80"}`}>
                    <p className="text-[10px] text-slate-400 font-bold mb-1 flex items-center gap-1">
                      <Clock size={11} /> เวลาที่เหลือ
                    </p>
                    <CompactCountdown endsAt={activeEndsAt} />
                  </div>
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5">
                    <p className="text-[10px] text-slate-400 font-bold mb-1">ราคาปัจจุบัน</p>
                    <p className="text-xl font-black text-red-600 leading-tight">฿{currentBid.toLocaleString()}</p>
                    {bids[0] && (
                      <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 truncate font-medium">
                        <Crown size={10} className="text-amber-500 shrink-0" /> {bids[0].user}
                      </p>
                    )}
                  </div>
                </div>

                {/* Account Details Box */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 sm:p-6 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="text-[11px] font-black text-white px-3 py-1 rounded-md shadow-xs uppercase tracking-wider"
                      style={{ backgroundColor: currentRound.tagColor || "#e11d48" }}
                    >
                      {currentRound.tag}
                    </span>
                    <span className="text-xs text-slate-700 font-extrabold flex items-center gap-1 ml-auto bg-white px-3 py-1 rounded-md border border-slate-200 shadow-2xs">
                      <Server size={13} className="text-slate-400" /> Server: {currentRound.server}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                    {currentRound.title}
                  </h2>

                  {currentRound.description && (
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                      {currentRound.description}
                    </p>
                  )}
                </div>

                {/* Mobile Bid Input Panel */}
                {!isEnded && (
                  <div className="lg:hidden bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 shadow-xs">
                    <p className="text-xs font-bold text-slate-800">วางเดิมพันเสนอราคา</p>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xl">฿</span>
                      <input
                        type="number" inputMode="numeric"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(Number(e.target.value))}
                        min={minNext} step={currentRound.minBidStep}
                        className="w-full border-2 border-slate-200 focus:border-red-600 rounded-xl pl-10 pr-4 py-3.5 text-2xl font-black text-slate-900 outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 5].map((mul) => (
                        <button key={mul}
                          onClick={() => setBidAmount(currentBid + currentRound.minBidStep * mul)}
                          className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 py-2.5 rounded-xl">
                          +฿{(currentRound.minBidStep * mul).toLocaleString()}
                        </button>
                      ))}
                    </div>
                    {bidAmount < minNext && (
                      <p className="text-xs text-red-600 font-bold flex items-center gap-1">
                        <AlertCircle size={13} /> ต้องเสนออย่างน้อย ฿{minNext.toLocaleString()}
                      </p>
                    )}
                    <button onClick={handleBid} disabled={isBidding || bidAmount < minNext}
                      className={`w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 ${bidAmount < minNext || isBidding ? "bg-slate-100 text-slate-400" : "bg-red-600 text-white shadow-md shadow-red-600/20"}`}>
                      {isBidding ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Gavel size={18} /> ประมูล ฿{bidAmount.toLocaleString()}</>}
                    </button>
                  </div>
                )}

                {/* Mobile Bid History */}
                <div className="lg:hidden">
                  <BidHistory bids={bids} totalBids={totalBids} />
                </div>
              </div>

              {/* ── RIGHT COLUMN: Desktop Premium Bidding Console ── */}
              <div className="hidden lg:flex w-[380px] shrink-0 flex-col gap-5">
                {/* High-Tech Countdown Box */}
                <BigCountdown endsAt={activeEndsAt} />

                {/* Current Highest Bid Card */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 shadow-xs relative overflow-hidden">
                  <span className="text-[10px] font-black px-2.5 py-0.5 bg-red-600 text-white rounded-full uppercase tracking-wider inline-block mb-2">
                    HIGHEST BID NOW
                  </span>
                  <p className="text-4xl sm:text-5xl font-black text-red-600 leading-none my-1 tracking-tight">
                    ฿{currentBid.toLocaleString()}
                  </p>

                  {bids[0] ? (
                    <div className="flex items-center gap-2 mt-3 text-xs font-bold text-slate-800 bg-amber-100/80 border border-amber-300/60 rounded-xl px-3.5 py-2.5 shadow-2xs">
                      <Crown size={16} className="text-amber-600 shrink-0 drop-shadow-2xs" />
                      <span className="truncate">ผู้นำสูงสุดขณะนี้: <strong className="text-red-600 font-extrabold">{bids[0].user}</strong></span>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-medium mt-2">ยังไม่มีผู้เสนอราคา (ราคาเริ่มต้น ฿{currentRound.startBid.toLocaleString()})</p>
                  )}

                  <div className="flex items-center justify-between mt-3 text-xs text-slate-500 pt-3 border-t border-slate-200/80 font-medium">
                    <span>ขั้นต่ำเสนอราคาเพิ่ม</span>
                    <span className="font-extrabold text-slate-900">+฿{currentRound.minBidStep.toLocaleString()}</span>
                  </div>
                </div>

                {/* Desktop Bid Input Form */}
                {!isEnded ? (
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                        วางเดิมพันแข่งเสนอราคา
                      </h3>
                      <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                        ขั้นต่ำ ฿{minNext.toLocaleString()}
                      </span>
                    </div>

                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-2xl">฿</span>
                      <input
                        type="number" inputMode="numeric" value={bidAmount}
                        onChange={(e) => setBidAmount(Number(e.target.value))}
                        min={minNext} step={currentRound.minBidStep}
                        className="w-full border-2 border-slate-200 focus:border-red-600 rounded-xl pl-10 pr-4 py-3.5 text-2xl font-black text-slate-900 outline-none transition-colors"
                      />
                    </div>

                    {/* Quick Step buttons */}
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 5].map((mul) => (
                        <button
                          key={mul}
                          type="button"
                          onClick={() => setBidAmount(currentBid + currentRound.minBidStep * mul)}
                          className="text-xs font-extrabold text-slate-700 bg-slate-50 hover:bg-red-600 hover:text-white border border-slate-200 hover:border-red-600 py-2.5 rounded-xl transition-all cursor-pointer shadow-2xs"
                        >
                          +฿{(currentRound.minBidStep * mul).toLocaleString()}
                        </button>
                      ))}
                    </div>

                    {bidAmount < minNext && (
                      <p className="text-xs text-red-600 font-bold flex items-center gap-1">
                        <AlertCircle size={13} /> ต้องเสนอราคาสูงกว่าอย่างน้อย ฿{minNext.toLocaleString()}
                      </p>
                    )}

                    <button
                      onClick={handleBid}
                      disabled={isBidding || bidAmount < minNext}
                      className={`w-full py-4 rounded-xl font-extrabold text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                        bidAmount < minNext || isBidding
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20 active:scale-[0.98]"
                      }`}
                    >
                      {isBidding ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Gavel size={18} /> ยืนยันประมูล ฿{bidAmount.toLocaleString()}
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5 text-center text-xs text-slate-500 font-bold">
                    การประมูลรอบนี้จบลงแล้ว
                  </div>
                )}

                {/* Desktop Bid History */}
                <BidHistory bids={bids} totalBids={totalBids} />
              </div>
            </div>
          </div>
        )}

        {/* ── Upcoming Rounds Section ── */}
        {upcomingRounds.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-5 bg-red-600 rounded-full" />
              <h2 className="font-extrabold text-slate-900 text-lg">รอบประมูลถัดไป</h2>
              <span className="text-xs text-slate-500 font-bold">({upcomingRounds.length} รายการ)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {upcomingRounds.map((r) => (
                <div
                  key={r.id}
                  className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all group flex flex-col"
                >
                  <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                    <img
                      src={r.gameImages[0] || "/product/pokemon.webp"}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/product/pokemon.webp"; }}
                    />
                    <span
                      className="absolute top-2 left-2 text-[10px] font-extrabold text-white px-2 py-0.5 rounded-md shadow-xs"
                      style={{ backgroundColor: r.tagColor || "#64748b" }}
                    >
                      {r.tag}
                    </span>
                  </div>

                  <div className="p-3.5 flex flex-col gap-2 flex-1">
                    <p className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-red-600 transition-colors">
                      {r.title}
                    </p>
                    <div className="flex items-center justify-between text-xs mt-auto pt-2 border-t border-slate-100">
                      <span className="text-slate-400 font-medium">ราคาตั้งต้น</span>
                      <span className="font-extrabold text-red-600">฿{r.startBid.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1 font-medium"><Clock size={11} /> เริ่มใน</span>
                      <SmallCountdown endsAt={r.endsAt} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Past Rounds Section ── */}
        {pastRounds.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-5 bg-slate-300 rounded-full" />
              <h2 className="font-extrabold text-slate-900 text-lg">ผลการประมูลที่ผ่านมา</h2>
              <span className="text-xs text-slate-500 font-bold">({pastRounds.length} รายการ)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {pastRounds.slice(0, 10).map((r) => (
                <div
                  key={r.id}
                  className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs opacity-90 hover:opacity-100 transition-opacity"
                >
                  <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden grayscale">
                    <img
                      src={r.gameImages[0] || "/product/pokemon.webp"}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/product/pokemon.webp"; }}
                    />
                    <span className="absolute top-2 left-2 text-[10px] font-extrabold text-white bg-slate-700 px-2 py-0.5 rounded-md">
                      จบการประมูล
                    </span>
                  </div>

                  <div className="p-3.5">
                    <p className="text-xs font-bold text-slate-800 line-clamp-1 mb-1">{r.title}</p>
                    <div className="flex items-center justify-between text-xs mt-1">
                      <span className="text-slate-400 font-medium">จบที่ราคา</span>
                      <span className="font-extrabold text-slate-900">฿{r.currentBid.toLocaleString()}</span>
                    </div>
                    {r.topBidder && (
                      <div className="text-[11px] text-amber-700 font-bold mt-1.5 flex items-center gap-1 truncate bg-amber-50 px-2 py-0.5 rounded">
                        <Crown size={11} className="text-amber-500 shrink-0" />
                        <span className="truncate">ผู้ชนะ: {r.topBidder}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile Sticky Bid Bar ── */}
      {currentRound && !isEnded && (
        <div className="lg:hidden fixed bottom-16 inset-x-0 z-40 bg-white border-t border-slate-200 shadow-2xl">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400 font-medium leading-none mb-0.5">ราคาปัจจุบัน</p>
              <p className="text-lg font-black text-red-600 leading-tight">฿{currentBid.toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setBidAmount((v) => Math.max(minNext, v - currentRound.minBidStep))}
                className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-black text-lg active:bg-slate-200"
              >
                −
              </button>
              <div className="text-center min-w-[70px]">
                <p className="text-[10px] text-slate-400 font-medium">เสนอ</p>
                <p className="text-sm font-black text-slate-900">฿{bidAmount.toLocaleString()}</p>
              </div>
              <button
                onClick={() => setBidAmount((v) => v + currentRound.minBidStep)}
                className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-black text-lg active:bg-slate-200"
              >
                +
              </button>
            </div>
            <button
              onClick={handleBid}
              disabled={isBidding || bidAmount < minNext}
              className={`flex items-center gap-1.5 font-bold px-5 py-3 rounded-xl text-sm shrink-0 transition-all active:scale-95 ${
                bidAmount < minNext || isBidding ? "bg-slate-200 text-slate-400" : "bg-red-600 text-white"
              }`}
            >
              <Gavel size={15} /> ประมูล
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-[300] px-5 py-2.5 rounded-xl shadow-xl font-bold text-xs text-white flex items-center gap-2 whitespace-nowrap border ${toast.ok ? "bg-slate-900 border-slate-800" : "bg-red-600 border-red-500"}`}>
          {toast.ok ? <CheckCircle2 size={15} className="text-emerald-400" /> : <AlertCircle size={15} />} {toast.msg}
        </div>
      )}

      {/* Winner Popup */}
      {winnerPopup && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-sm overflow-hidden p-6 text-center border border-slate-100">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20">
              <Trophy size={28} className="text-white" />
            </div>
            
            <h2 className="text-slate-900 font-black text-xl mb-1">คุณชนะการประมูล!</h2>
            <p className="text-slate-500 text-xs font-semibold mb-6">กดรับสินค้าเพื่อเปิดแชทกับทีมงาน</p>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-5 text-left flex flex-col items-center">
              {winnerPopup.gameImages?.[0] && (
                <div className="w-16 h-16 rounded-lg overflow-hidden mb-3 bg-slate-200 shadow-sm shrink-0">
                  <img src={winnerPopup.gameImages[0]} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <h3 className="font-bold text-slate-800 text-sm mb-2 text-center line-clamp-2">{winnerPopup.title}</h3>
              <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-slate-200 shadow-sm mt-1">
                <span className="text-[11px] text-slate-500 font-bold">ราคาที่ชนะ</span>
                <span className="font-black text-lg text-red-600">฿{(winnerPopup.winnerBid || winnerPopup.currentBid).toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handleClaim}
              disabled={claiming}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-sm py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] mb-4"
            >
              {claiming
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> กำลังดำเนินการ...</>
                : <><MessageCircle size={18} /> รับสินค้า & คุยกับแอดมิน</>}
            </button>

            <button
              onClick={() => setWinnerPopup(null)}
              disabled={claiming}
              className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center gap-1"
            >
              ปิดชั่วคราว (จะกลับมาแจ้งเตือนอีกครั้ง)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
