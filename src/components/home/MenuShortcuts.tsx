"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface Shortcut {
  _id: string;
  title: string;
  imageUrl: string;
  url: string;
}

export default function MenuShortcuts() {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/menu-shortcuts")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setShortcuts(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  if (loading || shortcuts.length === 0) return null;

  return (
    <div className="w-full relative group">
      {/* Floating Left Arrow */}
      <button
        onClick={() => scroll("left")}
        className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-gray-100 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.1)] flex items-center justify-center text-gray-600 hover:text-red-600 hover:scale-105 active:scale-95 transition-all opacity-0 group-hover:opacity-100 hidden sm:flex"
      >
        <ChevronLeft size={18} />
      </button>

      {/* Floating Right Arrow (Always visible on mobile if many items, or on hover on desktop) */}
      {shortcuts.length > 3 && (
        <button
          onClick={() => scroll("right")}
          className="absolute -right-1 sm:-right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-gray-100 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.1)] flex items-center justify-center text-gray-600 hover:text-red-600 hover:scale-105 active:scale-95 transition-all opacity-90 hover:opacity-100"
        >
          <ChevronRight size={18} />
        </button>
      )}

      <div ref={scrollRef} className="flex overflow-x-auto hide-scrollbar gap-3 sm:gap-4 snap-x snap-mandatory py-2 px-1">
        {shortcuts.map((item) => (
          <Link
            key={item._id}
            href={item.url}
            className="flex flex-col items-center justify-center min-w-[80px] sm:min-w-[100px] bg-white rounded-2xl p-3 sm:p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all snap-start flex-1 shrink-0 hover:-translate-y-0.5"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 mb-2 overflow-hidden transition-transform group-hover:scale-105">
              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-contain" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-slate-800 text-center whitespace-nowrap">
              {item.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
