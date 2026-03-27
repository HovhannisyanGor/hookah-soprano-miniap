import type { MenuItem, Table, Venue } from "@/lib/types";

export const venues: Venue[] = [
  {
    id: "patriki",
    name: "Hookah Soprano Patriki",
    address: "Малая Бронная, 24",
    subway: "м. Тверская",
    description:
      "Камерный лаунж с мягким светом, редкими вкусами и спокойной вечерней посадкой.",
    shortTag: "Тихая посадка и фирменные миксы"
  },
  {
    id: "river",
    name: "Hookah Soprano Riverside",
    address: "Пресненская набережная, 12",
    subway: "м. Деловой центр",
    description:
      "Панорама на город, длинные диваны и формат для компаний с pre-party настроением.",
    shortTag: "Панорама и большие компании"
  },
  {
    id: "loft",
    name: "Hookah Soprano Loft",
    address: "Лесная, 38",
    subway: "м. Белорусская",
    description:
      "Фактурный лофт с приватной комнатой, чайной картой и более плотными чашами.",
    shortTag: "Лофт и приватные зоны"
  }
];

export const tables: Table[] = [
  {
    id: "tbl-patriki-bar-1",
    venueId: "patriki",
    name: "Стол A1",
    zone: "Барная линия",
    capacity: 2,
    minimumSpend: 3500,
    description: "Для камерного визита и быстрого вечера.",
    availability: "available"
  },
  {
    id: "tbl-patriki-window-1",
    venueId: "patriki",
    name: "Стол A2",
    zone: "У окна",
    capacity: 3,
    minimumSpend: 5000,
    description: "Тихий угол с мягким светом и видом на Патрики.",
    availability: "available"
  },
  {
    id: "tbl-patriki-lounge-1",
    venueId: "patriki",
    name: "Стол A3",
    zone: "Основной зал",
    capacity: 4,
    minimumSpend: 6500,
    description: "Универсальная посадка для пары или небольшой компании.",
    availability: "available"
  },
  {
    id: "tbl-patriki-private-1",
    venueId: "patriki",
    name: "Стол A4",
    zone: "Полу-приват",
    capacity: 6,
    minimumSpend: 9000,
    description: "Больше дистанции и удобный диван для встреч.",
    availability: "available"
  },
  {
    id: "tbl-river-terrace-1",
    venueId: "river",
    name: "Стол R1",
    zone: "Терраса",
    capacity: 4,
    minimumSpend: 7000,
    description: "Панорамная терраса для вечерней брони с видом на закат.",
    availability: "available"
  },
  {
    id: "tbl-river-terrace-2",
    venueId: "river",
    name: "Стол R2",
    zone: "Терраса",
    capacity: 6,
    minimumSpend: 9800,
    description: "Больше места для компании и коктейльного тейбла.",
    availability: "available"
  },
  {
    id: "tbl-river-sofa-1",
    venueId: "river",
    name: "Стол R3",
    zone: "Панорамный диван",
    capacity: 5,
    minimumSpend: 8500,
    description: "Комфортная мягкая зона с видом на Сити.",
    availability: "available"
  },
  {
    id: "tbl-loft-stage-1",
    venueId: "loft",
    name: "Стол L1",
    zone: "Лаунж-остров",
    capacity: 4,
    minimumSpend: 6200,
    description: "Глубокий диван и плотная музыка ближе к сцене.",
    availability: "available"
  },
  {
    id: "tbl-loft-stage-2",
    venueId: "loft",
    name: "Стол L2",
    zone: "Лаунж-остров",
    capacity: 8,
    minimumSpend: 12000,
    description: "Максимально удобный вариант для больших компаний.",
    availability: "available"
  },
  {
    id: "tbl-loft-vip-1",
    venueId: "loft",
    name: "Стол L3",
    zone: "VIP-комната",
    capacity: 6,
    minimumSpend: 15000,
    description: "Отдельная комната для закрытых встреч и дней рождения.",
    availability: "available"
  }
];

export const menuItems: MenuItem[] = [
  {
    id: "item-tea-signature",
    category: "drink",
    name: "Чайный сет Авторский",
    price: 950,
    description: "Японский чай и маленькие десерты к чаше."
  },
  {
    id: "item-lemonade-yuzu",
    category: "drink",
    name: "Лимонад юдзу",
    price: 650,
    description: "Цитрус, лёгкая кислинка, подходит к свежим миксам."
  },
  {
    id: "item-sparkling-water",
    category: "drink",
    name: "Минеральная вода",
    price: 350,
    description: "Нейтральный выбор для спокойного сопровождения."
  },
  {
    id: "item-fruit-plate",
    category: "snack",
    name: "Фруктовая тарелка",
    price: 1200,
    description: "Сезонные фрукты, удобно для компании."
  },
  {
    id: "item-baklava-box",
    category: "snack",
    name: "Баклава box",
    price: 850,
    description: "Небольшой десертный сет к чаю."
  },
  {
    id: "item-nuts-truffle",
    category: "snack",
    name: "Орехи с трюфельной солью",
    price: 600,
    description: "Солёная закуска для более плотных вкусов."
  }
];

export const demoDateOptions = ["2026-03-27", "2026-03-28", "2026-03-29"];
export const demoTimeOptions = [
  "18:00",
  "19:00",
  "20:00",
  "21:30",
  "23:00"
];
