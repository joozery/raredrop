'use client';

import { useEffect, useRef, useState } from 'react';
import { Sparkles, Clock, Gift, Package, X, BookOpen } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { MediaImage } from '@/components/ui/MediaImage';
import { LoginModal } from '@/components/auth/LoginModal';
import { useBalance } from '@/contexts/BalanceContext';

interface CardPrize { title: string; name: string; icon?: string; weight?: number; type?: string; amount?: number }
interface RoundCard { opened: boolean; openedBy?: string; openedByName?: string; prize?: CardPrize }
interface RoundPrize { title: string; name: string; icon?: string; type?: string; amount?: number; isSpecial?: boolean; taken: boolean }
interface RoundData { _id: string | null; roundNumber: number; status: 'active' | 'completed' | 'none'; completedReason?: 'all_opened' | 'special'; cards: RoundCard[]; prizes?: RoundPrize[] }
interface HistoryEntry {
  roundNumber: number;
  cardIndex: number;
  openedBy?: string;
  openedByName: string;
  openedAt: string | null;
  prize: { title: string; name: string; icon?: string };
}

const CHARGE_MS = 2600; // ช่วงลุ้นก่อนพลิกการ์ด — การ์ดสั่น + เสียงรัวกลอง

export default function CardsPage() {
  const { data: session, update: updateSession } = useSession();
  const { refreshBalance } = useBalance();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  // ซีเควนซ์เปิดการ์ด: idle → charging (สั่น+ชาร์จไฟ) → flipped (พลิกเผยรางวัล) → idle
  const [phase, setPhase] = useState<'idle' | 'charging' | 'flipped'>('idle');
  const [prize, setPrize] = useState<CardPrize | null>(null);
  // รอบปัจจุบันจาก server — แชร์กันทุก user ใครเปิดใบไหนแล้วทุกคนเห็นเหมือนกัน
  const [round, setRound] = useState<RoundData | null>(null);
  // ใบที่เลือกไว้ว่าจะเปิดใบถัดไป
  const [selected, setSelected] = useState(0);
  // รางวัล + ค่าเปิดต่อครั้ง ตั้งค่าได้จากหลังบ้าน (/admin/cards)
  const [pool, setPool] = useState<CardPrize[]>([]);
  const [openCost, setOpenCost] = useState(50);
  // จำนวนการ์ดต่อรอบตั้งได้จากหลังบ้าน — ใช้เป็น fallback ตอนยังไม่มีรอบ (รอบจริงใช้ cards.length)
  const [cardsPerRound, setCardsPerRound] = useState(10);
  const [backImage, setBackImage] = useState('');
  const [pageBg, setPageBg] = useState('');
  // ข้อความตอนเปิดครบรอบ — แก้ได้จากหลังบ้าน (/admin/cards)
  const [completedTitle, setCompletedTitle] = useState('🎉 การ์ดทั้งหมดถูกเปิดออกหมดแล้ว');
  const [completedSubtitle, setCompletedSubtitle] = useState('รอแอดมินเปิดรอบใหม่ แล้วกลับมาลุ้นกันอีกครั้ง!');
  // ข้อความตอนรอบจบเพราะรางวัลพิเศษออก — แก้ได้จากหลังบ้านเช่นกัน
  const [specialTitle, setSpecialTitle] = useState('⭐ รางวัลพิเศษถูกเปิดแล้ว — รอบนี้จบทันที!');
  const [specialSubtitle, setSpecialSubtitle] = useState('รอแอดมินเปิดรอบใหม่ แล้วกลับมาลุ้นกันอีกครั้ง!');
  const [toast, setToast] = useState<string | null>(null);
  // รอทั้ง config (รูปการ์ด/รางวัล) และรอบจาก server ให้ครบก่อนค่อยโชว์การ์ดจริง
  // — กันดีไซน์ default (โลโก้ X) แวบขึ้นมาก่อนรูปจริงโหลดเสร็จ
  const [configLoaded, setConfigLoaded] = useState(false);
  const [roundLoaded, setRoundLoaded] = useState(false);
  const ready = configLoaded && roundLoaded;
  // popup ประวัติการสุ่ม — ใครเปิดใบไหนได้อะไรไป
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[] | null>(null);
  // popup รางวัลประจำรอบ — เด้งอัตโนมัติครั้งแรกที่เจอรอบใหม่ (จำด้วย localStorage)
  const [prizesOpen, setPrizesOpen] = useState(false);
  // popup วิธีการเล่น — เนื้อหาแก้ได้จากหลังบ้าน
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const [howToPlay, setHowToPlay] = useState('');

  const totalCards = round?.cards?.length || cardsPerRound;
  const cards: RoundCard[] = round?.cards?.length ? round.cards : Array.from({ length: totalCards }, () => ({ opened: false }));
  const openedCards = cards.filter((c) => c.opened).length;
  // รอบใหม่ไม่เปิดอัตโนมัติ — แอดมินกดเปิด event จากหลังบ้าน ระหว่างนั้นหน้าเว็บล็อกการเปิด
  const roundActive = round?.status === 'active';
  const roundCompleted = round?.status === 'completed' || (roundActive && openedCards >= totalCards);
  const myId = (session?.user as any)?.id;
  const audioCtxRef = useRef<AudioContext | null>(null);

  // แถวการ์ดซ่อน scrollbar ไว้ — เพิ่มลากเลื่อนด้วยเมาส์เอง (จอ touch ใช้ปัดแบบ native ตามปกติ)
  const stripRef = useRef<HTMLDivElement>(null);
  const stripDrag = useRef({ down: false, moved: false, startX: 0, startScroll: 0 });
  const onStripPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    const el = stripRef.current;
    if (!el) return;
    stripDrag.current = { down: true, moved: false, startX: e.clientX, startScroll: el.scrollLeft };
  };
  const onStripPointerMove = (e: React.PointerEvent) => {
    const d = stripDrag.current;
    const el = stripRef.current;
    if (!d.down || !el) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 5) d.moved = true;
    el.scrollLeft = d.startScroll - dx;
  };
  const endStripDrag = () => {
    stripDrag.current.down = false;
  };
  // ลากแล้วปล่อย = ไม่ใช่การกดเลือกการ์ด — กัน click ที่หลุดมาหลังลาก
  const onStripClickCapture = (e: React.MouseEvent) => {
    if (stripDrag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      stripDrag.current.moved = false;
    }
  };

  const openHistory = async () => {
    setHistoryOpen(true);
    setHistory(null); // โชว์ loading ทุกครั้งที่เปิด — ข้อมูลสดเสมอ
    try {
      const r = await fetch('/api/cards/history', { cache: 'no-store' });
      const d = await r.json();
      setHistory(Array.isArray(d?.entries) ? d.entries : []);
    } catch {
      setHistory([]);
    }
  };

  const fetchRound = async () => {
    try {
      const r = await fetch('/api/cards/round', { cache: 'no-store' });
      const d = await r.json();
      if (Array.isArray(d?.cards)) {
        setRound(d);
        // ใบที่เลือกไว้ถูกคนอื่นเปิดชิงไปแล้ว — เลื่อนไปใบว่างใบแรกให้
        setSelected((s) => (d.cards[s] && !d.cards[s].opened ? s : d.cards.findIndex((c: RoundCard) => !c.opened)));
      }
    } catch { /* ลองใหม่รอบ poll ถัดไป */ }
  };

  useEffect(() => { fetchRound().finally(() => setRoundLoaded(true)); }, []);

  // เด้งรายการรางวัลทุกครั้งที่เข้าหน้านี้ (ตอนรอบยังเปิดเล่นอยู่) — เด้งครั้งเดียวต่อการเข้า ไม่เด้งซ้ำตอน poll
  const prizesShownRef = useRef(false);
  useEffect(() => {
    if (prizesShownRef.current) return;
    if (!round || round.status !== 'active' || !round.prizes?.length) return;
    prizesShownRef.current = true;
    setPrizesOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round?.roundNumber, round?.status]);

  // poll ทุก 10 วิ ตอนว่าง — เห็นการ์ดที่คนอื่นเพิ่งเปิดโดยไม่ต้องรีเฟรช
  useEffect(() => {
    if (phase !== 'idle') return;
    const t = setInterval(fetchRound, 10000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    return () => {
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
    };
  }, []);

  // ขอ AudioContext ตัวเดียวใช้ร่วมกันทุกเสียงของหน้านี้
  const getAudioCtx = (): AudioContext | null => {
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return null;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume().catch(() => {});
      return ctx;
    } catch {
      return null;
    }
  };

  // เสียง "ป๊อป" นุ่ม ๆ ตอนแตะเลือกการ์ด — sine โทนไหลลงต่ำเร็ว ๆ เหมือนแตะปุ่มในแอปมือถือ
  const playSelectTick = () => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(620, t);
    osc.frequency.exponentialRampToValueAtTime(240, t + 0.09);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.22, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  };

  // เสียงลุ้นตอนชาร์จเปิดการ์ด — ติ๊กรัวถี่ขึ้นเรื่อย ๆ พร้อมโทนไต่สูง (รัวกลองก่อนเฉลย)
  const playChargeSound = (durationMs: number) => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const dur = durationMs / 1000;

    // ติ๊กถี่ขึ้นเรื่อย ๆ — ease กำลังสองให้ช่วงท้ายรัวหนัก (จำนวนติ๊กแปรตามความยาวช่วงลุ้น)
    const TICKS = Math.round(durationMs / 70);
    for (let i = 0; i < TICKS; i++) {
      const at = t0 + Math.pow(i / TICKS, 1.6) * dur;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = 500 + (i / TICKS) * 500;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.09, at + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.045);
      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + 0.05);
    }

    // riser เบา ๆ ใต้เสียงติ๊ก — sine ไต่จากต่ำขึ้นสูงตลอดช่วงชาร์จ
    const riser = ctx.createOscillator();
    const riserGain = ctx.createGain();
    riser.type = 'sine';
    riser.frequency.setValueAtTime(120, t0);
    riser.frequency.exponentialRampToValueAtTime(520, t0 + dur);
    riserGain.gain.setValueAtTime(0.0001, t0);
    riserGain.gain.exponentialRampToValueAtTime(0.06, t0 + dur * 0.5);
    riserGain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    riser.connect(riserGain).connect(ctx.destination);
    riser.start(t0);
    riser.stop(t0 + dur + 0.02);
  };

  // เสียง "ติ๊ง" สองโน้ตตอนการ์ดพลิกเผยรางวัล
  const playRevealChime = () => {
    const ctx = getAudioCtx();
    if (!ctx) return;
    [880, 1318.5].forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.2, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.55);
    });
  };

  const selectCard = (i: number) => {
    if (phase !== 'idle' || !roundActive || cards[i]?.opened || i === selected) return;
    setSelected(i);
    playSelectTick();
  };

  const cardRef = useRef<HTMLDivElement>(null);
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || phase !== 'idle') return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;
    cardRef.current.style.setProperty('--rx', `${rotateX}deg`);
    cardRef.current.style.setProperty('--ry', `${rotateY}deg`);
    cardRef.current.style.setProperty('--x', `${(x / rect.width) * 100}%`);
    cardRef.current.style.setProperty('--y', `${(y / rect.height) * 100}%`);
  };
  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.setProperty('--rx', '0deg');
    cardRef.current.style.setProperty('--ry', '0deg');
    cardRef.current.style.setProperty('--x', '50%');
    cardRef.current.style.setProperty('--y', '50%');
  };

  useEffect(() => {
    fetch('/api/cards/config')
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.prizes)) setPool(d.prizes);
        if (d.cost) setOpenCost(d.cost);
        if (d.backImage) setBackImage(d.backImage);
        if (d.pageBg) setPageBg(d.pageBg);
        if (d.cardsPerRound) setCardsPerRound(d.cardsPerRound);
        if (d.completedTitle) setCompletedTitle(d.completedTitle);
        if (d.completedSubtitle) setCompletedSubtitle(d.completedSubtitle);
        if (d.specialCompletedTitle) setSpecialTitle(d.specialCompletedTitle);
        if (d.specialCompletedSubtitle) setSpecialSubtitle(d.specialCompletedSubtitle);
        if (d.howToPlay) setHowToPlay(d.howToPlay);
      })
      .catch(() => {})
      .finally(() => setConfigLoaded(true));
  }, []);

  // เปิดการ์ด — สุ่ม/ตัดเงิน/แจกของเกิดฝั่ง server ทั้งหมด client เล่นอนิเมชันตามผลที่ได้
  const openCard = async () => {
    if (phase !== 'idle' || pool.length === 0 || !roundActive || roundCompleted) return;
    if (!session) { setIsLoginOpen(true); return; }
    if (selected < 0 || selected >= totalCards || cards[selected]?.opened) return;

    setPhase('charging');
    playChargeSound(CHARGE_MS);
    const startedAt = Date.now();

    try {
      const res = await fetch('/api/cards/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่');

      // รอให้ช่วงลุ้นเล่นครบก่อนค่อยพลิกเฉลย
      const wait = Math.max(0, CHARGE_MS - (Date.now() - startedAt));
      setTimeout(() => {
        setPrize(data.prize);
        setPhase('flipped');
        playRevealChime();
        refreshBalance();
        updateSession().catch(() => {});
        setTimeout(() => {
          setRound(data.round);
          setSelected(data.round.cards.findIndex((c: RoundCard) => !c.opened));
          setPhase('idle');
          setPrize(null);
        }, 2200);
      }, wait);
    } catch (e: any) {
      setPhase('idle');
      setToast(e.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
      setTimeout(() => setToast(null), 3500);
      fetchRound(); // sync สถานะล่าสุด เช่น ใบที่เพิ่งโดนคนอื่นชิงเปิด
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] font-sans relative">
      {/* พื้นหลังหน้า — รูป/วิดีโอ ตั้งได้จากหลังบ้าน */}
      {pageBg && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <MediaImage src={pageBg} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="flex-1 pb-44 lg:pb-36 relative">
        {/* Header & Main Card Section (has background glow) */}
        <div className="relative overflow-hidden pt-8 pb-12">
          {/* Background Glow removed as per request */}
          
          <div className="w-[96%] md:w-[95%] lg:w-[94%] xl:w-[92%] 2xl:w-[90%] mx-auto relative z-10">
            {/* Top Header */}
            <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-6 md:gap-0">
              {/* Left: spacer ให้หัวข้อกลางยังอยู่กึ่งกลางเหมือนเดิม */}
              <div className="hidden md:block w-56" />

              {/* Center: Title */}
              <div className="text-center order-first md:order-none">
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 flex items-center gap-2 justify-center drop-shadow-sm">
                  <Sparkles className="text-red-500 fill-red-500" size={24} />
                  สุ่มการ์ด<span className="text-red-600">พิเศษ</span>
                  <Sparkles className="text-red-500 fill-red-500" size={24} />
                </h1>
                <p className="text-sm text-gray-500 mt-2 font-bold tracking-wide">เปิดการ์ดสุ่มรางวัลสุดพิเศษ!</p>
              </div>

              {/* Right: Buttons */}
              <div className="flex flex-row md:flex-col gap-2 md:w-56 justify-end">
                <button
                  onClick={() => setPrizesOpen(true)}
                  className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold bg-white/80 backdrop-blur-md border border-gray-200 shadow-sm px-4 py-2.5 rounded-full text-gray-700 hover:bg-white transition-colors"
                >
                  <Gift size={16} className="text-red-400" /> รางวัลรอบนี้
                </button>
                <button
                  onClick={openHistory}
                  className="flex items-center justify-center md:justify-start gap-2 text-xs font-bold bg-white/80 backdrop-blur-md border border-gray-200 shadow-sm px-4 py-2.5 rounded-full text-gray-700 hover:bg-white transition-colors"
                >
                  <Clock size={16} className="text-gray-400" /> ประวัติการสุ่ม
                </button>
                <button
                  onClick={() => setHowToPlayOpen(true)}
                  title="วิธีการเล่น"
                  className="flex items-center justify-center gap-1.5 text-xs font-black bg-white/80 backdrop-blur-md border border-gray-200 shadow-sm px-3 py-2.5 rounded-full text-gray-600 hover:bg-white hover:text-blue-600 hover:border-blue-200 transition-colors"
                >
                  <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] font-black flex items-center justify-center shrink-0">?</span>
                  <span className="text-xs">วิธีการเล่น</span>
                </button>
              </div>
            </div>

            {/* Main Card — โชว์ skeleton จนกว่าข้อมูลรอบ + รูปการ์ดจากหลังบ้านจะโหลดครบ */}
            <div className="mt-8 flex flex-col items-center justify-center relative">
              {!ready ? (
                <div className="w-64 h-[380px] rounded-3xl bg-gray-200/60 animate-pulse" />
              ) : (
              <div
                ref={cardRef}
                className={`relative group cursor-pointer ${phase === 'charging' ? 'animate-[cardshake_.35s_ease-in-out_infinite]' : ''}`}
                onClick={openCard}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{ perspective: 1200 }}
              >
                {/* Card Glow Background removed as per request */}

                {/* Flip container */}
                <div
                  className="relative w-64 h-[380px] ease-out"
                  style={{ 
                    transitionDuration: phase === 'idle' ? '0.1s' : '0.7s',
                    transformStyle: 'preserve-3d', 
                    transform: phase === 'flipped' ? 'rotateY(180deg)' : 'rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))' 
                  }}
                >
                  {/* ── หน้าการ์ด (คว่ำ) — ตั้งภาพเองได้จากหลังบ้าน ── */}
                  <div className="absolute inset-0 [backface-visibility:hidden] bg-white rounded-3xl border-[6px] border-red-500 shadow-2xl flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-[1.02] group-active:scale-95">
                    {/* Shine / Swipe Glare effect */}
                    <div className="absolute inset-0 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                         style={{
                           background: `radial-gradient(circle at var(--x, 50%) var(--y, 50%), rgba(255,255,255,0.7) 0%, transparent 60%)`,
                           mixBlendMode: 'overlay',
                         }}
                    />
                    <div className="absolute inset-0 z-20 pointer-events-none rounded-2xl overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute inset-[-150%] bg-gradient-to-tr from-transparent via-white to-transparent opacity-30 mix-blend-overlay"
                           style={{
                             transform: `translate(calc(var(--x, 50%) * 1.5 - 75%), calc(var(--y, 50%) * 1.5 - 75%))`,
                             transition: phase === 'idle' ? 'transform 0.1s ease-out' : 'none'
                           }}
                      />
                    </div>

                    {backImage ? (
                      <img src={backImage} alt="card" className={`absolute inset-0 w-full h-full object-cover ${phase === 'charging' ? 'animate-pulse' : ''}`} />
                    ) : (
                      <>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
                        <div className="absolute inset-2 border-2 border-red-100 rounded-2xl pointer-events-none" />
                        <div className={`w-24 h-24 bg-red-500 rounded-xl rotate-45 flex items-center justify-center shadow-lg shadow-red-500/50 relative z-10 border-4 border-white ${phase === 'charging' ? 'animate-pulse' : ''}`}>
                          <span className="text-5xl font-black text-white -rotate-45 block drop-shadow-md">X</span>
                        </div>
                        <div className="absolute top-3 left-3 w-6 h-6 border-t-4 border-l-4 border-red-500 rounded-tl-xl opacity-60" />
                        <div className="absolute top-3 right-3 w-6 h-6 border-t-4 border-r-4 border-red-500 rounded-tr-xl opacity-60" />
                        <div className="absolute bottom-3 left-3 w-6 h-6 border-b-4 border-l-4 border-red-500 rounded-bl-xl opacity-60" />
                        <div className="absolute bottom-3 right-3 w-6 h-6 border-b-4 border-r-4 border-red-500 rounded-br-xl opacity-60" />
                      </>
                    )}
                  </div>

                  {/* ── หลังการ์ด (รางวัล) ── */}
                  <div
                    className="absolute inset-0 [backface-visibility:hidden] bg-gradient-to-b from-red-500 to-red-700 rounded-3xl border-[6px] border-white shadow-2xl flex flex-col items-center justify-center overflow-hidden"
                    style={{ transform: 'rotateY(180deg)' }}
                  >
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                    <div className="absolute inset-2 border-2 border-white/30 rounded-2xl pointer-events-none" />
                    {prize && (
                      <div className="flex flex-col items-center animate-[prizepop_.55s_cubic-bezier(.34,1.56,.64,1)_both] relative z-10 px-4">
                        <span className="text-[11px] font-black tracking-[0.3em] text-white/80 uppercase mb-3">You got</span>
                        <div className="w-32 h-32 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                          <img src={prize.icon} alt={prize.title} className="w-24 h-24 object-contain drop-shadow-[0_6px_12px_rgba(0,0,0,0.35)]" />
                        </div>
                        <span className="text-sm font-black text-white/90 tracking-widest">{prize.title}</span>
                        <span className="text-3xl font-black text-white drop-shadow-md mt-1">{prize.name}</span>
                        <div className="mt-4 flex items-center gap-1.5 text-[11px] font-black text-red-600 bg-white px-4 py-1.5 rounded-full shadow-md">
                          <Sparkles size={12} /> ยินดีด้วย!
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pointer Hand (Animated) — ซ่อนตอนกำลังเปิด */}
                {phase === 'idle' && (
                  <div className="absolute -bottom-6 -right-6 animate-bounce">
                    <img
                      src="/cards/click-hand.png"
                      alt="แตะเพื่อเปิด"
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  </div>
                )}
              </div>
              )}

            </div>
          </div>
        </div>

        {/* The 10 Cards Pool (Current Round) */}
        <div className="w-[96%] md:w-[94%] lg:w-[92%] xl:w-[90%] 2xl:w-[88%] mx-auto mt-4 relative z-20">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 md:p-8">
            <h3 className="text-sm font-black text-gray-800 mb-1 flex items-center gap-2">
              <Package size={18} className="text-gray-400" /> เลือกการ์ดที่จะเปิด
            </h3>
            <p className="text-xs text-gray-400 font-medium mb-6">แตะการ์ดใบที่อยากเปิด แล้วกดปุ่ม &quot;เปิดการ์ด&quot; ด้านล่าง</p>

            {/* รอบจบ/ยังไม่เริ่ม — บอกสถานะชัด ๆ เหนือแถวการ์ด */}
            {ready && roundCompleted && (
              round?.completedReason === 'special' ? (
                <div className="mb-6 bg-amber-50 border border-amber-300 text-amber-600 rounded-2xl px-5 py-4 text-center">
                  <p className="text-sm font-black">{specialTitle}</p>
                  <p className="text-xs font-bold text-amber-500 mt-1">{specialSubtitle}</p>
                </div>
              ) : (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-600 rounded-2xl px-5 py-4 text-center">
                  <p className="text-sm font-black">{completedTitle}</p>
                  <p className="text-xs font-bold text-red-400 mt-1">{completedSubtitle}</p>
                </div>
              )
            )}
            {ready && round && !roundActive && !roundCompleted && (
              <div className="mb-6 bg-gray-50 border border-gray-200 text-gray-500 rounded-2xl px-5 py-4 text-center">
                <p className="text-sm font-black">ยังไม่เปิดรอบ</p>
                <p className="text-xs font-bold text-gray-400 mt-1">รอแอดมินเปิดรอบก่อนนะ แล้วกลับมาลุ้นกัน!</p>
              </div>
            )}
            
            <div
              ref={stripRef}
              onPointerDown={onStripPointerDown}
              onPointerMove={onStripPointerMove}
              onPointerUp={endStripDrag}
              onPointerLeave={endStripDrag}
              onClickCapture={onStripClickCapture}
              className="w-full overflow-x-auto pb-4 hide-scrollbar select-none cursor-grab active:cursor-grabbing [touch-action:pan-x_pan-y] [&_img]:pointer-events-none"
            >
              <div className="flex items-center gap-3 relative w-max mx-auto">
                {/* ยังโหลดไม่เสร็จ — skeleton 10 ใบ กัน mockup ดีไซน์ default แวบขึ้นมา */}
                {!ready && Array.from({ length: totalCards }).map((_, i) => (
                  <div key={`sk${i}`} className="w-[112px] shrink-0">
                    <div className="w-full aspect-[2/3] rounded-2xl bg-gray-100 animate-pulse" />
                  </div>
                ))}
                {/* การ์ด 10 ใบของรอบนี้ (แชร์กันทุกคน) — แตะใบคว่ำเพื่อเลือก แล้วกดเปิดจากแถบล่าง */}
                {ready && Array.from({ length: totalCards }).map((_, i) => {
                  const card = cards[i];
                  const wonPrize = card?.opened ? card.prize : null;
                  const isActive = i === selected && !card?.opened;

                  if (wonPrize) {
                    // การ์ดหงาย — ดีไซน์เดียวกับหลังการ์ดตอนเปิดรางวัล (ย่อส่วน สัดส่วน 2:3 เท่าการ์ดใหญ่)
                    return (
                      <div key={i} className="flex flex-col items-center gap-2 w-[112px] shrink-0">
                        <div className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden border-[3px] border-white bg-gradient-to-b from-red-500 to-red-700 shadow-sm flex flex-col items-center justify-center gap-1.5 p-2 animate-[prizepop_.4s_ease-out_both]">
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                          <div className="absolute inset-1.5 border border-white/30 rounded-xl pointer-events-none" />
                          <span className="text-[8px] font-black tracking-[0.2em] text-white/80 uppercase z-10">{wonPrize.title}</span>
                          <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
                            {wonPrize.icon ? (
                              <img src={wonPrize.icon} alt={wonPrize.title} className="w-11 h-11 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
                            ) : (
                              <Gift size={26} className="text-white" />
                            )}
                          </div>
                          <span className="text-[12px] font-black text-white drop-shadow-sm z-10 text-center leading-tight">{wonPrize.name}</span>
                        </div>
                        <span className={`text-[10px] font-black max-w-[112px] truncate ${card?.openedBy === myId ? 'text-red-500' : 'text-gray-400'}`}>
                          {card?.openedBy === myId ? 'คุณเปิด' : card?.openedByName || `ใบที่ ${i + 1}`}
                        </span>
                      </div>
                    );
                  }
                  // การ์ดคว่ำ — แตะเพื่อเลือกใบที่จะเปิด
                  return (
                    <div key={i} className="flex flex-col items-center gap-2 w-[112px] shrink-0">
                      <div
                        onClick={() => selectCard(i)}
                        className={`relative w-full aspect-[2/3] bg-white rounded-2xl border-[3px] flex items-center justify-center overflow-hidden transition-all cursor-pointer ${
                          isActive ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.35)] scale-105' : 'border-red-200 hover:border-red-400 hover:-translate-y-0.5'
                        }`}
                      >
                        {backImage ? (
                          <img src={backImage} alt="card" className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <>
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
                            <div className="absolute inset-1.5 border border-red-100 rounded-xl pointer-events-none" />
                            <div className="w-10 h-10 bg-red-500 rounded-lg rotate-45 flex items-center justify-center border-2 border-white shadow-md shadow-red-500/40">
                              <span className="text-lg font-black text-white -rotate-45">X</span>
                            </div>
                            <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-red-500 rounded-tl-md opacity-60" />
                            <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-red-500 rounded-tr-md opacity-60" />
                            <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 border-red-500 rounded-bl-md opacity-60" />
                            <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 border-red-500 rounded-br-md opacity-60" />
                          </>
                        )}
                        {isActive && (
                          <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-b-[10px] border-l-transparent border-r-transparent border-b-red-500" />
                        )}
                      </div>
                      <span className={`text-xs font-black ${isActive ? 'text-red-500' : 'text-gray-300'}`}>{i + 1}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Fixed Bottom Open Bar — แถบลอยแบบเดียวกับแถบสุ่มของหน้ากล่อง */}
      {/* มือถือมี BottomNav (h-16) ตรึงล่างอยู่แล้ว — ยกแถบนี้ขึ้นไปลอยเหนือมัน */}
      <div className="fixed bottom-16 lg:bottom-0 left-0 lg:left-[17rem] xl:left-[18rem] right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.06)]">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center gap-3 sm:gap-5">
          <div className="hidden sm:flex flex-col shrink-0">
            <span className="text-[10px] font-bold text-gray-400">รอบ #{round?.roundNumber || '-'} เปิดแล้ว</span>
            <span className="text-sm font-black text-gray-800">{openedCards} / {totalCards} ใบ</span>
          </div>

          <button
            onClick={openCard}
            disabled={!ready || !roundActive || roundCompleted || phase !== 'idle' || pool.length === 0 || selected < 0}
            className="flex-1 bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 disabled:from-gray-300 disabled:to-gray-400 text-white py-3 rounded-2xl shadow-[0_5px_0_#991b1b] disabled:shadow-[0_5px_0_#9ca3af] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center gap-3"
          >
            <span className="text-base font-black">
              {!ready ? 'กำลังโหลด...' : roundCompleted ? (round?.completedReason === 'special' ? specialTitle : `${completedTitle} — รอรอบใหม่`) : !roundActive ? 'รอแอดมินเปิดรอบ' : pool.length === 0 ? 'ยังไม่มีรางวัลให้เปิด' : phase !== 'idle' ? 'กำลังเปิด...' : `เปิดการ์ดใบที่ ${selected + 1}`}
            </span>
            {roundActive && !roundCompleted && pool.length > 0 && selected >= 0 && (
              <span className="text-lg font-black">฿{openCost.toLocaleString()}</span>
            )}
          </button>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-40 lg:bottom-24 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl shadow-xl font-bold text-sm text-white bg-red-600 whitespace-nowrap">
          ✕ {toast}
        </div>
      )}

      {/* popup รางวัลประจำรอบ — ให้ผู้เล่นเห็นว่ารอบนี้มีอะไรให้ลุ้น (ไม่บอกว่าอยู่ใบไหน) */}
      {prizesOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setPrizesOpen(false)}>
          {/* Main Sci-Fi Container */}
          <div
            className="relative bg-white rounded-[2rem] w-full max-w-[500px] flex flex-col overflow-visible shadow-[0_20px_60px_-15px_rgba(239,68,68,0.2)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sci-Fi glowing border accents */}
            <div className="absolute -inset-[2px] bg-gradient-to-b from-red-200 via-transparent to-red-200 rounded-[2rem] opacity-50 blur-[2px] -z-10 pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-56 h-4 bg-red-500/20 blur-md rounded-full pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-2 bg-gradient-to-r from-red-600 via-red-400 to-red-600 rounded-b-lg shadow-[0_0_15px_#ef4444] pointer-events-none" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-1 bg-gradient-to-r from-transparent via-red-400 to-transparent opacity-40 pointer-events-none" />
            
            {/* Top Right Close Button */}
            <button onClick={() => setPrizesOpen(false)} className="absolute top-6 right-6 w-8 h-8 bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 text-white rounded-[10px] flex items-center justify-center rotate-45 transition-transform hover:scale-110 shadow-lg shadow-red-500/30 z-20 border-[2px] border-white/20">
              <span className="-rotate-45 block"><X size={16} strokeWidth={4} /></span>
            </button>

            {/* Header Section */}
            <div className="px-8 pt-8 pb-6 relative z-10">
              <div className="flex items-center gap-4">
                {/* Red Hexagon Icon */}
                <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-xl rotate-45 flex items-center justify-center shadow-lg shadow-red-500/30 shrink-0 border-[3px] border-red-50">
                  <span className="-rotate-45 block text-white"><Gift size={20} fill="currentColor" strokeWidth={1.5} /></span>
                </div>
                <div className="pt-1">
                  <h2 className="text-2xl font-black text-gray-800 tracking-tight">
                    รางวัลรวม <span className="text-red-500">#{round?.roundNumber || 'นี้'}</span>
                  </h2>
                  <p className="text-[11px] font-bold text-gray-500 mt-1 tracking-wide">
                    การันตี {totalCards} ใบ ลุ้นรับรางวัลใบละ <span className="text-red-500 font-black">1 รางวัล</span> ไม่ซ้ำกัน — โอกาสน้อยแต่อันปังแน่!
                  </p>
                </div>
              </div>
            </div>

            {/* Content List */}
            <div className="px-6 pb-4 overflow-y-auto max-h-[55vh] hide-scrollbar">
              {!round?.prizes?.length ? (
                <div className="py-12 text-center text-sm font-bold text-gray-400">ยังไม่เปิดรอบ — รอแอดมินเปิดรอบก่อนนะ</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {round.prizes.map((p, idx) => (
                    <div
                      key={idx}
                      className={`relative flex items-center gap-3.5 rounded-[1.25rem] border-2 px-3.5 py-3 ${
                        p.taken ? 'border-gray-100 bg-gray-50/70 opacity-60' : 'border-gray-50 bg-white hover:border-red-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md'
                      } transition-all duration-300 overflow-hidden group cursor-default`}
                    >
                      {/* Left Icon (Hexagon inside red gradient) */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 p-1 relative z-10 ${
                        p.taken ? 'bg-gray-200 rotate-0' : 'bg-gradient-to-b from-red-400 to-red-600 rotate-45 shadow-[0_4px_10px_rgba(239,68,68,0.25)]'
                      }`}>
                         <div className={p.taken ? "w-full h-full flex items-center justify-center bg-transparent" : "-rotate-45 w-[110%] h-[110%] flex items-center justify-center bg-white rounded-lg p-1.5 shadow-inner"}>
                           {p.icon ? (
                             <img src={p.icon} alt={p.title} className={`max-w-full max-h-full object-contain ${p.taken ? 'grayscale' : 'drop-shadow-sm scale-110'}`} />
                           ) : (
                             <Gift size={18} className={p.taken ? 'text-gray-400' : 'text-red-500'} />
                           )}
                         </div>
                      </div>
                      
                      <div className="flex-1 min-w-0 relative z-10 pt-0.5">
                        <p className={`text-[16px] font-black truncate leading-tight mb-0.5 tracking-tight ${p.taken ? 'text-gray-400 line-through' : 'text-red-600'}`}>
                           {p.name}
                        </p>
                        <p className={`text-[10px] font-bold truncate ${p.taken ? 'text-gray-400' : 'text-gray-500'}`}>
                          {p.taken ? 'ถูกเปิดไปแล้ว' : p.title}
                        </p>
                      </div>

                      {/* ป้ายรางวัลพิเศษ — เปิดเจอใบนี้รอบจบทันที */}
                      {p.isSpecial && (
                        <span className={`absolute top-1.5 right-1.5 z-10 text-[8px] font-black px-1.5 py-0.5 rounded-full border ${p.taken ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-amber-100 text-amber-600 border-amber-300'}`}>
                          ⭐ พิเศษ
                        </span>
                      )}

                      {/* Right Diamond */}
                      {!p.taken && (
                         <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-[5px] h-[5px] bg-red-400 rotate-45 opacity-40 group-hover:opacity-80 transition-opacity" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Rules */}
            <div className="py-4 text-center flex items-center justify-center gap-1.5 relative z-10 mt-2">
              <div className="w-3.5 h-3.5 bg-red-600 text-white rounded-full flex items-center justify-center text-[9px] font-black shadow-sm shadow-red-500/30">!</div>
              <span className="text-[10px] font-bold text-gray-400 tracking-wide">รางวัลทั้งหมดเป็นไปตามเงื่อนไขของกิจกรรม</span>
            </div>

            {roundActive && !roundCompleted && (
              <div className="px-6 py-4 absolute -bottom-20 left-0 w-full z-10">
                <button
                  onClick={() => setPrizesOpen(false)}
                  className="w-full bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 text-white py-3.5 rounded-[1.5rem] text-[15px] font-black shadow-[0_6px_0_#991b1b,0_15px_20px_rgba(239,68,68,0.4)] active:shadow-none active:translate-y-1.5 transition-all"
                >
                  ไปลุ้นเลย! เหลืออีก {totalCards - openedCards} ใบ
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* popup ประวัติการสุ่ม — ใครเปิดการ์ดไหนได้รางวัลอะไร เรียงล่าสุดก่อน */}
      {historyOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setHistoryOpen(false)}>
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <h2 className="text-base font-black text-gray-800 flex items-center gap-2">
                <Clock size={18} className="text-red-500" /> ประวัติการสุ่ม
              </h2>
              <button onClick={() => setHistoryOpen(false)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto">
              {history === null ? (
                <div className="py-14 text-center text-sm font-bold text-gray-400">กำลังโหลด...</div>
              ) : history.length === 0 ? (
                <div className="py-14 text-center text-sm font-bold text-gray-400">ยังไม่มีใครเปิดการ์ดเลย</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {history.map((h, idx) => {
                    const mine = h.openedBy && h.openedBy === myId;
                    return (
                      <div key={idx} className={`flex items-center gap-3 px-5 py-3 ${mine ? 'bg-red-50/60' : ''}`}>
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-b from-red-500 to-red-700 flex items-center justify-center shrink-0 p-1.5">
                          {h.prize.icon ? (
                            <img src={h.prize.icon} alt={h.prize.title} className="w-full h-full object-contain drop-shadow-sm" />
                          ) : (
                            <Gift size={18} className="text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-gray-800 truncate">
                            {h.prize.name}
                            <span className="ml-1.5 text-[9px] font-black text-red-500 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded uppercase align-middle">{h.prize.title}</span>
                          </p>
                          <p className={`text-[11px] font-bold truncate ${mine ? 'text-red-500' : 'text-gray-400'}`}>
                            {mine ? 'คุณ' : h.openedByName} · รอบ #{h.roundNumber} ใบที่ {h.cardIndex + 1}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-gray-300 shrink-0">
                          {h.openedAt
                            ? new Date(h.openedAt).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                            : '-'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

      {/* popup วิธีการเล่น */}
      {howToPlayOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setHowToPlayOpen(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <BookOpen size={18} className="text-blue-500" />
                </div>
                <h2 className="font-black text-lg text-gray-900">วิธีการเล่น</h2>
              </div>
              <button onClick={() => setHowToPlayOpen(false)} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
              {howToPlay ? (
                <div className="text-sm text-gray-700 leading-relaxed space-y-2">
                  {howToPlay.split('\n').map((line, i) => {
                    const parts = line.split(/\*\*(.*?)\*\*/g);
                    return (
                      <p key={i} className={line.trim() === '' ? 'h-2' : ''}>
                        {parts.map((part, j) =>
                          j % 2 === 1
                            ? <strong key={j} className="text-gray-900 font-bold">{part}</strong>
                            : <span key={j}>{part}</span>
                        )}
                      </p>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีเนื้อหา — แอดมินสามารถแก้ไขได้ที่หลังบ้าน ตั้งค่า → สุ่มการ์ดพิเศษ</p>
              )}
            </div>
            <div className="px-6 pb-5">
              <button onClick={() => setHowToPlayOpen(false)} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition-colors text-sm">
                เข้าใจแล้ว!
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes cardshake {
          0%, 100% { transform: rotate(0deg) translateX(0); }
          25% { transform: rotate(-1.5deg) translateX(-4px); }
          75% { transform: rotate(1.5deg) translateX(4px); }
        }
        @keyframes prizepop {
          0% { transform: scale(0.3); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}} />
    </div>
  );
}
