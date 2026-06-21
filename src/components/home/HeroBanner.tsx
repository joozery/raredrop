import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
      className={`relative w-full h-48 md:h-80 bg-slate-900 rounded-xl overflow-hidden border border-red-100 shadow-sm ${currentSlide.link ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
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
      
      {/* Content Overlay */}
      <div className="relative z-10 w-full h-full p-6 md:p-10 flex items-center pointer-events-none">
        <div className="max-w-lg pointer-events-auto">
        <h1 className="text-base sm:text-xl md:text-4xl font-extrabold text-gray-900 leading-tight">
          {settings.title1}<br/>
          <span className="text-primary flex items-center gap-1.5 md:gap-2 mt-0.5 md:mt-2">
            {settings.title2} <span className="text-primary text-sm md:text-2xl">{settings.icon}</span>
          </span>
        </h1>
        <p className="text-gray-600 mt-1.5 md:mt-4 text-[11px] sm:text-sm md:text-base leading-snug">
          {settings.subtitle.split('\\n').map((line, i) => (
            <React.Fragment key={i}>
              {line}
              {i !== settings.subtitle.split('\\n').length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
        <div className="flex gap-2 md:gap-4 mt-3 md:mt-8">
          <Link href="/boxes" className="bg-primary text-white font-bold text-xs md:text-base py-2 px-4 md:py-3 md:px-8 rounded-lg shadow-lg shadow-primary/30 hover:bg-primary/90 transition-transform active:scale-95">
            {settings.button1}
          </Link>
          <Link href="/shop" className="bg-white text-gray-900 font-bold text-xs md:text-base py-2 px-4 md:py-3 md:px-8 rounded-lg border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors">
            {settings.button2}
          </Link>
        </div>
        </div>
      </div>

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
