"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";

interface LightRaysProps {
  count?: number;
  color?: string;
  blur?: number;
  opacity?: number;
  speed?: number;
  length?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

const LightRays: React.FC<LightRaysProps> = ({
  count = 7,
  color = "rgba(160, 210, 255, 0.2)",
  blur = 36,
  opacity = 0.65,
  speed = 14,
  length = "70vh",
  className,
  style,
}) => {
  const rays = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const duration = Math.random() * speed + speed / 2;
      const delay = Math.random() * -speed;
      const transform = `rotate(${
        i * (360 / count)
      }deg) translateY(-50%)`;
      const rayStyle = {
        background: `linear-gradient(to bottom, transparent, ${color}, transparent)`,
        animation: `light-ray-anim ${duration}s linear ${delay}s infinite`,
        transform,
      };
      return <div key={i} className="light-ray" style={rayStyle} />;
    });
  }, [count, color, speed]);

  const css = `
    @keyframes light-ray-anim {
      0% {
        transform: rotate(${
          Math.random() * 360
        }deg) translateY(-50%) scaleY(1);
        opacity: ${Math.random() * 0.2};
      }
      50% {
        opacity: ${opacity};
      }
      100% {
        transform: rotate(${
          Math.random() * 360 + 360
        }deg) translateY(-50%) scaleY(1.2);
        opacity: 0;
      }
    }
  `;

  return (
    <>
      <style>{css}</style>
      <div
        className={cn(
          "pointer-events-none absolute inset-0 flex items-center justify-center",
          className,
        )}
        style={style}
      >
        <div
          className="relative h-full w-full"
          style={
            {
              "--blur": `${blur}px`,
              "--ray-height": length,
            } as React.CSSProperties
          }
        >
          <div className="absolute inset-0 size-full [filter:blur(var(--blur))]">
            {rays}
          </div>
        </div>
      </div>
    </>
  );
};

export { LightRays };
