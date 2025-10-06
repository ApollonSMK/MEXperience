"use client";

import { cn } from "@/lib/utils";
import React, { CSSProperties } from "react";

interface ShineBorderProps {
  children: React.ReactNode;
  className?: string;
  /**
   * The color of the border.
   * @default "hsl(var(--primary))"
   * @example "hsl(var(--primary))" | "#fff" | "rgb(255, 255, 255)"
   */
  color?: string | string[];
  /**
   * The duration of the animation.
   * @default "7s"
   * @example "5s"
   */
  duration?: string;
  /**
   * The width of the border.
   * @default "2px"
   * @example "1px"
   */
  borderWidth?: string;
}
export default function ShineBorder({
  children,
  className,
  color = "hsl(var(--primary))",
  duration = "7s",
  borderWidth = "2px",
}: ShineBorderProps) {
  return (
    <div
      style={
        {
          "--border-width": borderWidth,
          "--shine-color": color,
          "--shine-duration": duration,
        } as CSSProperties
      }
      className={cn(
        "relative rounded-lg",
        "bg-white dark:bg-black",
        "before:absolute before:inset-0 before:-z-10",
        "before:h-[calc(100%+var(--border-width)*2)] before:w-[calc(100%+var(--border-width)*2)]",
        "before:-translate-x-[var(--border-width)] before:-translate-y-[var(--border-width)]",
        "before:rounded-[calc(var(--radius)+var(--border-width))]",
        "before:bg-shine before:[background-size:200%_100%]",
        "before:animate-shine",
        className
      )}
    >
      {children}
    </div>
  );
}
