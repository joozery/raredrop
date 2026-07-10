import React, { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';

export default function HeroBanner() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    image: "https://pub-ee29977ae9524b05b628923eee00188a.r2.dev/banner/cover/cover.png",
    link: "",
    title1: "เปิดลุ้นของสะสมสุดพิเศษ",
    title2: "จากทั่วโลก",
    subtitle: "กล่องสุ่มหลากหลาย สินค้าพรีเมียม\\nลุ้นได้จริง ส่งถึงมือคุณ",
    icon: "✦",
    button1: "เปิดกล่องเลย",
    button2: "ดูทั้งหมด",
    carousel: [] as { image: string, link: string }[]
  });
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (settings.carousel.length > 1) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % settings.carousel.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [settings.carousel.length]);

  useEffect(() => {
    fetch("/api/public-settings", { cache: "no-store" })
      .then(res => res.json())
      .then(data => {
        setSettings(prev => ({
          image: data.hero_banner_image || prev.image,
          link: data.hero_banner_link || prev.link,
          title1: data.hero_banner_title1 || prev.title1,
          title2: data.hero_banner_title2 || prev.title2,
          subtitle: data.hero_banner_subtitle || prev.subtitle,
          icon: data.hero_banner_icon || prev.icon,
          button1: data.hero_banner_button1 || prev.button1,
          button2: data.hero_banner_button2 || prev.button2,
          carousel: (data.hero_banner_carousel && Array.isArray(data.hero_banner_carousel) && data.hero_banner_carousel.length > 0)
            ? data.hero_banner_carousel
            : [{ image: data.hero_banner_image || prev.image, link: data.hero_banner_link || prev.link }]
        }));
      })
      .catch(() => {});
  }, []);

  const currentSlide = settings.carousel[currentIndex] || { image: settings.image, link: settings.link };

  return (
    <div 
      className={`relative w-full h-48 md:h-80 bg-slate-900 rounded-xl overflow-hidden border border-red-100 shadow-sm${currentSlide.link ? ' cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={(e) => {
        if (currentSlide.link && (e.target as HTMLElement).tagName !== 'A' && !(e.target as HTMLElement).closest('a') && !(e.target as HTMLElement).closest('.nav-dot')) {
          if (currentSlide.link.startsWith('http')) {
            window.open(currentSlide.link, '_blank');
          } else {
            router.push(currentSlide.link);
          }
        }
      }}
    >
      {/* Background Images Slider */}
      {settings.carousel.map((slide, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1000 ${idx === currentIndex ? 'opacity-100' : 'opacity-0'}`}
          style={{ backgroundImage: `url('${slide.image}')` }}
        />
      ))}
      
      {/* Dots Indicator */}
      {settings.carousel.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 z-20 flex items-center justify-center gap-2">
          {settings.carousel.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
              className={`nav-dot w-2 h-2 rounded-full transition-all duration-300 ${idx === currentIndex ? 'bg-red-600 w-6' : 'bg-white/60 hover:bg-white'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
