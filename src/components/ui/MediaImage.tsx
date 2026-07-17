"use client";

// รูป/วิดีโอจากหลังบ้านใช้ field เดียวกัน — ถ้า URL เป็นวิดีโอให้เล่นแบบ autoplay loop แทน <img>
const isVideoUrl = (url: string) => /\.(mp4|webm|mov)(\?.*)?$/i.test(url);

interface Props {
  src: string;
  alt?: string;
  className?: string;
  fallbackSrc?: string;
}

export function MediaImage({ src, alt = "", className, fallbackSrc }: Props) {
  if (isVideoUrl(src)) {
    return (
      <video
        src={src}
        className={className}
        autoPlay
        loop
        muted
        playsInline
      />
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={fallbackSrc ? (e) => { (e.target as HTMLImageElement).src = fallbackSrc; } : undefined}
    />
  );
}
