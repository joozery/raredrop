"use client";
import { useState, useRef, useEffect } from "react";
import { X, GripHorizontal } from "lucide-react";

export function FloatingWidgetsGroup({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(true);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const startOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      setPos({
        x: startOffset.current.x + (e.clientX - dragStart.current.x),
        y: startOffset.current.y + (e.clientY - dragStart.current.y)
      });
    };
    const handleMouseUp = () => {
      isDragging.current = false;
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      // Prevent default scrolling when dragging
      e.preventDefault();
      const touch = e.touches[0];
      setPos({
        x: startOffset.current.x + (touch.clientX - dragStart.current.x),
        y: startOffset.current.y + (touch.clientY - dragStart.current.y)
      });
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed z-40 flex flex-col items-center gap-3 group"
      style={{
        bottom: '24px',
        right: '24px',
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        touchAction: 'none'
      }}
    >
      <div 
        className="absolute -top-6 bg-slate-800/80 backdrop-blur text-white rounded-full px-2 py-1 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
      >
        <div 
          className="cursor-move p-0.5 hover:bg-white/20 rounded"
          onMouseDown={(e) => {
            isDragging.current = true;
            dragStart.current = { x: e.clientX, y: e.clientY };
            startOffset.current = { ...pos };
            e.preventDefault();
          }}
          onTouchStart={(e) => {
            isDragging.current = true;
            const touch = e.touches[0];
            dragStart.current = { x: touch.clientX, y: touch.clientY };
            startOffset.current = { ...pos };
          }}
        >
          <GripHorizontal size={14} />
        </div>
        <button 
          onClick={() => setIsVisible(false)} 
          className="p-0.5 hover:bg-red-500 hover:text-white rounded"
        >
          <X size={14} />
        </button>
      </div>
      {children}
    </div>
  );
}
