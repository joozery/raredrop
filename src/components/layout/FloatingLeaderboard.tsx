import Link from "next/link";
import { Trophy } from "lucide-react";

export function FloatingLeaderboard() {
  return (
    <Link
      href="/leaderboard"
      className="fixed bottom-[144px] lg:bottom-[88px] right-4 lg:right-6 z-40 w-14 h-14 rounded-full bg-[#1A1A1A] hover:bg-black text-amber-400 shadow-xl shadow-black/20 flex items-center justify-center transition-transform hover:scale-110"
      aria-label="Leaderboard"
    >
      <Trophy size={24} />
      <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-[#1A1A1A]" />
    </Link>
  );
}
