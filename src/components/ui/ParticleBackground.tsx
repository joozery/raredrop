"use client";

import React, { useEffect, useRef } from "react";

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
    let height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;

    const particles: { x: number; y: number; z: number; size: number; color: string; speed: number }[] = [];
    const numParticles = 300;
    const fov = 350;
    const colors = ["#ff0055", "#00d2ff", "#ffcc00", "#7000ff", "#00ff88"];

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: (Math.random() - 0.5) * 3000,
        y: (Math.random() - 0.5) * 3000,
        z: Math.random() * 2000,
        size: Math.random() * 2.5 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 4 + 1
      });
    }

    const render = () => {
      // Create motion blur effect over white background
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)"; 
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      particles.forEach((p) => {
        p.z -= p.speed;
        if (p.z <= 0) {
          p.x = (Math.random() - 0.5) * 3000;
          p.y = (Math.random() - 0.5) * 3000;
          p.z = 2000;
        }

        const scale = fov / p.z;
        const x2d = p.x * scale + cx;
        const y2d = p.y * scale + cy;

        // Draw particle if visible
        if (x2d >= 0 && x2d <= width && y2d >= 0 && y2d <= height) {
          const alpha = Math.min(1, (2000 - p.z) / 1000); // Fade in from distance
          ctx.beginPath();
          ctx.arc(x2d, y2d, p.size * scale, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = alpha;
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    const handleResize = () => {
      if (canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        height = canvas.height = canvas.parentElement.clientHeight;
      }
    };

    window.addEventListener("resize", handleResize);
    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 rounded-3xl opacity-80"
    />
  );
}
