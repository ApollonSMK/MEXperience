"use client";

import React, { useState, useEffect } from "react";

import { cn } from "@/lib/utils";

/**
 * InteractiveGridPattern is a component that renders a grid pattern with interactive squares.
 *
 * @param width - The width of each square.
 * @param height - The height of each square.
 * @param squares - The number of squares in the grid. The first element is the number of horizontal squares, and the second element is the number of vertical squares.
 * @param className - The class name of the grid.
 * @param squaresClassName - The class name of the squares.
 */
interface InteractiveGridPatternProps extends React.SVGProps<SVGSVGElement> {
  width?: number;
  height?: number;
  squares?: [number, number]; // [horizontal, vertical]
  className?: string;
  squaresClassName?: string;
}

/**
 * The InteractiveGridPattern component.
 *
 * @see InteractiveGridPatternProps for the props interface.
 * @returns A React component.
 */
export function InteractiveGridPattern({
  width = 40,
  height = 40,
  squares: initialSquares = [24, 24],
  className,
  squaresClassName,
  ...props
}: InteractiveGridPatternProps) {
  const [hoveredSquare, setHoveredSquare] = useState<number | null>(null);
  const [squares, setSquares] = useState(initialSquares);
  const [activeSquares, setActiveSquares] = useState<number[]>([]);

  useEffect(() => {
    const calculateSquares = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const horizontal = Math.ceil(screenWidth / width);
      const vertical = Math.ceil(screenHeight / height);
      setSquares([horizontal, vertical]);
    };

    calculateSquares();
    window.addEventListener('resize', calculateSquares);

    const interval = setInterval(() => {
      const newActiveSquares = [];
      for (let i = 0; i < 5; i++) {
        newActiveSquares.push(Math.floor(Math.random() * (squares[0] * squares[1]))
        );
      }
      setActiveSquares(newActiveSquares);
    }, 2000);


    return () => {
      window.removeEventListener('resize', calculateSquares);
      clearInterval(interval);
    };
  }, [width, height, squares]);

  const [horizontal, vertical] = squares;

  return (
    <svg
      className={cn(
        "absolute inset-0 h-full w-full",
        className
      )}
      {...props}
    >
      {Array.from({ length: horizontal * vertical }).map((_, index) => {
        const x = (index % horizontal) * width;
        const y = Math.floor(index / horizontal) * height;
        const isHovered = hoveredSquare === index;
        const isActive = activeSquares.includes(index);
        return (
          <rect
            key={index}
            x={x}
            y={y}
            width={width}
            height={height}
            className={cn(
              "stroke-gray-400/30 transition-all duration-300 ease-in-out",
              isHovered ? "fill-gray-300/40" : "fill-transparent",
              isActive && !isHovered && "fill-gray-300/20 animate-pulse",
              squaresClassName
            )}
            onMouseEnter={() => setHoveredSquare(index)}
            onMouseLeave={() => setHoveredSquare(null)}
          />
        );
      })}
    </svg>
  );
}

export default InteractiveGridPattern;
