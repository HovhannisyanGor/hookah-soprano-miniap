import type {
  HookahFlavorCategory,
  HookahStrength,
  MenuItem,
  ReservationStatus,
  Table,
  TableAvailability
} from "@/lib/types";

const dateLabelFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  weekday: "short"
});

const compactDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit"
});

const moneyFormatter = new Intl.NumberFormat("ru-RU");

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function formatPrice(value: number) {
  return `${moneyFormatter.format(value)} ₽`;
}

export function formatDateLabel(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const target = new Date(year, month - 1, day, 12, 0, 0);
  return dateLabelFormatter.format(target);
}

export function formatCompactDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return compactDateFormatter.format(new Date(year, month - 1, day, 12, 0, 0));
}

export function reservationStatusLabel(status: ReservationStatus) {
  switch (status) {
    case "new":
      return "На подтверждении";
    case "confirmed":
      return "Подтверждена";
    case "canceled":
      return "Отменена";
    case "arrived":
      return "Гость пришёл";
    case "no_show":
      return "Не пришёл";
    default:
      return status;
  }
}

export function reservationStatusTone(status: ReservationStatus) {
  switch (status) {
    case "new":
      return "bg-amber-500/15 text-amber-200 border-amber-500/30";
    case "confirmed":
      return "bg-emerald-500/15 text-emerald-200 border-emerald-500/30";
    case "canceled":
      return "bg-rose-500/15 text-rose-200 border-rose-500/30";
    case "arrived":
      return "bg-sky-500/15 text-sky-200 border-sky-500/30";
    case "no_show":
      return "bg-zinc-500/15 text-zinc-200 border-zinc-500/30";
    default:
      return "bg-zinc-500/15 text-zinc-200 border-zinc-500/30";
  }
}

export function tableAvailabilityLabel(value: TableAvailability) {
  switch (value) {
    case "available":
      return "Доступен";
    case "maintenance":
      return "Техработы";
    case "vip_only":
      return "Только VIP";
    default:
      return value;
  }
}

export function tableAvailabilityTone(value: TableAvailability) {
  switch (value) {
    case "available":
      return "bg-emerald-500/12 text-emerald-200 border-emerald-500/25";
    case "maintenance":
      return "bg-rose-500/12 text-rose-200 border-rose-500/25";
    case "vip_only":
      return "bg-amber-500/12 text-amber-200 border-amber-500/25";
    default:
      return "bg-zinc-500/12 text-zinc-200 border-zinc-500/25";
  }
}

export function hookahStrengthLabel(value: HookahStrength) {
  return {
    light: "Лёгкий",
    medium: "Средний",
    strong: "Крепкий"
  }[value];
}

export function hookahFlavorLabel(value: HookahFlavorCategory) {
  return {
    fruity: "Фруктовый",
    dessert: "Десертный",
    citrus: "Цитрусовый",
    mint: "Мятный",
    spicy: "Пряный"
  }[value];
}

export function bowlTypeLabel(value: "classic" | "phunnel" | "fruit_bowl") {
  return {
    classic: "Классическая",
    phunnel: "Phunnel",
    fruit_bowl: "Фруктовая чаша"
  }[value];
}

export function hookahSummary(input: {
  strength: HookahStrength;
  flavorCategory: HookahFlavorCategory;
  bowlType: "classic" | "phunnel" | "fruit_bowl";
  menuItems: MenuItem[];
}) {
  const extras = input.menuItems.length
    ? input.menuItems.map((item) => item.name).join(", ")
    : "без доп. позиций";

  return `${hookahStrengthLabel(input.strength)} · ${hookahFlavorLabel(
    input.flavorCategory
  )} · ${bowlTypeLabel(input.bowlType)} · ${extras}`;
}

export function isPhoneValid(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 11;
}

export function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+7${digits}`;
  }
  if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
    return `+7${digits.slice(1)}`;
  }
  if (phone.startsWith("+") && digits.length >= 10) {
    return `+${digits}`;
  }
  return phone;
}

export function getUpcomingDates(count = 5) {
  return Array.from({ length: count }, (_, offset) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + offset);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    const value = `${year}-${month}-${day}`;
    return {
      value,
      label: formatDateLabel(value)
    };
  });
}
