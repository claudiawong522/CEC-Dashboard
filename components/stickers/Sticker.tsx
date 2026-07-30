"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type FloatVariant = "float1" | "float2" | "float3" | "none";

/**
 * Wraps a sticker shape with the kit's two motions: ambient drift (outer,
 * continuous) and a one-shot 620ms pop on click (inner, via key remount so
 * the animation replays every click). Each instance owns both — clicking one
 * sticker never triggers another. See design/BRAND_KIT.md § Sticker rules.
 */
export function Sticker({
  children,
  className,
  wrapperClassName,
  style,
  floatVariant = "float1",
  floatDuration = "13s",
  floatDelay,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  wrapperClassName?: string;
  style?: React.CSSProperties;
  floatVariant?: FloatVariant;
  floatDuration?: string;
  floatDelay?: string;
  onClick?: () => void;
}) {
  const [pops, setPops] = useState(0);

  return (
    <div
      className={wrapperClassName}
      style={{
        animation:
          floatVariant === "none"
            ? undefined
            : `${floatVariant} ${floatDuration} ease-in-out infinite`,
        animationDelay: floatDelay,
        ...style,
      }}
    >
      <div
        key={pops}
        onClick={() => {
          setPops((p) => p + 1);
          onClick?.();
        }}
        className={cn(
          "cursor-pointer pointer-events-auto",
          pops > 0 && "animate-pop",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
