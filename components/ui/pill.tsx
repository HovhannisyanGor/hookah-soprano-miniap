import type { PropsWithChildren } from "react";

import { cn } from "@/lib/format";

export function Pill({
  children,
  className
}: PropsWithChildren<{ className?: string }>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium tracking-[0.02em]",
        className
      )}
    >
      {children}
    </span>
  );
}
