"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { BorderBeam } from "./border-beam";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto ",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "row-span-1 rounded-xl group/bento hover:shadow-xl transition-shadow duration-200 shadow-input dark:shadow-none p-4 dark:bg-black dark:border-white/[0.2] bg-white border border-gray-200 justify-between flex flex-col space-y-4 relative overflow-hidden",
        className
      )}
    >
      {/* Efeito BorderBeam animado contínuo */}
      <BorderBeam 
        size={100} 
        duration={8} 
        delay={0}
        colorFrom="#3b82f6"
        colorTo="#9c40ff"
      />
      
      {/* Conteúdo do card */}
      <div className="relative z-10">
        {header}
        <div className="group-hover/bento:translate-x-2 transition duration-200">
          {icon}
          <div className="font-headline font-bold text-neutral-700 dark:text-neutral-200 mb-2 mt-2">
            {title}
          </div>
          <div className="font-sans font-normal text-neutral-700 text-xs dark:text-neutral-300">
            {description}
          </div>
        </div>
      </div>
    </motion.div>
  );
};