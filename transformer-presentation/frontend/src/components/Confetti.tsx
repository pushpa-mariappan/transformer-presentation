import { useEffect, useRef } from "react";

const COLORS = ["#22d3ee", "#60a5fa", "#a78bfa", "#f472b6", "#facc15", "#34d399"];

/** Lightweight canvas confetti: bursts on mount, then gently keeps falling for `durationMs`. */
export function Confetti({ durationMs = 7000 }: { durationMs?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    type P = { x: number; y: number; vx: number; vy: number; r: number; rot: number; vr: number; color: string; w: number; h: number };
    const W = () => window.innerWidth;
    const H = () => window.innerHeight;
    const make = (burst: boolean): P => ({
      x: burst ? W() / 2 + (Math.random() - 0.5) * 120 : Math.random() * W(),
      y: burst ? H() * 0.35 : -20,
      vx: burst ? (Math.random() - 0.5) * 16 : (Math.random() - 0.5) * 2,
      vy: burst ? -Math.random() * 14 - 4 : Math.random() * 2 + 1,
      r: 0,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 10,
    });

    let parts: P[] = Array.from({ length: 220 }, () => make(true));
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - start;
      ctx.clearRect(0, 0, W(), H());
      if (elapsed < durationMs && parts.length < 400) parts.push(make(false), make(false));
      parts = parts.filter((p) => p.y < H() + 40);
      for (const p of parts) {
        p.vy += 0.25;
        p.vx *= 0.99;
        p.vy = Math.min(p.vy, 6);
        p.x += p.vx + Math.sin((now + p.w * 100) / 400) * 0.6;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.rot * 2)));
        ctx.restore();
      }
      if (parts.length || elapsed < durationMs) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [durationMs]);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-50 h-full w-full" aria-hidden />;
}
