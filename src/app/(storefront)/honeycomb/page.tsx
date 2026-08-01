"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Sparkles, Trophy, History, Hexagon, Flame, ArrowRight, HelpCircle, X, Wallet, ShieldCheck, Ticket } from "lucide-react";
import { TopupModal } from "@/components/payment/TopupModal";

interface HoneyReward {
  id: string;
  name: string;
  category: "legendary" | "epic" | "rare" | "common";
  type: "item" | "coin" | "coin_reward";
  value: number;
  coinAmount?: number;
  image: string;
  badgeText: string;
  description: string;
  rate?: number;
  isLocked?: boolean;
}

interface HoneyCell {
  id: number;
  isOpened: boolean;
  isRevealing: boolean;
  reward: HoneyReward | null;
  displayReward: HoneyReward | null;
}

interface WinHistoryItem {
  id: string;
  user: string;
  rewardName: string;
  category: "legendary" | "epic" | "rare" | "common";
  time: string;
  icon: string;
}

// Default Rewards pool
const REWARDS_POOL: HoneyReward[] = [
  {
    id: "leg-1",
    name: "ROV Account Lv.50 Conqueror",
    category: "legendary",
    type: "item",
    value: 12500,
    image: "/product/pokemon.webp",
    badgeText: "LEGENDARY",
    description: "ไอดี ROV Conqueror สกิน Eternal + Limited ครบชุด",
  },
  {
    id: "leg-2",
    name: "5,000 GemCoins (Jackpot)",
    category: "legendary",
    type: "coin",
    value: 5000,
    image: "/product/pokemon.webp",
    badgeText: "JACKPOT",
    description: "รางวัลแจ็กพอต 5,000 GemCoins เข้ากระเป๋าทันที",
  },
  {
    id: "epic-1",
    name: "Genshin Impact AR58 End Game",
    category: "epic",
    type: "item",
    value: 8900,
    image: "/product/pokemon.webp",
    badgeText: "EPIC PRIZE",
    description: "ไอดี Genshin 5 ดาว 14 ตัว ละครแน่นๆ พร้อมลุย",
  },
  {
    id: "epic-2",
    name: "1,000 GemCoins",
    category: "epic",
    type: "coin",
    value: 1000,
    image: "/product/pokemon.webp",
    badgeText: "1,000 🪙",
    description: "โบนัส 1,000 GemCoins",
  },
  {
    id: "rare-1",
    name: "500 GemCoins",
    category: "rare",
    type: "coin",
    value: 500,
    image: "/product/pokemon.webp",
    badgeText: "RARE",
    description: "รับ 500 GemCoins",
  },
  {
    id: "rare-2",
    name: "250 GemCoins",
    category: "rare",
    type: "coin",
    value: 250,
    image: "/product/pokemon.webp",
    badgeText: "RARE",
    description: "รับ 250 GemCoins",
  },
  {
    id: "common-1",
    name: "100 GemCoins",
    category: "common",
    type: "coin",
    value: 100,
    image: "/product/pokemon.webp",
    badgeText: "COMMON",
    description: "รับ 100 GemCoins",
  },
  {
    id: "common-2",
    name: "60 GemCoins",
    category: "common",
    type: "coin",
    value: 60,
    image: "/product/pokemon.webp",
    badgeText: "COMMON",
    description: "รับ 60 GemCoins",
  },
  {
    id: "common-3",
    name: "50 GemCoins (คืนทุน)",
    category: "common",
    type: "coin",
    value: 50,
    image: "/product/pokemon.webp",
    badgeText: "REFUND",
    description: "รับ 50 GemCoins คืนทุนทันที",
  },
];

const TOTAL_CELLS = 19;

const INITIAL_WIN_HISTORY: WinHistoryItem[] = [
  { id: "w1", user: "user***888", rewardName: "ROV Account Conqueror", category: "legendary", time: "1 นาทีที่แล้ว", icon: "👑" },
  { id: "w2", user: "honey***boy", rewardName: "5,000 GemCoins (Jackpot)", category: "legendary", time: "3 นาทีที่แล้ว", icon: "💰" },
  { id: "w3", user: "gamer***999", rewardName: "Genshin Impact AR58", category: "epic", time: "5 นาทีที่แล้ว", icon: "🍯" },
  { id: "w4", user: "pro***pro", rewardName: "1,000 GemCoins", category: "epic", time: "8 นาทีที่แล้ว", icon: "🍯" },
];

export default function HoneycombPage() {
  const { data: session } = useSession();
  const [userCoins, setUserCoins] = useState<number>(0);
  const [userHoneyCoins, setUserHoneyCoins] = useState<number>(0);
  const [selectedDraw, setSelectedDraw] = useState<number>(1);
  const [boxData, setBoxData] = useState<{
    id?: string;
    name: string;
    price: number;
    mainPrize: string;
    description: string;
    image: string;
    animation: string | null;
    rewards: HoneyReward[];
    eventStartDate?: Date | null;
    eventEndDate?: Date | null;
  }>({
    name: "สุ่มรังผึ้งมหาสมบัติ (Roulette 3D)",
    price: 50,
    mainPrize: "ROV Account Lv.50 Conqueror",
    description: "ระบบสุ่มรังผึ้งรูปแบบใหม่ โชว์ไอเทมทั้งหมด ลุ้นรับของรางวัลพรีเมียมง่ายๆ",
    image: "",
    animation: null,
    rewards: [],
    eventStartDate: null,
    eventEndDate: null,
  });
  const [howToPlayContent, setHowToPlayContent] = useState<string | null>(null);
  const [globalCoinIcon, setGlobalCoinIcon] = useState<string | null>(null);
  const [coinName, setCoinName] = useState("เหรียญรังผึ้ง");
  const [honeyCoinsExpiry, setHoneyCoinsExpiry] = useState<Date | null>(null);

  const now = new Date();
  const isHoneyCoinsExpired = honeyCoinsExpiry ? now >= honeyCoinsExpiry : false;
  const displayHoneyCoins = isHoneyCoinsExpired ? 0 : userHoneyCoins;
  const isEventNotStarted = boxData.eventStartDate ? now < boxData.eventStartDate : false;
  const isEventEnded = boxData.eventEndDate ? now >= boxData.eventEndDate : false;
  const isEventBlocked = isEventNotStarted || isEventEnded;

  useEffect(() => {
    Promise.all([
      fetch(`/api/honeycomb-boxes`, { cache: "no-store" }).then((res) => res.json()),
      fetch(`/api/public-settings`, { cache: "no-store" }).then((res) => res.json()),
    ])
      .then(([boxesData, settings]) => {
        const data = Array.isArray(boxesData) && boxesData.length > 0 ? boxesData[0] : null;
        if (data && !data.error) {
          let rewards: HoneyReward[] = [];
          if (Array.isArray(data.items) && data.items.length > 0) {
            rewards = data.items
              .filter((bi: any) => bi.itemId)
              .map((bi: any) => {
                const itm = bi.itemId;
                const isCoin = itm.type === "coin_reward";
                return {
                  id: itm._id,
                  name: isCoin ? `${itm.coinAmount || 0} เหรียญรังผึ้ง` : itm.name,
                  category: itm.category || "common",
                  type: isCoin ? "coin" : "item",
                  value: isCoin ? (itm.coinAmount || 0) : (itm.value || 0),
                  coinAmount: itm.coinAmount,
                  image: (isCoin && !itm.image && settings?.honeycomb_coin_icon) ? settings.honeycomb_coin_icon : (itm.image || "/product/pokemon.webp"),
                  badgeText: isCoin ? `${itm.coinAmount || 0} 🍯` : (itm.category?.toUpperCase() || "REWARD"),
                  description: itm.description || "",
                  rate: bi.rate || 0,
                  isLocked: bi.isLocked || false,
                } as HoneyReward;
              });
          }

          setBoxData({
            id: data._id,
            name: data.name || "สุ่มรังผึ้งมหาสมบัติ",
            price: data.price || 50,
            mainPrize: data.mainPrize || "",
            description: data.description || "",
            image: data.image || "",
            animation: settings?.honeycomb_bg_animation || null,
            rewards,
            eventStartDate: data.eventStartDate ? new Date(data.eventStartDate) : null,
            eventEndDate: data.eventEndDate ? new Date(data.eventEndDate) : null,
          });
          if (settings?.honeycomb_how_to_play) {
            setHowToPlayContent(settings.honeycomb_how_to_play);
          }
          if (settings?.honeycomb_coin_icon) {
            setGlobalCoinIcon(settings.honeycomb_coin_icon);
          }
          if (settings?.honeycomb_coin_name) {
            setCoinName(settings.honeycomb_coin_name);
          }
          if (settings?.honeycomb_coin_expiry_date) {
            const d = new Date(settings.honeycomb_coin_expiry_date);
            if (!isNaN(d.getTime())) setHoneyCoinsExpiry(d);
          }
        }
      })
      .catch(() => {});

    if (session?.user) {
      fetch("/api/user/balance")
        .then((res) => res.json())
        .then((data) => {
          if (!data.error) {
            setUserCoins(data.coins || 0);
            setUserHoneyCoins(data.honeyCoins || 0);
          }
        })
        .catch(() => {});

      // โหลดประวัติจาก DB
      setHistoryLoading(true);
      fetch("/api/user/honeycomb-history")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setMyHistory(data.map((h: any) => ({
              id: h._id,
              name: h.rewardName,
              category: h.rewardCategory || "common",
              type: h.rewardType,
              value: h.rewardValue || 0,
              coinAmount: h.coinAmount,
              image: h.rewardImage || "",
              badgeText: h.rewardBadgeText || "",
              description: "",
              createdAt: h.createdAt,
            })));
          }
        })
        .catch(() => {})
        .finally(() => setHistoryLoading(false));
    }
  }, [session]);

  const costPerCell = boxData.price || 50;
  const rewardsPool = boxData.rewards;

  // Board Generation Logic (Distributes items in a visual circular pattern)
  const generateBoard = useCallback((pool: HoneyReward[]) => {
    if (!pool || pool.length === 0) return [];
    
    // Sort pool by value descending to put best items in the center
    const sortedPool = [...pool].sort((a, b) => b.value - a.value);
    
    const newCells: HoneyCell[] = Array.from({ length: TOTAL_CELLS }, (_, i) => ({
      id: i,
      isOpened: false,
      isRevealing: false,
      reward: null,
      displayReward: null,
    }));

    // Index 9 is the absolute center cell
    newCells[9].displayReward = sortedPool[0];

    // Inner ring (6 cells)
    const innerRing = [5, 6, 8, 10, 12, 13];
    // Outer ring (12 cells)
    const outerRing = [0, 1, 2, 3, 4, 7, 11, 14, 15, 16, 17, 18];

    let poolIndex = 1;
    
    // Fill inner ring
    for(let i = 0; i < innerRing.length; i++) {
        if(poolIndex >= sortedPool.length) poolIndex = 0;
        newCells[innerRing[i]].displayReward = sortedPool[poolIndex];
        poolIndex++;
    }
    
    // Fill outer ring
    for(let i = 0; i < outerRing.length; i++) {
        if(poolIndex >= sortedPool.length) poolIndex = 0;
        newCells[outerRing[i]].displayReward = sortedPool[poolIndex];
        poolIndex++;
    }

    return newCells;
  }, []);

  const [cells, setCells] = useState<HoneyCell[]>(() => []);

  useEffect(() => {
    setCells(generateBoard(rewardsPool));
  }, [rewardsPool, generateBoard]);

  const [highlightedCellId, setHighlightedCellId] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [, setWinHistory] = useState<WinHistoryItem[]>(INITIAL_WIN_HISTORY);
  const [myHistory, setMyHistory] = useState<HoneyReward[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"hive" | "catalog" | "history">("hive");
  const [winModal, setWinModal] = useState<HoneyReward[] | null>(null);
  const [showHowTo, setShowHowTo] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isTopupOpen, setIsTopupOpen] = useState(false);

  const showToastMsg = (msg: string, ok: boolean = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // 3D Shuffle Spin Animation across the grid
  const runShuffleAnimation = (targetCellId: number, onFinish: () => void) => {
    setIsSpinning(true);

    // Suspenseful animation: medium start → slow → crawl → land
    const delays = [
      130, 140, 150, 160,      // medium opening (ไม่เร็วเกินไป)
      180, 210, 240, 280,      // slowing down
      330, 390, 460, 540,      // getting slower
      630, 730, 840, 960,      // crawling
      1100, 1280, 1500,        // near stop (MAXIMUM SUSPENSE!)
    ];
    let step = 0;

    const nextStep = () => {
      if (step >= delays.length) {
        // Final landing on target cell
        setHighlightedCellId(targetCellId);
        setTimeout(() => {
          setIsSpinning(false);
          setHighlightedCellId(null);
          onFinish();
        }, 1200); // Hold on winner cell for dramatic effect
        return;
      }

      // Pick random cell for visual highlight
      const randomCellId = Math.floor(Math.random() * TOTAL_CELLS);
      setHighlightedCellId(randomCellId);

      setTimeout(() => {
        step++;
        nextStep();
      }, delays[step]);
    };

    nextStep();
  };

  const refreshBalance = useCallback(async () => {
    try {
      const res = await fetch("/api/user/balance");
      const data = await res.json();
      if (!data.error) {
        setUserCoins(data.coins ?? 0);
        setUserHoneyCoins(data.honeyCoins ?? 0);
      }
    } catch {}
  }, []);

  const openSingleCell = async () => {
    if (isSpinning) return;
    if (isEventEnded) { showToastMsg("⚠️ อีเว้นนี้สิ้นสุดแล้ว", false); return; }
    if (isEventNotStarted) { showToastMsg("⚠️ อีเว้นยังไม่เริ่ม", false); return; }
    if (rewardsPool.length === 0) {
      showToastMsg("⚠️ รอบกิจกรรมนี้ยังไม่มีการเพิ่มไอเทมรางวัล", false);
      return;
    }

    if (userCoins < costPerCell) {
      showToastMsg(`⚠️ เครดิตของคุณไม่เพียงพอ (ต้องการ ฿${costPerCell})`, false);
      return;
    }

    setIsSpinning(true);
    try {
      if (!boxData.id) throw new Error("No active round found");
      const res = await fetch(`/api/honeycomb-boxes/${boxData.id}/play`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 1 })
      });
      const data = await res.json();
      if (!res.ok) {
        showToastMsg(data.error || "เกิดข้อผิดพลาดในการสุ่ม", false);
        setIsSpinning(false);
        return;
      }

      const newCoins = data.newBalance?.coins ?? userCoins;
      const newHoneyCoins = data.newBalance?.honeyCoins ?? userHoneyCoins;

      const reward = data.rewards[0];
      if (reward.type === "coin" && !reward.image && globalCoinIcon) {
        reward.image = globalCoinIcon;
      }
      if (!reward.image) {
        reward.image = "/product/pokemon.webp";
      }

      const matchingCells = cells.filter(c => c.displayReward?.id === reward.id);
      const visualTargetCellId = matchingCells.length > 0
        ? matchingCells[Math.floor(Math.random() * matchingCells.length)].id
        : Math.floor(Math.random() * TOTAL_CELLS);

      runShuffleAnimation(visualTargetCellId, () => {
        setUserCoins(newCoins);
        setUserHoneyCoins(newHoneyCoins);
        refreshBalance();
        setMyHistory((prev) => [reward, ...prev]);
        setWinModal([reward]);

        if (reward.category === "legendary" || reward.category === "epic") {
          setWinHistory((prev) => [
            {
              id: String(Date.now()),
              user: session?.user?.name ? `${session.user.name.slice(0, 3)}***` : "คุณ",
              rewardName: reward.name,
              category: reward.category,
              time: "เมื่อสักครู่",
              icon: reward.category === "legendary" ? "👑" : "🍯",
            },
            ...prev.slice(0, 9),
          ]);
        }
      });
    } catch (e) {
      showToastMsg("เกิดข้อผิดพลาดในการเชื่อมต่อ", false);
      setIsSpinning(false);
    }
  };

  const openBatchCells = async (count: number) => {
    if (isSpinning) return;
    if (isEventEnded) { showToastMsg("⚠️ อีเว้นนี้สิ้นสุดแล้ว", false); return; }
    if (isEventNotStarted) { showToastMsg("⚠️ อีเว้นยังไม่เริ่ม", false); return; }
    if (rewardsPool.length === 0) {
      showToastMsg("⚠️ รอบกิจกรรมนี้ยังไม่มีการเพิ่มไอเทมรางวัล", false);
      return;
    }
    
    const requiredCoins = count * costPerCell;

    if (userCoins < requiredCoins) {
      showToastMsg(`⚠️ เครดิตไม่พอ ต้องการ ฿${requiredCoins.toLocaleString()}`, false);
      return;
    }

    setIsSpinning(true);
    try {
      if (!boxData.id) throw new Error("No active round found");
      const res = await fetch(`/api/honeycomb-boxes/${boxData.id}/play`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count })
      });
      const data = await res.json();
      if (!res.ok) {
        showToastMsg(data.error || "เกิดข้อผิดพลาดในการสุ่ม", false);
        setIsSpinning(false);
        return;
      }

      const newCoins = data.newBalance?.coins ?? userCoins;
      const newHoneyCoins = data.newBalance?.honeyCoins ?? userHoneyCoins;

      const newRewards = data.rewards.map((r: any) => {
        if (r.type === "coin" && !r.image && globalCoinIcon) r.image = globalCoinIcon;
        if (!r.image) r.image = "/product/pokemon.webp";
        return r;
      });

      const bestReward = [...newRewards].sort((a: any, b: any) => b.value - a.value)[0];
      const matchingCells = cells.filter(c => c.displayReward?.id === bestReward.id);
      const visualTargetCellId = matchingCells.length > 0
        ? matchingCells[0].id
        : Math.floor(Math.random() * TOTAL_CELLS);

      runShuffleAnimation(visualTargetCellId, () => {
        setUserCoins(newCoins);
        setUserHoneyCoins(newHoneyCoins);
        refreshBalance();
        setMyHistory((prev) => [...newRewards, ...prev]);
        setWinModal(newRewards);
      });
    } catch (e) {
      showToastMsg("เกิดข้อผิดพลาดในการเชื่อมต่อ", false);
      setIsSpinning(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-6 pb-52 xl:pb-36 min-h-screen">
      {/* Navigation Top Bar */}
      <div className="flex items-end justify-end gap-3 mb-5">
        <div className="flex flex-col items-end gap-1.5">
          <button
            onClick={() => setShowHowTo(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <HelpCircle size={15} /> กฎและวิธีเล่น
          </button>
          {session?.user && (
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 shadow-sm">
              {globalCoinIcon ? (
                <img src={globalCoinIcon} className="w-4 h-4 object-contain" alt="honeycoin" />
              ) : (
                <span className="text-sm leading-none">🍯</span>
              )}
              <div>
                <p className="text-[9px] font-bold text-amber-700 leading-none mb-0.5">{coinName}</p>
                <p className={`text-xs font-black tabular-nums leading-none ${isHoneyCoinsExpired ? "text-slate-400 line-through" : "text-amber-800"}`}>
                  {(displayHoneyCoins ?? 0).toLocaleString()}
                </p>
              </div>
              {isHoneyCoinsExpired && (
                <span className="text-[9px] font-bold text-red-500 bg-red-50 border border-red-200 rounded-full px-1.5 py-0.5">หมดอายุ</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Event Status Banners — full-width, prominent */}
      {isEventEnded && (
        <div className="mb-6 rounded-2xl overflow-hidden shadow-lg">
          <div className="bg-gradient-to-r from-red-600 to-rose-500 px-5 py-4 flex items-center gap-4">
            <span className="text-4xl shrink-0">🔒</span>
            <div className="flex-1 min-w-0">
              <p className="font-black text-white text-base sm:text-lg leading-tight">อีเว้นนี้สิ้นสุดแล้ว</p>
              <p className="text-red-100 text-xs sm:text-sm font-semibold mt-0.5">
                ปิดรับเมื่อ {boxData.eventEndDate?.toLocaleDateString("th-TH", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} น.
              </p>
            </div>
            <div className="shrink-0 bg-white/20 rounded-xl px-3 py-2 text-center hidden sm:block">
              <p className="text-white font-black text-xs">สถานะ</p>
              <p className="text-white font-black text-sm">ปิดแล้ว</p>
            </div>
          </div>
        </div>
      )}
      {isEventNotStarted && (
        <div className="mb-6 rounded-2xl overflow-hidden shadow-lg">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-500 px-5 py-4 flex items-center gap-4">
            <span className="text-4xl shrink-0">⏳</span>
            <div className="flex-1 min-w-0">
              <p className="font-black text-white text-base sm:text-lg leading-tight">อีเว้นยังไม่เริ่ม</p>
              <p className="text-blue-100 text-xs sm:text-sm font-semibold mt-0.5">
                เปิดรับวันที่ {boxData.eventStartDate?.toLocaleDateString("th-TH", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} น.
              </p>
            </div>
            <div className="shrink-0 bg-white/20 rounded-xl px-3 py-2 text-center hidden sm:block">
              <p className="text-white font-black text-xs">สถานะ</p>
              <p className="text-white font-black text-sm">เร็วๆ นี้</p>
            </div>
          </div>
        </div>
      )}
      {isHoneyCoinsExpired && session?.user && (
        <div className="mb-6 rounded-2xl overflow-hidden shadow-md">
          <div className="bg-gradient-to-r from-amber-500 to-orange-400 px-5 py-3.5 flex items-center gap-3">
            <span className="text-3xl shrink-0">⚠️</span>
            <div>
              <p className="font-black text-white text-sm">{coinName}ของคุณหมดอายุแล้ว</p>
              <p className="text-amber-100 text-xs font-semibold mt-0.5">
                ยอดเหรียญถูกรีเซ็ตเป็น 0 — รอรอบอีเว้นถัดไป
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-6">
        <h2 className="font-extrabold text-slate-900 text-xl sm:text-2xl flex items-center gap-3 flex-wrap">
          <span>{boxData.name}</span>
          <span className="text-xs sm:text-sm font-black text-amber-900 bg-amber-400 px-3 py-1 rounded-full border border-amber-300 shadow-sm">
            ฿{costPerCell} / ครั้ง
          </span>
        </h2>
        <p className="text-sm text-slate-500 font-medium mt-1.5">
          {boxData.description}
        </p>
        {/* วันสิ้นสุดอีเว้น — แสดงขณะอีเว้นยังดำเนินอยู่ */}
        {boxData.eventEndDate && !isEventEnded && (
          <div className="inline-flex items-center gap-2 mt-2 bg-red-50 border border-red-200 rounded-xl px-3 py-1.5">
            <span className="text-sm">🕐</span>
            <p className="text-xs font-bold text-red-600">
              อีเว้นสิ้นสุด: {boxData.eventEndDate.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} น.
            </p>
          </div>
        )}
        {/* วันเหรียญหมดอายุ — แสดงขณะยังไม่หมดอายุ */}
        {honeyCoinsExpiry && !isHoneyCoinsExpired && session?.user && (
          <div className="inline-flex items-center gap-2 mt-2 ml-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
            <span className="text-sm">🍯</span>
            <p className="text-xs font-bold text-amber-600">
              {coinName}หมดอายุ: {honeyCoinsExpiry.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-xl mb-4 sm:mb-6 w-full sm:w-fit">
        {[
          { id: "hive", name: "วงล้อรังผึ้ง 3D", shortName: "วงล้อ 3D", icon: Hexagon },
          { id: "catalog", name: "รายการของรางวัล", shortName: "รางวัล", icon: Trophy },
          { id: "history", name: "ประวัติของฉัน", shortName: "ประวัติ", icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-1 sm:flex-none items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                active
                  ? "bg-red-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon size={14} />
              <span className="sm:hidden">{tab.shortName}</span>
              <span className="hidden sm:inline">{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: HONEYCOMB GRID */}
      {activeTab === "hive" && (
        <div className="flex flex-col lg:flex-row items-start gap-6">
          {/* Main Grid Container */}
          <div className="flex-1 w-full border border-slate-200/80 rounded-2xl sm:rounded-3xl p-3 sm:p-6 lg:p-8 pb-8 sm:pb-12 lg:pb-16 shadow-[0_8px_30px_rgba(0,0,0,0.08)] flex flex-col items-center justify-center relative overflow-hidden bg-slate-950">
            
            {/* Dynamic Background Media - full opacity, no overlay */}
            {boxData.animation ? (
              boxData.animation.match(/\.(mp4|webm|mov)$/i) ? (
                <video
                  src={boxData.animation}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover z-0"
                />
              ) : (
                <img
                  src={boxData.animation}
                  alt="background"
                  className="absolute inset-0 w-full h-full object-cover z-0"
                />
              )
            ) : boxData.image ? (
              <img
                src={boxData.image}
                alt="background"
                className="absolute inset-0 w-full h-full object-cover z-0"
              />
            ) : null}

            {/* 3D Honeycomb Grid Container */}
            <div className="relative w-full my-2 sm:my-6 flex flex-col items-center justify-center py-4 sm:py-10 select-none perspective-1000 min-h-[260px] sm:min-h-[400px] lg:min-h-[480px] z-10">
              {/* Event ended / not started overlay */}
              {isEventBlocked && cells.length > 0 && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm rounded-2xl">
                  <div className="text-center px-6">
                    <span className="text-5xl block mb-3">{isEventEnded ? "🔒" : "⏳"}</span>
                    <p className="font-black text-white text-lg mb-1">
                      {isEventEnded ? "อีเว้นสิ้นสุดแล้ว" : "อีเว้นยังไม่เริ่ม"}
                    </p>
                    <p className="text-slate-300 text-xs font-medium">
                      {isEventEnded
                        ? `สิ้นสุดเมื่อ ${boxData.eventEndDate?.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}`
                        : `เริ่มวันที่ ${boxData.eventStartDate?.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}`}
                    </p>
                  </div>
                </div>
              )}
              {cells.length === 0 ? (
                <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/60 rounded-2xl p-8 max-w-sm text-center shadow-2xl">
                  <Hexagon size={48} className="mx-auto mb-3 text-amber-400 opacity-60 animate-pulse" />
                  <h3 className="font-extrabold text-white text-base mb-1">รอบกิจกรรมนี้ยังไม่มีการเพิ่มไอเทมรางวัล</h3>
                  <p className="text-xs text-slate-400 font-medium">โปรดตั้งค่าไอเทมในระบบหลังบ้าน (Admin) ก่อนเริ่มสุ่ม</p>
                </div>
              ) : (
                <div className="relative z-10 flex flex-col items-center justify-center gap-0.5 sm:gap-2">
                  <div className="flex items-center justify-center gap-0.5 sm:gap-2">
                    {cells.slice(0, 3).map((cell) => (
                      <HexCell3D
                        key={cell.id}
                        cell={cell}
                        isHighlighted={highlightedCellId === cell.id}
                        isSpinning={isSpinning}
                        onClick={openSingleCell}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-center gap-0.5 sm:gap-2 -mt-[12px] sm:-mt-[22px]">
                    {cells.slice(3, 7).map((cell) => (
                      <HexCell3D
                        key={cell.id}
                        cell={cell}
                        isHighlighted={highlightedCellId === cell.id}
                        isSpinning={isSpinning}
                        onClick={openSingleCell}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-center gap-0.5 sm:gap-2 -mt-[12px] sm:-mt-[22px]">
                    {cells.slice(7, 12).map((cell) => (
                      <HexCell3D
                        key={cell.id}
                        cell={cell}
                        isHighlighted={highlightedCellId === cell.id}
                        isSpinning={isSpinning}
                        onClick={openSingleCell}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-center gap-0.5 sm:gap-2 -mt-[12px] sm:-mt-[22px]">
                    {cells.slice(12, 16).map((cell) => (
                      <HexCell3D
                        key={cell.id}
                        cell={cell}
                        isHighlighted={highlightedCellId === cell.id}
                        isSpinning={isSpinning}
                        onClick={openSingleCell}
                      />
                    ))}
                  </div>

                  <div className="flex items-center justify-center gap-0.5 sm:gap-2 -mt-[12px] sm:-mt-[22px]">
                    {cells.slice(16, 19).map((cell) => (
                      <HexCell3D
                        key={cell.id}
                        cell={cell}
                        isHighlighted={highlightedCellId === cell.id}
                        isSpinning={isSpinning}
                        onClick={openSingleCell}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: CATALOG */}
      {activeTab === "catalog" && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <h3 className="font-extrabold text-slate-900 text-lg mb-1 flex items-center gap-2">
            <Trophy size={18} className="text-amber-500" /> รายการของรางวัลทั้งหมด
          </h3>
          <p className="text-xs text-slate-500 font-medium mb-6">ของรางวัลที่มีโอกาสได้รับจากรอบกิจกรรมนี้</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewardsPool.map((r, i) => (
              <div key={r.id || i} className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-white border border-slate-200 shrink-0">
                  <img src={r.image || "/product/pokemon.webp"} alt={r.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded block w-fit mb-1">
                    {r.badgeText || r.category?.toUpperCase() || "REWARD"}
                  </span>
                  <h4 className="font-bold text-slate-900 text-xs truncate">{r.name}</h4>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{r.description || `มูลค่า ${r.value} เหรียญรังผึ้ง`}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: HISTORY */}
      {activeTab === "history" && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
          <h3 className="font-extrabold text-slate-900 text-lg mb-1 flex items-center gap-2">
            <History size={18} className="text-slate-600" /> ประวัติการสุ่มของคุณ
          </h3>
          <p className="text-xs text-slate-500 font-medium mb-6">100 รายการล่าสุด</p>

          {historyLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400 gap-2 text-xs font-bold">
              <Sparkles size={16} className="animate-pulse" /> กำลังโหลด...
            </div>
          ) : !session?.user ? (
            <div className="text-center py-12 text-slate-400 text-xs font-bold">
              เข้าสู่ระบบเพื่อดูประวัติของคุณ
            </div>
          ) : myHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs font-bold">
              ยังไม่มีประวัติการเปิดช่องรังผึ้ง
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {myHistory.map((r, idx) => {
                const catColor = r.category === "legendary" ? "text-amber-600 bg-amber-50 border-amber-200"
                  : r.category === "epic" ? "text-fuchsia-600 bg-fuchsia-50 border-fuchsia-200"
                  : r.category === "rare" ? "text-blue-600 bg-blue-50 border-blue-200"
                  : "text-slate-500 bg-slate-50 border-slate-200";
                return (
                  <div key={idx} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-white border border-slate-200 shrink-0 flex items-center justify-center">
                      {r.image
                        ? <img src={r.image} alt={r.name} className="w-full h-full object-contain p-0.5" />
                        : <span className="text-lg">{r.type === "coin" ? "🍯" : "📦"}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-xs truncate">{r.name}</p>
                      {(r as any).createdAt && (
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                          {new Date((r as any).createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                    <span className={`text-[9px] font-black px-2 py-1 rounded-lg border shrink-0 ${catColor}`}>
                      {r.badgeText || r.category?.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* WIN MODAL */}
      {winModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-xl text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-3 shadow-inner">
              <Trophy size={28} />
            </div>

            <h3 className="text-lg font-extrabold text-slate-900 mb-1">ยินดีด้วย! คุณได้รับ</h3>
            <p className="text-xs text-slate-500 mb-4">ของรางวัลถูกเพิ่มเข้าบัญชีเรียบร้อยแล้ว</p>

            <div className="space-y-2 mb-5 max-h-60 overflow-y-auto pr-1">
              {winModal.map((r, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-left flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-white shrink-0 border border-slate-200 p-1 shadow-xs">
                    <img src={r.image} alt={r.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-black text-red-600 block mb-0.5">{r.badgeText}</span>
                    <h4 className="font-bold text-slate-900 text-xs truncate leading-snug">{r.name}</h4>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setWinModal(null)}
              className="w-full py-3 bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white font-extrabold text-xs rounded-xl shadow-md shadow-red-600/30 transition-all active:scale-95 cursor-pointer"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}

      {/* HOW TO PLAY MODAL */}
      {showHowTo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">วิธีการเล่นเกมวงล้อรังผึ้ง</h3>
              <button onClick={() => setShowHowTo(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed font-medium mb-5 max-h-72 overflow-y-auto pr-1">
              {howToPlayContent ? (
                howToPlayContent.split("\n").filter(Boolean).map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))
              ) : (
                <>
                  <p>1. กดปุ่ม <b>สุ่มเปิด 1 ครั้ง</b> หรือ <b>สุ่มเปิดแบบชุด</b> โดยใช้ เหรียญรังผึ้ง ตามที่กำหนด</p>
                  <p>2. ระบบจะทำการหมุนวงล้อรังผึ้ง และหยุดที่ช่องของรางวัลที่คุณได้รับ</p>
                  <p>3. คุณสามารถสุ่มรับของรางวัลบนกระดานได้เรื่อยๆ ไม่มีจำกัดรอบ</p>
                  <p>4. ไอเทมที่เห็นบนกระดานเป็นเพียงตัวแทนภาพรางวัลทั้งหมดในระบบ มีโอกาสได้รับรางวัลเหล่านั้นจริงตามอัตราเรทที่กำหนด</p>
                </>
              )}
            </div>

            <button
              onClick={() => setShowHowTo(false)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
            >
              เข้าใจแล้ว
            </button>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-xl bg-slate-900/90 backdrop-blur-md text-white text-xs font-bold shadow-2xl flex items-center gap-2 border border-slate-700/50">
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm" onClick={() => setIsPaymentModalOpen(false)}>
          <div className="bg-[#F8F8F8] w-full max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 flex items-center justify-between bg-white border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-900">ยืนยันการชำระเงิน</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="p-1.5 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              {/* Balance card */}
              <div className="bg-gray-900 text-white rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden shadow-lg border border-gray-800">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <div className="flex items-center gap-2 mb-2 relative z-10">
                  <Wallet size={16} className="text-gray-400" />
                  <span className="text-sm font-bold text-gray-300">ยอดเงินคงเหลือ</span>
                </div>
                <div className="flex items-end justify-between mt-2 relative z-10">
                  <span className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
                    <span className="font-sans">฿</span> {userCoins.toLocaleString()}
                  </span>
                  <button onClick={() => { setIsPaymentModalOpen(false); setIsTopupOpen(true); }} className="bg-white text-gray-900 font-bold text-sm px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-1 shadow-sm cursor-pointer">
                    + เติมเงิน
                  </button>
                </div>
              </div>
              {/* Coupon */}
              <div className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="bg-red-50 text-red-600 p-2 rounded-xl"><Ticket size={20} /></div>
                  <span className="font-bold text-gray-800 text-sm">คูปอง</span>
                </div>
                <span className="text-sm font-bold text-gray-400">ไม่มีคูปอง ›</span>
              </div>
              <div className="flex items-start gap-2 px-2 mt-1">
                <ShieldCheck size={16} className="text-gray-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-gray-500 leading-relaxed font-semibold">
                  ระบบการสุ่มของเราใช้ Weighted Random Algorithm มาตรฐาน ยุติธรรม โปร่งใส 100%
                </p>
              </div>
            </div>
            <div className="bg-white p-5 border-t border-gray-100 flex flex-col gap-4">
              <div className="flex items-end gap-2 px-1">
                <span className="text-sm font-bold text-gray-500">
                  ทั้งหมด <span className="text-gray-900 text-lg mx-1">{selectedDraw}</span> ครั้ง
                </span>
                <span className="text-2xl font-black text-red-600 ml-auto flex items-center gap-1">
                  <span className="font-sans">฿</span> {(costPerCell * selectedDraw).toLocaleString()}
                </span>
              </div>
              {userCoins >= costPerCell * selectedDraw ? (
                <button
                  onClick={() => {
                    setIsPaymentModalOpen(false);
                    if (selectedDraw === 1) openSingleCell();
                    else openBatchCells(selectedDraw);
                  }}
                  disabled={isSpinning}
                  className="w-full bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 font-black py-4 rounded-xl text-sm transition-colors shadow-sm cursor-pointer"
                >
                  {isSpinning ? "กำลังดำเนินการ..." : "ยืนยันการชำระเงิน"}
                </button>
              ) : (
                <button onClick={() => { setIsPaymentModalOpen(false); setIsTopupOpen(true); }} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 font-black py-4 rounded-xl text-sm transition-colors cursor-pointer">
                  ยอดเงินไม่เพียงพอ (โปรดเติมเงิน)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <TopupModal isOpen={isTopupOpen} onClose={() => setIsTopupOpen(false)} />

      {/* Fixed Bottom Draw Bar */}
      <div className="fixed bottom-0 left-0 lg:left-[17rem] xl:left-[18rem] right-0 z-[60] bg-white border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.06)]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col xl:flex-row items-center gap-4 xl:gap-6">
          <div className="flex items-center gap-2 w-full xl:flex-[1.5]">
            {[
              { times: 1, isBest: false },
              { times: 3, isBest: false },
              { times: 5, isBest: false },
              { times: 10, isBest: true },
            ].map((opt) => (
              <button
                key={opt.times}
                onClick={() => setSelectedDraw(opt.times)}
                disabled={isSpinning}
                className={`flex-1 relative flex flex-col items-center justify-center py-2.5 rounded-xl border transition-all active:scale-95 ${
                  isSpinning ? "opacity-50 cursor-not-allowed" : ""
                } ${
                  selectedDraw === opt.times ? "bg-red-50/50 border-red-200 shadow-sm ring-1 ring-red-200" : "bg-white border-slate-200 hover:bg-slate-50"
                }`}
              >
                {opt.isBest && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-red-600 to-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full whitespace-nowrap shadow-sm flex items-center gap-0.5">
                    <Flame size={10} className="fill-white" /> BEST VALUE!
                  </div>
                )}
                <span className="font-black text-lg leading-none text-slate-900">x{opt.times}</span>
                <span className="text-[9px] font-bold text-slate-400 mb-1">DRAW</span>
                <span className="font-black text-sm flex items-center gap-1 text-red-600">
                  <span className="font-sans">฿</span> {(costPerCell * opt.times).toLocaleString()}
                </span>
              </button>
            ))}
          </div>
          <div className="flex flex-col items-center w-full xl:flex-1">
            <button
              onClick={() => {
                if (!isEventBlocked) setIsPaymentModalOpen(true);
              }}
              disabled={isSpinning || isEventBlocked}
              className={`w-full font-black text-xl lg:text-2xl py-3 lg:py-4 rounded-xl transition-all flex flex-col items-center justify-center group ${
                isEventBlocked
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-[0_6px_0_#94a3b8]"
                  : "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 disabled:from-slate-400 disabled:to-slate-300 text-white shadow-[0_6px_0_#991b1b,0_10px_20px_rgba(220,38,38,0.3)] active:shadow-[0_0px_0_#991b1b] active:translate-y-[6px]"
              }`}
            >
              <div className="flex items-center gap-2">
                {!isEventBlocked && <Flame size={24} className="fill-yellow-400 text-yellow-400 group-hover:scale-110 transition-transform" />}
                {isSpinning ? "กำลังสุ่ม..." : isEventEnded ? "🔒 อีเว้นสิ้นสุดแล้ว" : isEventNotStarted ? "⏳ ยังไม่เริ่ม" : "สุ่มเลย!"}
              </div>
              {!isEventBlocked && <span className="text-xs font-semibold text-red-100 mt-1 opacity-90 drop-shadow-sm">ลุ้นของหายากระดับตำนาน</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-component: 3D Hexagonal Cell (Visible Rewards) ───────────────────────
function HexCell3D({
  cell,
  isHighlighted,
  isSpinning,
  onClick,
}: {
  cell: HoneyCell;
  isHighlighted?: boolean;
  isSpinning?: boolean;
  onClick: () => void;
}) {
  const { displayReward } = cell;
  
  if (!displayReward) return null;

  // Neon glow colors per category
  let neonColor = "rgba(148,163,184,0.7)";
  let borderColor = "bg-slate-600";
  let innerGlow = "from-slate-500 via-slate-700 to-slate-900";
  let glowColor = "shadow-slate-500/60";
  let highlightNeon = "rgba(148,163,184,1)";
  
  if (displayReward.category === "legendary") {
    borderColor = "bg-amber-400";
    innerGlow = "from-amber-400 via-orange-500 to-red-700";
    glowColor = "shadow-amber-400/80";
    neonColor = "rgba(251,191,36,0.6)";
    highlightNeon = "rgba(251,191,36,1)";
  } else if (displayReward.category === "epic") {
    borderColor = "bg-fuchsia-400";
    innerGlow = "from-fuchsia-400 via-purple-600 to-indigo-900";
    glowColor = "shadow-fuchsia-400/80";
    neonColor = "rgba(232,121,249,0.6)";
    highlightNeon = "rgba(232,121,249,1)";
  } else if (displayReward.category === "rare") {
    borderColor = "bg-blue-400";
    innerGlow = "from-blue-400 via-blue-600 to-blue-900";
    glowColor = "shadow-blue-400/80";
    neonColor = "rgba(96,165,250,0.6)";
    highlightNeon = "rgba(96,165,250,1)";
  }

  return (
    <button
      onClick={onClick}
      className={`relative w-[3.2rem] h-[3.7rem] sm:w-[5rem] sm:h-[5.8rem] lg:w-[6rem] lg:h-[6.9rem] transition-all duration-200 transform active:scale-95 flex items-center justify-center cursor-pointer select-none group ${
        isHighlighted
          ? "scale-[1.22] z-30"
          : isSpinning
          ? "opacity-50 scale-95"
          : "hover:scale-110 hover:-translate-y-1 z-10"
      }`}
    >
      {/* Hex-shaped highlight glow (outer ring matching hexagon shape) */}
      {isHighlighted && (
        <div
          className="absolute -inset-[3px] sm:-inset-[4px] lg:-inset-[5px] z-[-1]"
          style={{
            clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            background: displayReward.category === "legendary"
              ? "linear-gradient(135deg, #fde68a, #fb923c, #ef4444)"
              : displayReward.category === "epic"
              ? "linear-gradient(135deg, #e879f9, #a855f7, #6366f1)"
              : displayReward.category === "rare"
              ? "linear-gradient(135deg, #60a5fa, #2563eb, #1e40af)"
              : "linear-gradient(135deg, #94a3b8, #64748b, #475569)",
            filter: "blur(4px)",
            transform: "scale(1.15)",
          }}
        />
      )}
      {/* Hex-shaped neon glow border - always on but stronger when highlighted */}
      <div
        className="absolute -inset-[1px] sm:-inset-[2px] lg:-inset-[3px] transition-all duration-300 z-[-1]"
        style={{
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          background: isHighlighted
            ? displayReward.category === "legendary" ? "linear-gradient(135deg, #fde68a, #fb923c, #ef4444)" 
              : displayReward.category === "epic" ? "linear-gradient(135deg, #e879f9, #a855f7, #6366f1)"
              : displayReward.category === "rare" ? "linear-gradient(135deg, #60a5fa, #2563eb, #1e40af)"
              : "linear-gradient(135deg, #94a3b8, #64748b, #475569)"
            : "transparent",
          boxShadow: isHighlighted
            ? `0 0 20px 6px ${highlightNeon}, 0 0 40px 12px ${highlightNeon}`
            : `0 0 10px 3px ${neonColor}`,
          filter: isHighlighted ? "blur(2px)" : "blur(1px)",
          transform: "scale(1.1)",
        }}
      />
      {/* 3D Base Border Shadow */}
      <div
        className={`absolute inset-0 ${borderColor} transition-all ${
          isHighlighted
            ? `shadow-[0_0_40px_10px_currentColor] ${glowColor}`
            : `shadow-lg ${glowColor}`
        }`}
        style={{
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          transform: isHighlighted ? "translateY(0px)" : "translateY(5px)",
        }}
      />

      {/* Inner Glowing Face containing the Item */}
      <div
        className={`absolute inset-[2px] sm:inset-[3px] lg:inset-[4px] transition-all duration-200 flex flex-col items-center justify-center bg-gradient-to-br ${innerGlow} ${
          isHighlighted
            ? "brightness-150"
            : isSpinning
            ? "brightness-75"
            : "brightness-100 group-hover:brightness-125"
        }`}
        style={{
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
        }}
      >
        {/* Glow overlay effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,_var(--tw-gradient-stops))] from-white/40 via-white/10 to-transparent pointer-events-none" />
        
        {/* Sparkle on highlight - hex shaped ping */}
        {isHighlighted && (
          <div
            className="absolute inset-0 animate-ping pointer-events-none opacity-40"
            style={{
              clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
              background: "white",
            }}
          />
        )}
        
        {/* Item Image */}
        <div className={`relative w-6 h-6 sm:w-10 sm:h-10 lg:w-12 lg:h-12 flex items-center justify-center mb-1 sm:mb-2 z-10 transition-transform duration-200 ${isHighlighted ? "scale-125" : "group-hover:scale-110"}`}>
           <img
             src={displayReward.image || "/product/pokemon.webp"}
             alt={displayReward.name}
             className="max-w-full max-h-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]"
           />
        </div>

        {/* Item Value / Name Badge at bottom */}
        <div className="absolute bottom-0.5 sm:bottom-2 lg:bottom-3 w-full text-center z-20 px-1">
           <span className="text-[6px] sm:text-[8px] lg:text-[9px] font-black text-white drop-shadow-[0_1px_3px_rgba(0,0,0,1)] leading-none block truncate">
             {displayReward.type === "coin" ? (displayReward.coinAmount ? `x${displayReward.coinAmount}` : `x${displayReward.value}`) : (displayReward.badgeText || "ITEM")}
           </span>
        </div>
      </div>
    </button>
  );
}
