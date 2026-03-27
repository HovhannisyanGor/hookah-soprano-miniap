import { NextResponse } from "next/server";

import { updateTableAvailability } from "@/lib/store";
import type { TableAvailability } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ tableId: string }> }
) {
  const { tableId } = await context.params;
  const payload = (await request.json()) as { availability?: TableAvailability };

  if (!payload.availability) {
    return NextResponse.json({ error: "Статус стола не передан." }, { status: 400 });
  }

  const table = await updateTableAvailability(tableId, payload.availability);
  if (!table) {
    return NextResponse.json({ error: "Стол не найден." }, { status: 404 });
  }

  return NextResponse.json({ table });
}
