
"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface MousePosition {
  x: number;
  y: number;
}

export function Particles({
  className,
  quantity = 100,
  staticity = 50,
  ease = 50,
  size = 0.4,
  refresh = false,
  color,
  vx = 0,
  vy = 0,
}: {
  className?: string;
  quantity?: number;
  staticity?: number;
  ease?: number;
  size?: number;
  refresh?: boolean;
  color?: string;
  vx?: number;
  vy?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 });
  const mouse = useRef<MousePosition>({ x: 0, y: 0 });
  const canvasSize = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

  useEffect(() => {
    if (canvasRef.current) {
      context.current = canvasRef.current.getContext("2d");
    }
  }, []);

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const particles = useRef<any[]>([]);

  const resizeCanvas = () => {
    if (canvasContainerRef.current && canvasRef.current && context.current) {
      particles.current.length = 0;
      canvasSize.current.w = canvasContainerRef.current.offsetWidth;
      canvasSize.current.h = canvasContainerRef.current.offsetHeight;
      canvasRef.current.width = canvasSize.current.w * dpr;
      canvasRef.current.height = canvasSize.current.h * dpr;
      canvasRef.current.style.width = `${canvasSize.current.w}px`;
      canvasRef.current.style.height = `${canvasSize.current.h}px`;
      context.current.scale(dpr, dpr);
    }
  };

  const onMouseMove = (e: MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const { w, h } = canvasSize.current;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const inside = x < w && x > 0 && y < h && y > 0;
      if (inside) {
        mouse.current.x = x;
        mouse.current.y = y;
      }
    }
  };

  const onTouchMove = (e: TouchEvent) => {
    if ("touches" in e && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const { w, h } = canvasSize.current;
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;
      const inside = x < w && x > 0 && y < h && y > 0;
      if (inside) {
        mouse.current.x = x;
        mouse.current.y = y;
      }
    }
  };

  const onMouseLeave = () => {
    mouse.current.x = -9999;
    mouse.current.y = -9999;
  };

  class Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    start: number;
    life: number;

    constructor() {
      this.x = Math.random() * canvasSize.current.w;
      this.y =
        Math.random() * canvasSize.current.h +
        (vy < 0 ? canvasSize.current.h : 0);
      this.vx = vx;
      this.vy = vy;
      this.radius = 0.1 + Math.random() * size;
      this.start = performance.now();
      this.life = 500 + Math.random() * 2500;
    }
  }

  const init = () => {
    if (!isClient) return; // Don't run on server
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    if (!context.current) return;
    resizeCanvas();

    let FRAME = 0;

    const loop = () => {
      FRAME++;
      if (
        (FRAME % 2 !== 0 && !(vy || vx)) ||
        !context.current ||
        !canvasRef.current
      ) {
        requestAnimationFrame(loop);
        return;
      }
      context.current.clearRect(
        0,
        0,
        canvasSize.current.w,
        canvasSize.current.h,
      );

      setMousePosition(mouse.current);

      if (particles.current.length < quantity) {
        for (let i = 0; i < 5; i++) {
          particles.current.push(new Particle());
        }
      }

      for (const particle of particles.current) {
        const passed = performance.now() - particle.start;

        if (passed > particle.life) {
          particle.x = Math.random() * canvasSize.current.w;
          particle.y =
            Math.random() * canvasSize.current.h +
            (vy < 0 ? canvasSize.current.h : 0);
          particle.vx = vx;
          particle.vy = vy;
          particle.start = performance.now();
        }

        const distanceFactor =
          1 -
          Math.min(
            Math.hypot(
              particle.x - mouse.current.x,
              particle.y - mouse.current.y,
            ) /
              Math.min(
                canvasSize.current.w,
                canvasSize.current.h,
                (window.innerWidth + window.innerHeight) / 3,
              ),
            1,
          );

        particle.x +=
          particle.vx +
          (ease / 100) * (Math.random() - 0.5) +
          (mouse.current.x - particle.x) *
            ((1 - staticity / 100) * distanceFactor);
        particle.y +=
          particle.vy +
          (ease / 100) * (Math.random() - 0.5) +
          (mouse.current.y - particle.y) *
            ((1 - staticity / 100) * distanceFactor);

        context.current.fillStyle = color || "rgba(255, 255, 255, 0.5)";
        context.current.beginPath();
        context.current.arc(particle.x, particle.y, particle.radius, 0, 2 * Math.PI);
        context.current.fill();
      }

      requestAnimationFrame(loop);
    };

    loop();
  };

  useEffect(() => {
    init();
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("mouseleave", onMouseLeave);
    window.addEventListener("touchend", onMouseLeave);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("touchend", onMouseLeave);
    };
  }, [color, quantity, staticity, ease, size, refresh, vx, vy]);

  return (
    <div className={cn("pointer-events-none absolute inset-0 -z-10", className)} ref={canvasContainerRef}>
      <canvas ref={canvasRef}></canvas>
    </div>
  );
}
