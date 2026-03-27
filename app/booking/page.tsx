import { BookingFlow } from "@/components/booking-flow";
import { getMiniAppCatalog } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function BookingPage() {
  const data = await getMiniAppCatalog();

  return <BookingFlow initialData={data} />;
}
