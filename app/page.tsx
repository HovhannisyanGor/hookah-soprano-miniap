import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { SurfaceCard } from "@/components/ui/surface-card";
import { getAdminDashboardData } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const dashboard = await getAdminDashboardData();

  return (
    <div className="space-y-5">
      <SurfaceCard tone="accent" className="space-y-5 overflow-hidden">
        <div className="flex items-center justify-between gap-3">
          <Pill className="border-brass/20 bg-brass/10 text-amber-200">
            демо Mini App
          </Pill>
          <Pill className="border-white/10 bg-white/5 text-zinc-300">
            премиальный тёмный стиль
          </Pill>
        </div>

        <div className="space-y-3">
          <h1 className="max-w-xs font-display text-6xl leading-none text-cream">
            Брони и кальян в одном касании
          </h1>
          <p className="max-w-sm text-sm text-zinc-300">
            Демо-прототип для кальянного лаунжа: бронь стола, предзаказ кальяна, статус заявки
            и административное управление без внешних интеграций.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-[24px] border border-white/8 bg-white/[0.05] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">заявок</p>
            <p className="mt-3 font-display text-4xl text-cream">{dashboard.stats.total}</p>
          </div>
          <div className="rounded-[24px] border border-white/8 bg-white/[0.05] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">новые</p>
            <p className="mt-3 font-display text-4xl text-cream">{dashboard.stats.newCount}</p>
          </div>
          <div className="rounded-[24px] border border-white/8 bg-white/[0.05] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">сегодня</p>
            <p className="mt-3 font-display text-4xl text-cream">{dashboard.stats.todayCount}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/booking">
            <Button block size="lg">
              Забронировать стол
            </Button>
          </Link>
          <Link href="/admin">
            <Button block size="lg" variant="secondary">
              Открыть админку
            </Button>
          </Link>
        </div>
      </SurfaceCard>

      <SurfaceCard className="space-y-4">
        <div>
          <p className="text-sm text-zinc-400">Филиалы</p>
          <h2 className="mt-2 font-display text-4xl text-cream">Выбери настроение вечера</h2>
        </div>

        <div className="space-y-3">
          {dashboard.venues.map((venue) => (
            <div
              key={venue.id}
              className="rounded-[24px] border border-white/8 bg-white/[0.035] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-cream">{venue.name}</p>
                  <p className="mt-1 text-sm text-zinc-400">{venue.address}</p>
                </div>
                <Pill className="border-white/10 bg-white/5 text-zinc-300">
                  {venue.subway}
                </Pill>
              </div>
              <p className="mt-3 text-sm text-zinc-300">{venue.description}</p>
            </div>
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard className="space-y-4">
        <div>
          <p className="text-sm text-zinc-400">Что уже есть в MVP</p>
          <h2 className="mt-2 font-display text-4xl text-cream">Можно кликать сразу</h2>
        </div>
        <div className="grid gap-3 text-sm text-zinc-300">
          <div className="rounded-[24px] border border-white/8 bg-white/[0.035] p-4">
            1. Welcome screen и CTA на бронь
          </div>
          <div className="rounded-[24px] border border-white/8 bg-white/[0.035] p-4">
            2. Пошаговая бронь с предзаказом кальяна
          </div>
          <div className="rounded-[24px] border border-white/8 bg-white/[0.035] p-4">
            3. Мои брони и отмена в интерфейсе
          </div>
          <div className="rounded-[24px] border border-white/8 bg-white/[0.035] p-4">
            4. Админка со статусами и моковой доступностью столов
          </div>
        </div>
      </SurfaceCard>
    </div>
  );
}
