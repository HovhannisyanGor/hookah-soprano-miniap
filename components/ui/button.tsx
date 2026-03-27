"use client";

import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/format";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg";
    block?: boolean;
  }
>;

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-gradient-to-r from-brass to-amber-500 text-ink shadow-lounge hover:from-amber-500 hover:to-amber-400",
  secondary:
    "border border-white/10 bg-white/6 text-cream hover:border-brass/50 hover:bg-white/10",
  ghost: "border border-transparent bg-transparent text-cream hover:bg-white/6",
  danger: "bg-rose-500/90 text-white hover:bg-rose-500"
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-5 text-sm",
  lg: "h-14 px-6 text-base"
};

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  block = false,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-2xl font-medium tracking-[0.01em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/60 disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        block && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
