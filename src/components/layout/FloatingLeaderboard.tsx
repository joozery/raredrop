import Link from "next/link";
import { Trophy } from "lucide-react";

export function FloatingLeaderboard() {
  return (
    <Link
      href="/leaderboard"
      className="relative w-14 h-14 rounded-full bg-white hover:bg-slate-50 text-amber-500 shadow-xl shadow-black/10 border border-slate-100 flex items-center justify-center transition-transform hover:scale-105"
      aria-label="Leaderboard"
    >
      <Trophy size={24} />
      <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-[#1A1A1A]" />
    </Link>
  );
}
