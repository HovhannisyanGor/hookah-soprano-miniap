import type { HTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/format";

type SurfaceCardProps = PropsWithChildren<
  HTMLAttributes<HTMLDivElement> & {
    tone?: "default" | "accent";
  }
>;

export function SurfaceCard({
  children,
  className,
  tone = "default",
  ...props
}: SurfaceCardProps) {
  return (
    <div
      className={cn(
        "rounded-[28px] border p-5 shadow-lounge backdrop-blur-xl",
        tone === "accent"
          ? "border-brass/30 bg-gradient-to-br from-brass/12 via-white/6 to-white/4"
          : "border-white/8 bg-white/[0.045]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
