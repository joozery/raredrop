"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";

interface RouletteAnimationProps {
  boxItems: any[];
  resultItem: any;
  onEnded: () => void;
  noFrame?: boolean;
}

const SPIN_MS = 8500; // ออกตัวเร็ว แล้วลากช้าลงเรื่อย ๆ ช่วงท้ายให้ลุ้น
const WINNER_INDEX = 55;

// ขนาดการ์ด/กรอบตามจอ — จอเล็กย่อทุกอย่างลงให้รางไม่ล้นและเห็นหลายใบ
// (คำนวณครั้งเดียวตอน mount ได้ เพราะ component ถูก mount ใหม่ทุกครั้งที่กดสุ่ม)
function getDims() {
  const mobile = typeof window !== "undefined" && window.innerWidth < 640;
  return mobile
    ? { card: 158, gap: 12, cardH: 190, img: 80, imgMt: 38, framePad: "14px 10px", frameRadius: 60, rimRadius: 50, winRadius: 36, showArrows: false, rootWidth: "calc(100% + 28px)", rootMargin: "0 -14px" }
    : { card: 186, gap: 16, cardH: 212, img: 100, imgMt: 48, framePad: "24px 64px", frameRadius: 110, rimRadius: 96, winRadius: 70, showArrows: true, rootWidth: "100%", rootMargin: "0 auto" };
}

function playTick(ctx: AudioContext, at: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = 900 + Math.random() * 120;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.12, at + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
  osc.connect(gain).connect(ctx.destination);
  osc.start(at);
  osc.stop(at + 0.06);
}

function playChime(ctx: AudioContext, at: number) {
  [880, 1318.5].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    const t = at + i * 0.09;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.2, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.55);
  });
}

export function RouletteAnimation({ boxItems, resultItem, onEnded, noFrame }: RouletteAnimationProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [dims] = useState(getDims);
  const stride = dims.card + dims.gap;

  const [items] = useState<any[]>(() => {
    const avail = boxItems.filter((b) => !b.isLocked);
    const list: any[] = [];
    for (let i = 0; i < 70; i++) {
      if (i === WINNER_INDEX || avail.length === 0) list.push(resultItem);
      else list.push(avail[Math.floor(Math.random() * avail.length)].itemId);
    }
    return list;
  });

  const scheduleSound = (dist: number) => {
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ctx: AudioContext = new Ctx();
      audioCtxRef.current = ctx;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const ease = (x: number) => 1 - Math.pow(1 - x, 3.2);
      const t0 = ctx.currentTime + 0.05;
      let last = 0;
      for (let s = 1; s <= 500; s++) {
        const t = s / 500;
        const ci = Math.floor((dist * ease(t)) / stride);
        if (ci > last) { last = ci; playTick(ctx, t0 + (t * SPIN_MS) / 1000); }
      }
      playChime(ctx, t0 + SPIN_MS / 1000 + 0.1);
    } catch { /* silent */ }
  };

  useEffect(() => {
    let r1 = 0, r2 = 0;
    r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => {
        const el = trackRef.current;
        const win = windowRef.current;
        if (!el || !win) return;

        const parentWidth = win.clientWidth;
        const stopPos = WINNER_INDEX * stride + dims.card / 2 - parentWidth / 2 + (Math.random() * 40 - 20);

        el.style.transition = `transform ${SPIN_MS}ms cubic-bezier(0.25, 0.8, 0.15, 1)`;
        el.style.transform = `translateX(-${stopPos}px)`;
        scheduleSound(stopPos);
      });
    });

    const t1 = setTimeout(() => setIsRevealed(true), SPIN_MS + 150);
    const t2 = setTimeout(() => onEnded(), SPIN_MS + 2000);
    return () => {
      cancelAnimationFrame(r1); cancelAnimationFrame(r2);
      clearTimeout(t1); clearTimeout(t2);
      audioCtxRef.current?.close().catch(() => {});
      audioCtxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* ─── Inject CSS (scoped inside the component) ─── */}
      <style>{`
        @keyframes rd-pulse { 0%,100%{opacity:.5} 50%{opacity:1} }
        .rd-strip { animation: rd-pulse 2.8s ease-in-out infinite; }
        .rd-strip-tr { animation-delay: 1.4s; }
        .rd-strip-bl { animation-delay: .7s; }
        .rd-strip-br { animation-delay: 2.1s; }
        .rd-sideglow-r { animation-delay: 1.4s; }
        .rd-card-active-title {
          color: #ff2d3f;
          text-shadow: 0 0 12px rgba(255,45,63,.75);
        }
      `}</style>

      {/* มือถือ: ดันรางให้กว้างทะลุ padding ของ section (negative margin) ให้เต็มจอ */}
      <div style={{ position: "relative", width: dims.rootWidth, maxWidth: "1280px", margin: dims.rootMargin }}>

        {/* ── Top pointer ── */}
        <div style={{
          position: "absolute", top: -24, left: "50%", transform: "translateX(-50%)", zIndex: 8,
          width: 0, height: 0,
          borderLeft: "13px solid transparent", borderRight: "13px solid transparent",
          borderTop: "18px solid #e8192c",
          filter: "drop-shadow(0 0 8px #ff2d3f) drop-shadow(0 0 20px rgba(255,45,63,.8))",
        }} />

        {/* ── Bottom pointer ── */}
        <div style={{
          position: "absolute", bottom: -24, left: "50%", transform: "translateX(-50%)", zIndex: 8,
          width: 0, height: 0,
          borderLeft: "13px solid transparent", borderRight: "13px solid transparent",
          borderBottom: "18px solid #e8192c",
          filter: "drop-shadow(0 0 8px #ff2d3f) drop-shadow(0 0 20px rgba(255,45,63,.8))",
        }} />

        {/* ── Outer capsule frame (hidden when noFrame=true) ── */}
        {noFrame ? (
          /* No frame — just the window + card track directly */
          <div ref={windowRef} style={{
            position: "relative", overflow: "hidden",
            padding: "22px 0", width: "100%",
          }}>
            {/* center red line */}
            <div style={{
              position: "absolute", left: "50%", top: -24, bottom: -24, width: 1.5,
              zIndex: 7, transform: "translateX(-50%)", pointerEvents: "none",
              background: "linear-gradient(180deg,#ff2d3f,rgba(255,45,63,.25) 30%,rgba(255,45,63,.25) 70%,#ff2d3f)",
              boxShadow: "0 0 8px rgba(255,45,63,.8)",
            }} />
            {/* edge fades */}
            <div style={{
              position: "absolute", inset: 0, zIndex: 6, pointerEvents: "none",
              background: "linear-gradient(90deg,rgba(10,11,14,.95) 0%,transparent 14%,transparent 86%,rgba(10,11,14,.95) 100%)",
            }} />
            <div ref={trackRef} style={{ display: "flex", gap: dims.gap, transform: "translateX(0)", willChange: "transform" }}>
              {items.map((item, idx) => {
                if (!item) return null;
                const rarity = item.rarityId || item.rarity;
                const rc = rarity?.color || "#64748b";
                const isWin = idx === WINNER_INDEX;
                const revealed = isWin && isRevealed;
                return (
                  <div
                    key={idx}
                    className={`shrink-0 rounded-[18px] flex flex-col relative overflow-hidden transition-all duration-500 cursor-pointer group ${!rarity?.backgroundImage ? 'bg-white border-2' : 'border border-white/10'}`}
                    style={{
                      flex: `0 0 ${dims.card}px`,
                      height: dims.cardH,
                      borderColor: revealed ? "#ff2d3f" : (!rarity?.backgroundImage ? (rc ? `${rc}60` : "#e2e8f0") : undefined),
                      borderWidth: revealed ? 2.5 : (!rarity?.backgroundImage ? 2 : 1),
                      boxShadow: revealed ? `0 0 0 2px #ff2d3f, 0 0 28px rgba(255,45,63,.9), 0 0 60px rgba(255,45,63,.4), inset 0 0 20px rgba(255,45,63,.3)` : undefined,
                      transform: revealed ? "scale(1.06) translateY(-4px)" : "scale(1)",
                      zIndex: isWin ? 30 : 10,
                    }}
                  >
                    {revealed && (<div className="absolute inset-0 rounded-[18px] z-40 pointer-events-none animate-pulse" style={{ boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.6), 0 0 20px rgba(255,255,255,0.3)" }} />)}
                    {rarity?.backgroundImage && (<div className="absolute inset-0 z-0 bg-[#0a0a14]"><img src={rarity.backgroundImage} alt="bg" className="w-full h-full object-cover opacity-80" /><div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14] via-[#0a0a14]/60 to-transparent" /></div>)}
                    <div className="absolute top-2 left-2 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider z-20 text-white shadow-sm flex items-center gap-1" style={{ backgroundColor: revealed ? "#ff2d3f" : (rc || "#64748b") }}>
                      <Sparkles size={9} className={revealed ? "animate-pulse" : ""} /><span>{rarity?.name || "N/A"}</span>
                    </div>
                    <div className="mx-auto flex items-center justify-center rounded-[14px] relative z-10 transition-all duration-300 overflow-hidden" style={{ width: dims.img, height: dims.img, marginTop: dims.imgMt, boxShadow: rarity?.backgroundImage ? `0 0 15px ${rc}60, inset 0 0 10px ${rc}30` : "none", border: rarity?.backgroundImage ? `1.5px solid ${rc}` : "2px solid transparent", backgroundColor: !rarity?.backgroundImage ? "#f8fafc" : undefined, ...(revealed ? { boxShadow: `0 0 20px ${rc}, inset 0 0 10px ${rc}`, border: `2px solid ${rc}` } : {}) }}>
                      <div className="relative w-full h-full flex items-center justify-center p-2">
                        {item?.image ? (<img src={item.image} alt={item.name} className={`w-full h-full object-contain transition-transform duration-500 ${revealed ? "scale-125" : ""} ${!rarity?.backgroundImage ? "mix-blend-multiply drop-shadow-none" : "drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"}`} />) : (<div className="w-12 h-12 bg-white/10 rounded-xl" />)}
                      </div>
                    </div>
                    <div className="mt-3 mb-2 flex flex-col items-center text-center relative z-10 px-3">
                      {rarity?.backgroundImage && (<div className="flex items-center w-full justify-center gap-2 mb-1 opacity-70"><div className="h-[1px] w-6 bg-gradient-to-r from-transparent to-white/60" /><Sparkles size={9} className="text-white" /><div className="h-[1px] w-6 bg-gradient-to-l from-transparent to-white/60" /></div>)}
                      <p className={`font-bold text-[13px] line-clamp-1 w-full transition-colors ${rarity?.backgroundImage ? "text-white" : (revealed ? "text-red-500" : "text-gray-800")}`} style={revealed ? { textShadow: "0 0 12px rgba(255,45,63,.75)" } : undefined}>{item?.name}</p>
                      <p className={`text-[10px] leading-tight mt-1 font-medium ${rarity?.backgroundImage ? "text-white/50" : "text-gray-400"}`}>ไอเทมระดับ {rarity?.name || "Common"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={{
            position: "relative",
            borderRadius: dims.frameRadius,
            padding: dims.framePad,
            background: "linear-gradient(180deg,#3a3c44 0%,#17181d 10%,#0d0e12 30%,#0a0b0e 70%,#191a20 92%,#3a3c44 100%)",
            boxShadow: `
              0 1px 0 rgba(255,255,255,.10) inset,
              0 -1px 0 rgba(0,0,0,.9) inset,
              0 34px 70px -20px rgba(0,0,0,.95),
              0 0 80px -26px rgba(232,25,44,.5),
              0 0 0 1px #000
            `,
          }}>
            {/* inner rim pseudo-border */}
            <div style={{ position: "absolute", inset: 10, borderRadius: dims.rimRadius, pointerEvents: "none", border: "1.5px solid transparent", background: "linear-gradient(165deg,#63666f,#15161a 30%,#000 55%,#4a4c55 100%) border-box", WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)", WebkitMaskComposite: "xor", maskComposite: "exclude" as any }} />
            {["top", "bottom"].map((side) => (<div key={side} style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", width: "34%", height: 10, ...(side === "top" ? { top: 6 } : { bottom: 6 }), background: "linear-gradient(180deg,#26272d,#0b0c0f)", borderRadius: 6, boxShadow: "0 0 0 1px #000, 0 1px 0 rgba(255,255,255,.05) inset" }} />))}
            {[{ cls: "", style: { top: -2, left: "12%" } }, { cls: "rd-strip-tr", style: { top: -2, right: "12%" } }, { cls: "rd-strip-bl", style: { bottom: -2, left: "12%" } }, { cls: "rd-strip-br", style: { bottom: -2, right: "12%" } }].map((s, i) => (<div key={i} className={`rd-strip ${s.cls}`} style={{ position: "absolute", height: 5, width: 120, borderRadius: 4, background: "#ff2d3f", filter: "blur(1px)", boxShadow: "0 0 18px 4px rgba(255,45,63,.7)", ...s.style }} />))}
            {[{ cls: "", left: 2 }, { cls: "rd-sideglow-r", right: 2 }].map((s, i) => (<div key={i} className={`rd-strip ${s.cls}`} style={{ position: "absolute", top: "26%", bottom: "26%", width: 8, borderRadius: 8, background: "linear-gradient(180deg,transparent,#ff2d3f,transparent)", filter: "blur(2px)", boxShadow: "0 0 22px 5px rgba(255,45,63,.5)", ...(i === 0 ? { left: 2 } : { right: 2 }) }} />))}
            {dims.showArrows && <button style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: 20, zIndex: 8, background: "none", border: 0, cursor: "pointer", padding: 8, color: "#ff2d3f", fontSize: 34, lineHeight: 1, fontWeight: 800, textShadow: "0 0 10px rgba(255,45,63,.9), 0 0 24px rgba(255,45,63,.5)", fontFamily: "inherit" }}>‹</button>}
            {dims.showArrows && <button style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", right: 20, zIndex: 8, background: "none", border: 0, cursor: "pointer", padding: 8, color: "#ff2d3f", fontSize: 34, lineHeight: 1, fontWeight: 800, textShadow: "0 0 10px rgba(255,45,63,.9), 0 0 24px rgba(255,45,63,.5)", fontFamily: "inherit" }}>›</button>}
            {/* ── Window ── */}
            <div ref={windowRef} style={{ position: "relative", overflow: "hidden", borderRadius: dims.winRadius, padding: "22px 0" }}>
              <div style={{ position: "absolute", left: "50%", top: -24, bottom: -24, width: 1.5, zIndex: 7, transform: "translateX(-50%)", pointerEvents: "none", background: "linear-gradient(180deg,#ff2d3f,rgba(255,45,63,.25) 30%,rgba(255,45,63,.25) 70%,#ff2d3f)", boxShadow: "0 0 8px rgba(255,45,63,.8)" }} />
              <div style={{ position: "absolute", inset: 0, zIndex: 6, pointerEvents: "none", background: "linear-gradient(90deg,rgba(10,11,14,.95) 0%,transparent 14%,transparent 86%,rgba(10,11,14,.95) 100%)" }} />
              <div ref={trackRef} style={{ display: "flex", gap: dims.gap, transform: "translateX(0)", willChange: "transform" }}>
                {items.map((item, idx) => {
                  if (!item) return null;
                  const rarity = item.rarityId || item.rarity;
                  const rc = rarity?.color || "#64748b";
                  const isWin = idx === WINNER_INDEX;
                  const revealed = isWin && isRevealed;
                  return (
                    <div
                      key={idx}
                      className={`shrink-0 rounded-[18px] flex flex-col relative overflow-hidden transition-all duration-500 cursor-pointer group ${!rarity?.backgroundImage ? 'bg-white border-2' : 'border border-white/10'}`}
                      style={{
                        flex: `0 0 ${dims.card}px`,
                        height: dims.cardH,
                        borderColor: revealed ? "#ff2d3f" : (!rarity?.backgroundImage ? (rc ? `${rc}60` : "#e2e8f0") : undefined),
                        borderWidth: revealed ? 2.5 : (!rarity?.backgroundImage ? 2 : 1),
                        boxShadow: revealed ? `0 0 0 2px #ff2d3f, 0 0 28px rgba(255,45,63,.9), 0 0 60px rgba(255,45,63,.4), inset 0 0 20px rgba(255,45,63,.3)` : undefined,
                        transform: revealed ? "scale(1.06) translateY(-4px)" : "scale(1)",
                        zIndex: isWin ? 30 : 10,
                      }}
                    >
                      {revealed && (<div className="absolute inset-0 rounded-[18px] z-40 pointer-events-none animate-pulse" style={{ boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.6), 0 0 20px rgba(255,255,255,0.3)" }} />)}
                      {rarity?.backgroundImage && (<div className="absolute inset-0 z-0 bg-[#0a0a14]"><img src={rarity.backgroundImage} alt="bg" className="w-full h-full object-cover opacity-80" /><div className="absolute inset-0 bg-gradient-to-t from-[#0a0a14] via-[#0a0a14]/60 to-transparent" /></div>)}
                      <div className="absolute top-2 left-2 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider z-20 text-white shadow-sm flex items-center gap-1" style={{ backgroundColor: revealed ? "#ff2d3f" : (rc || "#64748b") }}>
                        <Sparkles size={9} className={revealed ? "animate-pulse" : ""} /><span>{rarity?.name || "N/A"}</span>
                      </div>
                      <div className="mx-auto flex items-center justify-center rounded-[14px] relative z-10 transition-all duration-300 overflow-hidden" style={{ width: dims.img, height: dims.img, marginTop: dims.imgMt, boxShadow: rarity?.backgroundImage ? `0 0 15px ${rc}60, inset 0 0 10px ${rc}30` : "none", border: rarity?.backgroundImage ? `1.5px solid ${rc}` : "2px solid transparent", backgroundColor: !rarity?.backgroundImage ? "#f8fafc" : undefined, ...(revealed ? { boxShadow: `0 0 20px ${rc}, inset 0 0 10px ${rc}`, border: `2px solid ${rc}` } : {}) }}>
                        <div className="relative w-full h-full flex items-center justify-center p-2">
                          {item?.image ? (<img src={item.image} alt={item.name} className={`w-full h-full object-contain transition-transform duration-500 ${revealed ? "scale-125" : ""} ${!rarity?.backgroundImage ? "mix-blend-multiply drop-shadow-none" : "drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"}`} />) : (<div className="w-12 h-12 bg-white/10 rounded-xl" />)}
                        </div>
                      </div>
                      <div className="mt-3 mb-2 flex flex-col items-center text-center relative z-10 px-3">
                        {rarity?.backgroundImage && (<div className="flex items-center w-full justify-center gap-2 mb-1 opacity-70"><div className="h-[1px] w-6 bg-gradient-to-r from-transparent to-white/60" /><Sparkles size={9} className="text-white" /><div className="h-[1px] w-6 bg-gradient-to-l from-transparent to-white/60" /></div>)}
                        <p className={`font-bold text-[13px] line-clamp-1 w-full transition-colors ${rarity?.backgroundImage ? "text-white" : (revealed ? "text-red-500" : "text-gray-800")}`} style={revealed ? { textShadow: "0 0 12px rgba(255,45,63,.75)" } : undefined}>{item?.name}</p>
                        <p className={`text-[10px] leading-tight mt-1 font-medium ${rarity?.backgroundImage ? "text-white/50" : "text-gray-400"}`}>ไอเทมระดับ {rarity?.name || "Common"}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
