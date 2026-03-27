import type { Reservation, ReservationStatus, Table } from "@/lib/types";

const ACTIVE_BOOKING_STATUSES: ReservationStatus[] = ["new", "confirmed", "arrived"];

export function isReservationActive(status: ReservationStatus) {
  return ACTIVE_BOOKING_STATUSES.includes(status);
}

export function getSelectableTablesForSlot(input: {
  venueId: string;
  date: string;
  time: string;
  tables: Table[];
  reservations: Reservation[];
}) {
  return input.tables.filter((table) => {
    if (table.venueId !== input.venueId) {
      return false;
    }

    if (table.availability !== "available") {
      return false;
    }

    return !input.reservations.some(
      (reservation) =>
        reservation.tableId === table.id &&
        reservation.date === input.date &&
        reservation.time === input.time &&
        isReservationActive(reservation.status)
    );
  });
}
