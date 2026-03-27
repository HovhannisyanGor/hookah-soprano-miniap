import { NextResponse } from "next/server";

import { createReservation, getReservationViews } from "@/lib/store";
import type { CreateReservationInput } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") ?? undefined;
  const reservations = await getReservationViews(userId);

  return NextResponse.json({ reservations });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CreateReservationInput;
    const reservation = await createReservation(payload);
    return NextResponse.json({ reservation }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Не удалось создать бронь."
      },
      { status: 400 }
    );
  }
}
