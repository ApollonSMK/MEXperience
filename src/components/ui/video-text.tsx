"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface VideoTextProps extends React.HTMLAttributes<HTMLHeadingElement> {
  src: string;
  children: React.ReactNode;
}

export const VideoText = React.forwardRef<
  HTMLHeadingElement,
  VideoTextProps
>(({ src, children, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("relative w-full overflow-hidden", className)}
      {...props}
    >
      <video
        className="absolute left-1/2 top-1/2 -z-10 w-auto min-w-full min-h-full max-w-none -translate-x-1/2 -translate-y-1/2"
        autoPlay
        loop
        muted
        playsInline
        src={src}
      ></video>
      <h1 className="bg-black text-center text-transparent mix-blend-multiply [background-clip:text] [-webkit-background-clip:text]">
        {children}
      </h1>
    </div>
  );
});

VideoText.displayName = "VideoText";
