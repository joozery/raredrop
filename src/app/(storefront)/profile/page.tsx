"use client";

import React, { useEffect, useState } from 'react';
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ChevronRight, Wallet, Coins, Gift, UserPlus, LibrarySquare, HelpCircle, History, LogOut, Gamepad2, EyeOff, Sparkles } from 'lucide-react';
import { useRouter } from "next/navigation";
import { InviteFriendModal } from "@/components/profile/InviteFriendModal";
import { RedeemCodeModal } from "@/components/profile/RedeemCodeModal";
import { TopupModal } from "@/components/payment/TopupModal";

interface LevelInfo {
  xp: number;
  level: number;
  currentLevelXp: number;
  nextLevelXp: number | null;
  afterNextLevelXp: number | null;
  nextLevel: number | null;
  nextRewards: { itemId: { _id: string; name: string; image: string }; quantity: number }[];
  progress: number;
  xpToNext: number;
  logoImage: string | null;
  tagImage: string | null;
  colorTheme: string;
}

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [isInviteOpen, setIsInviteOpen] = React.useState(false);
  const [isRedeemOpen, setIsRedeemOpen] = React.useState(false);
  const [isTopupOpen, setIsTopupOpen] = React.useState(false);
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
  const [discordUrl, setDiscordUrl] = useState("");
  const [gemcoinIcon, setGemcoinIcon] = useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [hideFromLeaderboard, setHideFromLeaderboard] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('กรุณาเลือกไฟล์รูปภาพ');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5MB');
      return;
    }

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/user/profile/upload-avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "อัพโหลดไม่สำเร็จ");
      
      await updateSession({ image: data.url });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    fetch("/api/public-settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { setDiscordUrl(d.discord_invite_url || ""); setGemcoinIcon(d.gemcoin_icon || ""); })
      .catch(() => {});
  }, []);

  const handleDiscordClick = () => {
    if (session) fetch("/api/user/discord-join-reward", { method: "POST" }).catch(() => {});
  };

  useEffect(() => {
    if (!session) return;
    fetch("/api/user/level")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setLevelInfo(d))
      .catch(() => {});
    fetch(`/api/user/settings?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setHideFromLeaderboard(!!d.hideFromLeaderboard))
      .catch(() => {});
  }, [session]);

  const handleToggleLeaderboardPrivacy = async () => {
    const prev = hideFromLeaderboard;
    const next = !prev;
    setSavingPrivacy(true);
    setHideFromLeaderboard(next);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hideFromLeaderboard: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "failed");
      setHideFromLeaderboard(!!data.hideFromLeaderboard);
    } catch {
      setHideFromLeaderboard(prev);
    } finally {
      setSavingPrivacy(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-white pb-24">
      {/* Top Section (User Info & Level) */}
      <div className="bg-gradient-to-b from-orange-50 to-white pt-8 px-4 pb-4">
        {/* User Info */}
        <div className="flex items-center gap-4 relative">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAvatarChange} 
            accept="image/jpeg,image/png,image/webp,image/gif" 
            className="hidden" 
          />
          <div 
            onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
            className="w-20 h-20 rounded-full bg-gray-200 shrink-0 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center relative cursor-pointer group"
          >
            {uploadingAvatar ? (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <span className="text-[10px] font-bold text-white">เปลี่ยนรูป</span>
              </div>
            )}

            {session?.user?.image ? (
              <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-gray-400">{(session?.user?.name || "U").charAt(0).toUpperCase()}</span>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{session?.user?.name || "User"}</h1>
              {levelInfo?.tagImage ? (
                <img src={levelInfo.tagImage} alt="Level Tag" className="h-6 object-contain drop-shadow-sm" />
              ) : (
                <div className="bg-gray-200 px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-600 italic">V{(session?.user as any)?.vipLevel || 1}</div>
              )}
            </div>
            
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">{session?.user?.email || "ID 2837563"}</span>
            </div>

          </div>
        </div>

        {/* Level Card */}
        <div 
          className={`mt-8 rounded-xl p-4 relative overflow-visible shadow-sm border border-gray-100 ${
            ['gold', 'silver', 'bronze', 'diamond'].includes(levelInfo?.colorTheme || "") ? "" : "bg-[#f1f1f2]"
          } ${
            levelInfo?.colorTheme === 'gold' ? 'bg-gradient-to-r from-yellow-100 to-amber-50' :
            levelInfo?.colorTheme === 'silver' ? 'bg-gradient-to-r from-slate-200 to-gray-100' :
            levelInfo?.colorTheme === 'bronze' ? 'bg-gradient-to-r from-orange-100 to-amber-50/50' :
            levelInfo?.colorTheme === 'diamond' ? 'bg-gradient-to-r from-cyan-100 to-blue-50' :
            ''
          }`}
          style={{ backgroundColor: (levelInfo?.colorTheme && !['gold', 'silver', 'bronze', 'diamond', 'gray'].includes(levelInfo?.colorTheme)) ? levelInfo.colorTheme : undefined }}
        >
          {/* Level Logo Image */}
          {levelInfo?.logoImage && (
            <div className="absolute -top-8 -right-4 w-32 h-32 z-20 pointer-events-none drop-shadow-md">
              <img src={levelInfo.logoImage} alt="Level Logo" className="w-full h-full object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
            </div>
          )}

          <div className="relative z-10 w-full pr-14">
            <div className="flex items-end justify-between mb-2">
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Lv.{levelInfo?.level ?? (session?.user as any)?.vipLevel ?? 1}</h2>
              <button
                onClick={() => router.push("/levels")}
                className="text-[10px] text-gray-500 font-medium flex flex-col items-end gap-0.5 hover:text-gray-700 transition-colors"
              >
                {levelInfo
                  ? levelInfo.nextLevelXp != null
                    ? <>
                        <span className="flex items-center gap-0.5">
                          เหลืออีก {levelInfo.xpToNext.toLocaleString()} XP เพื่อ Lv.{levelInfo.nextLevel}
                          <ChevronRight size={12} className="ml-0.5" />
                        </span>
                        {levelInfo.afterNextLevelXp != null && (
                          <span className="text-gray-400">
                            Lv.{levelInfo.nextLevel} ต้องการ {(levelInfo.afterNextLevelXp - levelInfo.nextLevelXp!).toLocaleString()} XP
                          </span>
                        )}
                      </>
                    : <span>เลเวลสูงสุดแล้ว! ดูทั้งหมด <ChevronRight size={10} className="inline" /></span>
                  : <span>โหลด...</span>
                }
              </button>
            </div>
            <div className="h-1.5 bg-gray-200/80 rounded-full w-full overflow-hidden mb-1.5">
              <div
                className="h-full bg-gray-300 rounded-full transition-all duration-700"
                style={{ width: `${Math.round((levelInfo?.progress ?? 0) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-gray-400 font-bold">
              <span>{levelInfo?.currentLevelXp != null ? `${levelInfo.currentLevelXp.toLocaleString()}XP` : "0XP"}</span>
              <span>{levelInfo?.nextLevelXp != null ? `${levelInfo.nextLevelXp.toLocaleString()}XP` : "MAX"}</span>
            </div>

            {/* Next level rewards preview */}
            {levelInfo?.nextRewards && levelInfo.nextRewards.length > 0 && (
              <div className="mt-3 flex items-center gap-2 border-t border-gray-200/50 pt-2">
                <span className="text-[10px] text-gray-500 font-bold shrink-0">รางวัล Lv.{levelInfo.nextLevel}:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {levelInfo.nextRewards.map((r, i) => (
                    <div key={i} className="flex items-center gap-1 bg-white border border-gray-200 rounded-md px-1.5 py-0.5 shadow-sm">
                      <img src={r.itemId?.image} alt={r.itemId?.name} className="w-3.5 h-3.5 rounded object-cover" />
                      <span className="text-[9px] font-bold text-gray-700 max-w-[60px] truncate">{r.itemId?.name}</span>
                      <span className="text-[8px] text-gray-400">×{r.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 flex flex-col gap-4 mt-2">
        {/* Wallet Section */}
        <div
          onClick={() => setIsTopupOpen(true)}
          className="bg-[#2A2A2A] rounded-2xl p-4 text-white shadow-md cursor-pointer hover:bg-[#333333] active:scale-[0.99] transition-all"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium mb-1">
                <Wallet size={14} /> ยอดเงินที่ใช้ได้
              </div>
              <div className="text-2xl font-bold tracking-tight">
                ฿ {session ? ((session.user as any)?.coins || 0).toLocaleString(undefined, {minimumFractionDigits: 2}) : "0.00"}
              </div>
            </div>
            <div className="bg-red-600 hover:bg-red-700 transition-colors text-white text-xs font-bold px-3 py-1.5 rounded-lg">
              เติมเงิน
            </div>
          </div>
        </div>

        {/* Points */}
        <Link href="/exchange" className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-100 transition-colors border border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-center shrink-0 w-10 h-10">
            {gemcoinIcon ? <img src={gemcoinIcon} alt="" className="w-10 h-10 object-contain" /> : <Coins size={32} className="fill-orange-400 text-orange-200" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-gray-900 text-[15px]">
              {session ? ((session.user as any)?.gemCoins || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}
            </div>
            <div className="text-[10px] text-gray-500 font-medium">GemCoin</div>
          </div>
          <ChevronRight size={14} className="text-gray-300" />
        </Link>

        {/* Other Menus */}
        <div className="mt-4">
          <h3 className="font-bold text-gray-900 mb-5 text-[15px]">เมนูอื่นๆ</h3>
          <div className="grid grid-cols-4 gap-y-7 gap-x-2">
            {[
              { icon: Gift, label: "แลกโค้ด", onClick: () => setIsRedeemOpen(true) },
              { icon: UserPlus, label: "เชิญเพื่อน", onClick: () => setIsInviteOpen(true) },
              { icon: Sparkles, label: "สุ่มการ์ดพิเศษ", href: "/cards" },
              { icon: LibrarySquare, label: "คอลเลกชันของฉัน", href: "/inventory" },
              { icon: HelpCircle, label: "ช่วยเหลือ", href: "/help" },
              { icon: History, label: "ประวัติการสุ่ม", href: "/roll-history" },
              { icon: Wallet, label: "ประวัติการเติมเงิน", href: "/topup-history" },
              { icon: Gamepad2, label: "วิธีการเล่น", href: "/knowledge-base" },
            ].map((menu, i) => {
              const content = (
                <>
                  <div className="text-gray-600 group-hover:text-primary transition-colors group-active:scale-95">
                    <menu.icon size={26} strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] font-medium text-gray-700 text-center">{menu.label}</span>
                </>
              );
              if (menu.href) {
                return (
                  <Link key={i} href={menu.href} className="flex flex-col items-center gap-2.5 cursor-pointer group">
                    {content}
                  </Link>
                );
              }
              if (menu.onClick) {
                return (
                  <button key={i} onClick={menu.onClick} className="flex flex-col items-center gap-2.5 cursor-pointer group">
                    {content}
                  </button>
                );
              }
              return (
                <div key={i} className="flex flex-col items-center gap-2.5 cursor-pointer group">
                  {content}
                </div>
              );
            })}

            <a
              href={discordUrl || "#"}
              target={discordUrl ? "_blank" : undefined}
              rel={discordUrl ? "noopener noreferrer" : undefined}
              onClick={handleDiscordClick}
              className="flex flex-col items-center gap-2.5 cursor-pointer group"
            >
              <div className="text-gray-600 group-hover:text-primary transition-colors group-active:scale-95">
                <img src="/banner/cover/discord.svg" alt="Discord" className="w-[26px] h-[26px]" />
              </div>
              <span className="text-[10px] font-medium text-gray-700 text-center">เข้าร่วม Discord รับ GemCoin</span>
            </a>
          </div>
        </div>

        {/* Privacy Settings */}
        {session && (
          <div className="mt-6 border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">ความเป็นส่วนตัว</p>
            </div>
            <button
              onClick={handleToggleLeaderboardPrivacy}
              disabled={savingPrivacy}
              className="w-full flex items-center gap-3 px-4 py-4 bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                <EyeOff size={18} className="text-purple-500" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-bold text-gray-800">ซ่อนชื่อในกระดานอันดับ</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {hideFromLeaderboard ? "ชื่อจะแสดงเป็น ju*** แทนชื่อจริง" : "ชื่อจริงของคุณจะแสดงในกระดานอันดับ"}
                </p>
              </div>
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${hideFromLeaderboard ? "bg-purple-500" : "bg-gray-200"} ${savingPrivacy ? "opacity-50" : ""}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${hideFromLeaderboard ? "translate-x-6" : "translate-x-1"}`} />
              </div>
            </button>
          </div>
        )}

        {/* Logout Button */}
        {session && (
          <div className="mt-4 px-2">
            <button 
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 font-bold rounded-xl py-3.5 flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <LogOut size={18} />
              ออกจากระบบ
            </button>
          </div>
        )}
      </div>

      <InviteFriendModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} />
      <RedeemCodeModal isOpen={isRedeemOpen} onClose={() => setIsRedeemOpen(false)} />
      <TopupModal isOpen={isTopupOpen} onClose={() => setIsTopupOpen(false)} />
    </div>
  );
}
