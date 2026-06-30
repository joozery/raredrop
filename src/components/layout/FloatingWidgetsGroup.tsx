"use client";
import { useState } from "react";
import { X, GripHorizontal } from "lucide-react";
import { motion, useDragControls } from "framer-motion";

export function FloatingWidgetsGroup({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(true);
  const controls = useDragControls();

  if (!isVisible) return null;

  return (
    <motion.div 
      drag
      dragControls={controls}
      dragListener={false}
      dragMomentum={false}
      className="fixed bottom-24 lg:bottom-6 right-4 lg:right-6 z-40 flex flex-col items-center gap-3 group"
    >
      <div 
        className="absolute -top-6 bg-white/90 backdrop-blur text-slate-500 rounded-full px-2 py-1 flex items-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity shadow-md border border-slate-200/50"
      >
        <div 
          className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-slate-100 hover:text-slate-700 rounded transition-colors"
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => controls.start(e)}
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
    </motion.div>
  );
}
