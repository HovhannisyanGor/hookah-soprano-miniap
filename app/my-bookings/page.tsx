import { MyBookingsClient } from "@/components/my-bookings-client";
import { SurfaceCard } from "@/components/ui/surface-card";

export default function MyBookingsPage() {
  return (
    <div className="space-y-5">
      <SurfaceCard tone="accent" className="space-y-3">
        <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">мой кабинет</p>
        <h1 className="font-display text-5xl leading-none text-cream">Мои брони</h1>
        <p className="text-sm text-zinc-300">
          Здесь выводятся заявки демо-пользователя из локальной базы MVP.
        </p>
      </SurfaceCard>
      <MyBookingsClient />
    </div>
  );
}
