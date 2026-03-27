"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/format";

const items = [
  { href: "/", label: "Главная" },
  { href: "/booking", label: "Бронь" },
  { href: "/my-bookings", label: "Мои брони" },
  { href: "/admin", label: "Админ" }
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-4 left-1/2 z-40 w-[calc(100%-24px)] max-w-md -translate-x-1/2 px-3">
      <div className="grid grid-cols-4 rounded-[28px] border border-white/10 bg-zinc-950/90 p-2 shadow-lounge backdrop-blur-xl">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-2xl px-3 py-2 text-center text-[11px] font-medium tracking-[0.02em] transition",
                active
                  ? "bg-brass/20 text-cream"
                  : "text-zinc-400 hover:bg-white/6 hover:text-zinc-200"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
