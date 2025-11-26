"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface AnimatedProgressProps {
  value: number;
  max: number;
  className?: string;
  showPercentage?: boolean;
}

export function AnimatedProgress({ 
  value, 
  max, 
  className,
  showPercentage = true 
}: AnimatedProgressProps) {
  const [displayValue, setDisplayValue] = useState(0);
  
  // Calculando minutos usados em vez de disponíveis
  const usedMinutes = max > 0 ? max - value : 0;
  const percentage = max > 0 ? (usedMinutes / max) * 100 : 0;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayValue(usedMinutes);
    }, 100);
    return () => clearTimeout(timer);
  }, [usedMinutes]);

  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-200/20 dark:bg-gray-800/20 backdrop-blur-sm">
        {/* Efeito de brilho/neon */}
        <div 
          className="absolute inset-0 h-full rounded-full bg-gradient-to-r from-orange-400 via-red-500 to-orange-400 opacity-75 blur-sm animate-pulse"
          style={{
            width: `${percentage}%`,
            transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        
        {/* Barra principal */}
        <div 
          className="relative h-full rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 shadow-[0_0_20px_rgba(251,146,60,0.5)]"
          style={{
            width: `${percentage}%`,
            transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Efeito de brilho interno */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
        
        {/* Partículas brilhantes */}
        {percentage > 0 && (
          <div 
            className="absolute top-1/2 -translate-y-1/2 right-0 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)] animate-pulse"
            style={{
              boxShadow: '0 0 20px rgba(255, 255, 255, 0.8), 0 0 40px rgba(251, 146, 60, 0.6)',
            }}
          />
        )}
      </div>
      
      {showPercentage && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {displayValue} de {max} min usados
          </span>
          <span className="font-semibold text-orange-600 dark:text-orange-400">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
}