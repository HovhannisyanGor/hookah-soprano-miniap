import { NextResponse } from "next/server";

import { updateReservationStatus } from "@/lib/store";
import type { ReservationStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ reservationId: string }> }
) {
  const { reservationId } = await context.params;
  const payload = (await request.json()) as { status?: ReservationStatus };

  if (!payload.status) {
    return NextResponse.json({ error: "Статус не передан." }, { status: 400 });
  }

  const reservation = await updateReservationStatus(reservationId, payload.status);
  if (!reservation) {
    return NextResponse.json({ error: "Бронь не найдена." }, { status: 404 });
  }

  return NextResponse.json({ reservation });
}
