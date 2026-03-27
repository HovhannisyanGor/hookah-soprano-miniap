import { hookahSummary, reservationStatusLabel, reservationStatusTone } from "@/lib/format";
import type { ReservationView } from "@/lib/types";

import { Pill } from "@/components/ui/pill";
import { SurfaceCard } from "@/components/ui/surface-card";

export function ReservationCard({
  reservation,
  footer
}: {
  reservation: ReservationView;
  footer?: React.ReactNode;
}) {
  return (
    <SurfaceCard className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-cream">{reservation.venue.name}</p>
          <p className="mt-1 text-sm text-zinc-400">
            {reservation.date} · {reservation.time} · {reservation.table.name}
          </p>
        </div>
        <Pill className={reservationStatusTone(reservation.status)}>
          {reservationStatusLabel(reservation.status)}
        </Pill>
      </div>

      <div className="grid gap-3 rounded-3xl border border-white/8 bg-white/[0.03] p-4 text-sm text-zinc-300">
        <div className="flex items-center justify-between gap-4">
          <span>Гостей</span>
          <span className="font-medium text-cream">{reservation.guests}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span>Зона</span>
          <span className="font-medium text-cream">{reservation.table.zone}</span>
        </div>
        <div className="space-y-1">
          <span className="text-zinc-400">Кальян</span>
          <p className="font-medium text-cream">
            {hookahSummary({
              strength: reservation.hookahPreorder.strength,
              flavorCategory: reservation.hookahPreorder.flavorCategory,
              bowlType: reservation.hookahPreorder.bowlType,
              menuItems: reservation.menuItems
            })}
          </p>
        </div>
      </div>

      {footer}
    </SurfaceCard>
  );
}
