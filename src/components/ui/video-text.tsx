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
    <h1
      ref={ref}
      className={cn(
        "relative bg-cover bg-center text-center text-transparent bg-clip-text",
        className
      )}
      style={{
        backgroundImage:
          "url(data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=)",
      }}
      {...props}
    >
      <video
        src={src}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover -z-10"
      />
      {children}
    </h1>
  );
});

VideoText.displayName = "VideoText";