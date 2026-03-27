import type { Metadata } from "next";

import { BottomNav } from "@/components/layout/bottom-nav";
import { TelegramMiniAppProvider } from "@/components/telegram/telegram-miniapp-provider";
import { ToastProvider } from "@/components/ui/toast-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "Hookah Soprano Mini App MVP",
  description: "Демо-прототип Telegram Mini App для бронирований в кальянной."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <TelegramMiniAppProvider />
        <ToastProvider>
          <div className="mx-auto min-h-screen max-w-[430px] px-4 pb-28 pt-4">
            <header className="sticky top-4 z-30 mb-4">
              <div className="rounded-full border border-white/10 bg-zinc-950/75 px-4 py-3 shadow-lounge backdrop-blur-xl">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-display text-2xl leading-none text-cream">
                      Hookah Soprano
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.28em] text-zinc-400">
                      демо-прототип
                    </p>
                  </div>
                  <div className="rounded-full border border-brass/20 bg-brass/10 px-3 py-1 text-[11px] text-amber-200">
                    локальный MVP
                  </div>
                </div>
              </div>
            </header>
            {children}
          </div>
          <BottomNav />
        </ToastProvider>
      </body>
    </html>
  );
}
