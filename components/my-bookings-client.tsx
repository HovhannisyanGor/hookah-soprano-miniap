"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getOrCreateDemoUser } from "@/lib/client-user";
import type { ReservationView } from "@/lib/types";

import { ReservationCard } from "@/components/reservations/reservation-card";
import { Button } from "@/components/ui/button";
import { SurfaceCard } from "@/components/ui/surface-card";
import { useToast } from "@/components/ui/toast-provider";

export function MyBookingsClient() {
  const [reservations, setReservations] = useState<ReservationView[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { pushToast } = useToast();

  useEffect(() => {
    const user = getOrCreateDemoUser();

    async function load() {
      setLoading(true);
      const response = await fetch(`/api/reservations?userId=${user.id}`, {
        cache: "no-store"
      });
      const payload = (await response.json()) as { reservations: ReservationView[] };
      setReservations(payload.reservations);
      setLoading(false);
    }

    void load();
  }, []);

  async function cancelReservation(reservationId: string) {
    setProcessingId(reservationId);

    const response = await fetch(`/api/reservations/${reservationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "canceled" })
    });

    if (!response.ok) {
      pushToast({
        title: "Не удалось отменить бронь",
        description: "Попробуйте ещё раз через пару секунд.",
        tone: "error"
      });
      setProcessingId(null);
      return;
    }

    const payload = (await response.json()) as { reservation: ReservationView };
    setReservations((current) =>
      current.map((item) =>
        item.id === payload.reservation.id ? payload.reservation : item
      )
    );
    setProcessingId(null);
    pushToast({
      title: "Бронь отменена",
      description: "В MVP это только изменение интерфейса без реального уведомления заведения.",
      tone: "success"
    });
  }

  if (loading) {
    return (
      <SurfaceCard className="text-sm text-zinc-300">
        Загружаю ваши брони...
      </SurfaceCard>
    );
  }

  if (!reservations.length) {
    return (
      <SurfaceCard tone="accent" className="space-y-4">
        <div>
          <p className="font-display text-3xl text-cream">Пока пусто</p>
          <p className="mt-2 text-sm text-zinc-300">
            Здесь появятся ваши брони после оформления. Для демо можно сразу пройти сценарий и
            создать новую заявку.
          </p>
        </div>
        <Link href="/booking" className="inline-flex">
          <Button>Открыть бронирование</Button>
        </Link>
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-4">
      {reservations.map((reservation) => (
        <ReservationCard
          key={reservation.id}
          reservation={reservation}
          footer={
            reservation.status === "new" || reservation.status === "confirmed" ? (
              <Button
                variant="ghost"
                className="w-full border border-rose-500/20 text-rose-200 hover:bg-rose-500/10"
                disabled={processingId === reservation.id}
                onClick={() => void cancelReservation(reservation.id)}
              >
                {processingId === reservation.id ? "Отменяю..." : "Отменить в демо"}
              </Button>
            ) : undefined
          }
        />
      ))}
    </div>
  );
}
