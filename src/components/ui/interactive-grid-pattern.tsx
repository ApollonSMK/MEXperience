"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import React, { useId } from "react";

interface InteractiveGridPatternProps {
  width?: number;
  height?: number;
  squares?: [number, number];
  className?: string;
  squaresClassName?: string;
}

export function InteractiveGridPattern({
  width = 40,
  height = 40,
  squares = [24, 24],
  className,
  squaresClassName,
}: InteractiveGridPatternProps) {
  const r = 2;
  const p = width / 2 - r;
  const id = useId();

  const [h, w] = squares;
  const gridWidth = w * width;
  const gridHeight = h * height;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${gridWidth} ${gridHeight}`}
      className={cn("pointer-events-none absolute inset-0 -z-10", className)}
      aria-hidden="true"
    >
      <defs>
        <pattern
          id={id}
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M${p},${p} a${r},${r} 0 1 1 -${r * 2},0 a${r},${r} 0 1 1 ${
              r * 2
            },0`}
            className={cn(
              "fill-background-secondary transition-all duration-300",
              squaresClassName
            )}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

export default InteractiveGridPattern;
