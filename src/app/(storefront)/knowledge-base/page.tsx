"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Gamepad2, Video, Play, X } from "lucide-react";

interface Topic {
  _id: string;
  title: string;
  youtubeUrl: string;
  coverImage?: string;
}

function getYoutubeId(url: string) {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([^&?/]+)/);
  return match ? match[1] : null;
}

export default function KnowledgeBasePage() {
  const router = useRouter();
  const [hero, setHero] = useState({
    label: "How to Play",
    image: "",
    link: "",
    title: "วิธีการเล่น",
    subtitle: "รวมวิดีโอสอนและเกร็ดความรู้ที่ควรรู้ก่อนเริ่มเล่น",
  });
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<Topic | null>(null);

  useEffect(() => {
    fetch("/api/public-settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) =>
        setHero((prev) => ({
          label: d.knowledge_hero_label || prev.label,
          image: d.knowledge_hero_image || prev.image,
          link: d.knowledge_hero_link || prev.link,
          title: d.knowledge_hero_title || prev.title,
          subtitle: d.knowledge_hero_subtitle || prev.subtitle,
        }))
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/knowledge-topics")
      .then((r) => r.json())
      .then((d) => setTopics(Array.isArray(d) ? d : []))
      .catch(() => setTopics([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Hero Banner */}
      <div
        className={`relative w-full h-40 md:h-64 bg-cover bg-center rounded-xl overflow-hidden border border-red-100 p-6 md:p-10 flex items-center shadow-sm ${
          hero.image ? "" : "bg-gradient-to-br from-red-50 to-orange-50"
        } ${hero.link ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
        style={hero.image ? { backgroundImage: `url('${hero.image}')` } : undefined}
        onClick={() => {
          if (!hero.link) return;
          if (hero.link.startsWith("http")) window.open(hero.link, "_blank");
          else router.push(hero.link);
        }}
      >
        {hero.image && <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />}
        <div className="relative z-10 max-w-lg">
          <div className={`flex items-center gap-2 mb-1.5 ${hero.image ? "text-white" : "text-primary"}`}>
            <Gamepad2 size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">{hero.label}</span>
          </div>
          <h1 className={`text-xl sm:text-2xl md:text-4xl font-extrabold leading-tight ${hero.image ? "text-white" : "text-gray-900"}`}>
            {hero.title}
          </h1>
          <p className={`mt-1.5 md:mt-3 text-xs sm:text-sm md:text-base leading-snug ${hero.image ? "text-white/80" : "text-gray-600"}`}>
            {hero.subtitle}
          </p>
        </div>
      </div>

      {/* Topics */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
        </div>
      ) : topics.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
          <Gamepad2 size={48} className="opacity-20" />
          <p className="font-bold">ยังไม่มีหัวข้อในวิธีการเล่น</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map((t) => {
            const videoId = getYoutubeId(t.youtubeUrl);
            // ใช้ภาพปกที่อัปโหลดก่อน ถ้าไม่มีค่อย fallback เป็น thumbnail ของ YouTube
            const thumbnail = t.coverImage || (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null);
            return (
              <button
                key={t._id}
                onClick={() => setActiveVideo(t)}
                className="group bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all text-left"
              >
                <div className="relative w-full aspect-video bg-gray-100 overflow-hidden">
                  {thumbnail ? (
                    <img src={thumbnail} alt={t.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video size={32} className="text-gray-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play size={20} className="text-red-600 fill-red-600 ml-0.5" />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-bold text-gray-900 text-sm line-clamp-2">{t.title}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Video Popup */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setActiveVideo(null)}
        >
          <div className="bg-black w-full max-w-3xl rounded-xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 bg-gray-900">
              <p className="text-white font-bold text-sm line-clamp-1">{activeVideo.title}</p>
              <button onClick={() => setActiveVideo(null)} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 shrink-0">
                <X size={18} />
              </button>
            </div>
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${getYoutubeId(activeVideo.youtubeUrl)}?autoplay=1`}
                title={activeVideo.title}
                className="w-full h-full"
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
