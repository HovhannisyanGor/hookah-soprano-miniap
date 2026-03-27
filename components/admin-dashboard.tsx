"use client";

import { useEffect, useMemo, useState } from "react";

import {
  formatPrice,
  hookahSummary,
  reservationStatusLabel,
  reservationStatusTone,
  tableAvailabilityLabel,
  tableAvailabilityTone
} from "@/lib/format";
import type {
  AdminDashboardData,
  ReservationStatus,
  ReservationView,
  TableAvailability
} from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { SurfaceCard } from "@/components/ui/surface-card";
import { useToast } from "@/components/ui/toast-provider";

const reservationFilters: Array<{ value: ReservationStatus | "all"; label: string }> = [
  { value: "all", label: "Все" },
  { value: "new", label: "Новые" },
  { value: "confirmed", label: "Подтверждённые" },
  { value: "canceled", label: "Отменённые" },
  { value: "arrived", label: "Пришёл" },
  { value: "no_show", label: "Не пришёл" }
];

const availabilityOptions: TableAvailability[] = ["available", "vip_only", "maintenance"];

export function AdminDashboard({ initialData }: { initialData: AdminDashboardData }) {
  const { pushToast } = useToast();
  const [reservations, setReservations] = useState(initialData.reservations);
  const [tables, setTables] = useState(initialData.tables);
  const [filter, setFilter] = useState<ReservationStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialData.reservations[0]?.id ?? null
  );
  const [pendingStatus, setPendingStatus] = useState<ReservationStatus | null>(null);
  const [pendingTableId, setPendingTableId] = useState<string | null>(null);

  const filteredReservations = useMemo(
    () =>
      reservations.filter((item) => (filter === "all" ? true : item.status === filter)),
    [filter, reservations]
  );

  useEffect(() => {
    if (!filteredReservations.length) {
      setSelectedId(null);
      return;
    }

    if (!filteredReservations.some((item) => item.id === selectedId)) {
      setSelectedId(filteredReservations[0]?.id ?? null);
    }
  }, [filteredReservations, selectedId]);

  const selectedReservation =
    reservations.find((item) => item.id === selectedId) ?? filteredReservations[0] ?? null;

  async function setReservationStatus(status: ReservationStatus) {
    if (!selectedReservation) {
      return;
    }

    setPendingStatus(status);
    const response = await fetch(`/api/reservations/${selectedReservation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      setPendingStatus(null);
      pushToast({
        title: "Не удалось обновить статус",
        description: "Проверь локальный API и попробуй ещё раз.",
        tone: "error"
      });
      return;
    }

    const payload = (await response.json()) as { reservation: ReservationView };
    setReservations((current) =>
      current.map((item) =>
        item.id === payload.reservation.id ? payload.reservation : item
      )
    );
    setPendingStatus(null);
    pushToast({
      title: "Статус обновлён",
      description: `${payload.reservation.userName}: ${reservationStatusLabel(
        payload.reservation.status
      )}`,
      tone: "success"
    });
  }

  async function setTableAvailability(tableId: string, availability: TableAvailability) {
    setPendingTableId(tableId);

    const response = await fetch(`/api/tables/${tableId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ availability })
    });

    if (!response.ok) {
      setPendingTableId(null);
      pushToast({
        title: "Не удалось обновить стол",
        tone: "error"
      });
      return;
    }

    const payload = (await response.json()) as {
      table: AdminDashboardData["tables"][number];
    };
    setTables((current) =>
      current.map((table) => (table.id === payload.table.id ? payload.table : table))
    );
    setPendingTableId(null);
    pushToast({
      title: "Доступность стола изменена",
      description: `${payload.table.name}: ${tableAvailabilityLabel(payload.table.availability)}`,
      tone: "success"
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <SurfaceCard className="space-y-2">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">всего заявок</p>
          <p className="font-display text-4xl text-cream">{reservations.length}</p>
        </SurfaceCard>
        <SurfaceCard className="space-y-2">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">новые</p>
          <p className="font-display text-4xl text-cream">
            {reservations.filter((item) => item.status === "new").length}
          </p>
        </SurfaceCard>
      </div>

      <SurfaceCard className="space-y-4">
        <div>
          <p className="text-sm text-zinc-400">Фильтр бронирований</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {reservationFilters.map((item) => (
              <Button
                key={item.value}
                size="sm"
                variant={filter === item.value ? "primary" : "secondary"}
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </SurfaceCard>

      <div className="space-y-4">
        <SurfaceCard className="space-y-4">
          <div>
            <p className="text-sm text-zinc-400">Список заявок</p>
            <p className="mt-1 text-xs text-zinc-500">
              Нажмите карточку, чтобы открыть детали справа по потоку.
            </p>
          </div>
          <div className="space-y-3">
            {filteredReservations.length ? (
              filteredReservations.map((reservation) => (
                <button
                  key={reservation.id}
                  type="button"
                  onClick={() => setSelectedId(reservation.id)}
                  className={`w-full rounded-[24px] border p-4 text-left transition ${
                    selectedId === reservation.id
                      ? "border-brass/40 bg-brass/10"
                      : "border-white/8 bg-white/[0.03] hover:border-white/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-cream">{reservation.userName}</p>
                      <p className="mt-1 text-sm text-zinc-400">
                        {reservation.date} · {reservation.time} · {reservation.venue.name}
                      </p>
                    </div>
                    <Pill className={reservationStatusTone(reservation.status)}>
                      {reservationStatusLabel(reservation.status)}
                    </Pill>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4 text-sm text-zinc-400">
                По этому фильтру заявок пока нет.
              </div>
            )}
          </div>
        </SurfaceCard>

        {selectedReservation && (
          <SurfaceCard tone="accent" className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                  детали заявки
                </p>
                <h2 className="mt-2 font-display text-4xl text-cream">
                  {selectedReservation.userName}
                </h2>
              </div>
              <Pill className={reservationStatusTone(selectedReservation.status)}>
                {reservationStatusLabel(selectedReservation.status)}
              </Pill>
            </div>

            <div className="grid gap-3 rounded-[28px] border border-white/8 bg-black/15 p-4 text-sm text-zinc-300">
              <div className="flex items-center justify-between gap-3">
                <span>Телефон</span>
                <span className="font-medium text-cream">{selectedReservation.phone}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Филиал</span>
                <span className="font-medium text-cream">{selectedReservation.venue.name}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Стол</span>
                <span className="font-medium text-cream">
                  {selectedReservation.table.name} · {selectedReservation.table.zone}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Гостей</span>
                <span className="font-medium text-cream">{selectedReservation.guests}</span>
              </div>
              <div className="space-y-1">
                <span>Предзаказ кальяна</span>
                <p className="font-medium text-cream">
                  {hookahSummary({
                    strength: selectedReservation.hookahPreorder.strength,
                    flavorCategory: selectedReservation.hookahPreorder.flavorCategory,
                    bowlType: selectedReservation.hookahPreorder.bowlType,
                    menuItems: selectedReservation.menuItems
                  })}
                </p>
              </div>
              {selectedReservation.hookahPreorder.comment && (
                <div className="space-y-1">
                  <span>Комментарий</span>
                  <p className="font-medium text-cream">
                    {selectedReservation.hookahPreorder.comment}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {(["new", "confirmed", "canceled", "arrived", "no_show"] as ReservationStatus[]).map(
                (status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={selectedReservation.status === status ? "primary" : "secondary"}
                    disabled={pendingStatus === status}
                    onClick={() => void setReservationStatus(status)}
                  >
                    {pendingStatus === status
                      ? "Обновляю..."
                      : reservationStatusLabel(status)}
                  </Button>
                )
              )}
            </div>
          </SurfaceCard>
        )}
      </div>

      <SurfaceCard className="space-y-4">
        <div>
          <p className="text-sm text-zinc-400">Моковая доступность столов</p>
          <p className="mt-1 text-xs text-zinc-500">
            Управление доступностью столов без реального подключения к залу.
          </p>
        </div>
        <div className="space-y-3">
          {tables.map((table) => (
            <div
              key={table.id}
              className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-cream">
                    {table.name} · {table.zone}
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    {table.capacity} гостей · депозит от {formatPrice(table.minimumSpend)}
                  </p>
                </div>
                <Pill className={tableAvailabilityTone(table.availability)}>
                  {tableAvailabilityLabel(table.availability)}
                </Pill>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {availabilityOptions.map((availability) => (
                  <Button
                    key={availability}
                    size="sm"
                    variant={table.availability === availability ? "primary" : "secondary"}
                    disabled={pendingTableId === table.id}
                    onClick={() => void setTableAvailability(table.id, availability)}
                  >
                    {pendingTableId === table.id && table.availability !== availability
                      ? "..."
                      : tableAvailabilityLabel(availability)}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}
