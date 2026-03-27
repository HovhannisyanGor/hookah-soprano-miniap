import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { SurfaceCard } from "@/components/ui/surface-card";
import {
  formatDateLabel,
  hookahSummary,
  reservationStatusLabel,
  reservationStatusTone
} from "@/lib/format";
import { getReservationView } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ReservationConfirmationPage({
  params
}: {
  params: Promise<{ reservationId: string }>;
}) {
  const { reservationId } = await params;
  const reservation = await getReservationView(reservationId);

  if (!reservation) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <SurfaceCard tone="accent" className="space-y-4">
        <Pill className={reservationStatusTone(reservation.status)}>
          {reservationStatusLabel(reservation.status)}
        </Pill>
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">
            бронь оформлена
          </p>
          <h1 className="mt-2 font-display text-5xl leading-none text-cream">
            {reservation.userName}, всё готово
          </h1>
          <p className="mt-3 text-sm text-zinc-300">
            Для MVP заявка создаётся локально со статусом «На подтверждении». В боевой версии здесь
            будет реальная синхронизация с системой заведения.
          </p>
        </div>
      </SurfaceCard>

      <SurfaceCard className="space-y-4">
        <div className="grid gap-3 rounded-[28px] border border-white/8 bg-white/[0.03] p-4 text-sm text-zinc-300">
          <div className="flex items-center justify-between gap-3">
            <span>Филиал</span>
            <span className="font-medium text-cream">{reservation.venue.name}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>Дата и время</span>
            <span className="font-medium text-cream">
              {formatDateLabel(reservation.date)} · {reservation.time}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>Стол</span>
            <span className="font-medium text-cream">
              {reservation.table.name} · {reservation.table.zone}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>Контакт</span>
            <span className="font-medium text-cream">{reservation.phone}</span>
          </div>
          <div className="space-y-1">
            <span>Предзаказ кальяна</span>
            <p className="font-medium text-cream">
              {hookahSummary({
                strength: reservation.hookahPreorder.strength,
                flavorCategory: reservation.hookahPreorder.flavorCategory,
                bowlType: reservation.hookahPreorder.bowlType,
                menuItems: reservation.menuItems
              })}
            </p>
          </div>
          {reservation.hookahPreorder.comment && (
            <div className="space-y-1">
              <span>Комментарий</span>
              <p className="font-medium text-cream">
                {reservation.hookahPreorder.comment}
              </p>
            </div>
          )}
        </div>
      </SurfaceCard>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/booking">
          <Button block size="lg">
            Повторить бронь
          </Button>
        </Link>
        <Link href="/">
          <Button block size="lg" variant="secondary">
            Назад на главную
          </Button>
        </Link>
      </div>
    </div>
  );
}
