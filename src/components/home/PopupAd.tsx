"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

const DISMISS_KEY = "popup_dismissed";

export function PopupAd() {
  const [image, setImage] = useState("");
  const [link, setLink] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/public-settings")
      .then((r) => r.json())
      .then((d) => {
        const enabled = d.popup_enabled === true || d.popup_enabled === "true";
        if (!enabled || !d.popup_image) return;

        const hours = Number(d.popup_dismiss_hours ?? 24);
        setImage(d.popup_image);
        setLink(d.popup_link || "");

        const raw = localStorage.getItem(DISMISS_KEY);
        const dismissed = raw ? JSON.parse(raw) : null;
        const sameImage = dismissed?.image === d.popup_image;

        // ยังไม่เคยปิด หรือเปลี่ยนรูปใหม่ -> โชว์เลย
        // ปิดรูปเดิมไปแล้ว -> โชว์ใหม่ก็ต่อเมื่อครบจำนวนชั่วโมงที่กำหนด (hours <= 0 = ปิดแล้วไม่โชว์อีกเลย)
        const shouldShow = !sameImage || (hours > 0 && Date.now() - dismissed.dismissedAt >= hours * 3600000);
        if (shouldShow) setOpen(true);
      })
      .catch(() => {});
  }, []);

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem(DISMISS_KEY, JSON.stringify({ image, dismissedAt: Date.now() }));
  };

  const handleImageClick = () => {
    if (!link) return;
    handleClose();
    if (link.startsWith("http")) window.open(link, "_blank");
    else window.location.href = link;
  };

  if (!open || !image) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 transition-opacity"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 fade-in duration-300">
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 z-10 text-white bg-black/40 hover:bg-black/60 p-1.5 rounded-full transition-colors"
        >
          <X size={18} />
        </button>
        <img
          src={image}
          alt="Popup"
          onClick={handleImageClick}
          className={`w-full h-auto block ${link ? "cursor-pointer" : ""}`}
        />
      </div>
    </div>
  );
}
