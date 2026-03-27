export type ReservationStatus =
  | "new"
  | "confirmed"
  | "canceled"
  | "arrived"
  | "no_show";

export type TableAvailability = "available" | "maintenance" | "vip_only";

export type HookahStrength = "light" | "medium" | "strong";
export type HookahFlavorCategory =
  | "fruity"
  | "dessert"
  | "citrus"
  | "mint"
  | "spicy";
export type BowlType = "classic" | "phunnel" | "fruit_bowl";

export type User = {
  id: string;
  name: string;
  phone: string;
};

export type Venue = {
  id: string;
  name: string;
  address: string;
  subway: string;
  description: string;
  shortTag: string;
};

export type Table = {
  id: string;
  venueId: string;
  name: string;
  zone: string;
  capacity: number;
  minimumSpend: number;
  description: string;
  availability: TableAvailability;
};

export type MenuItem = {
  id: string;
  category: "drink" | "snack";
  name: string;
  price: number;
  description: string;
};

export type HookahPreorder = {
  strength: HookahStrength;
  flavorCategory: HookahFlavorCategory;
  bowlType: BowlType;
  comment: string;
  menuItemIds: string[];
};

export type Reservation = {
  id: string;
  userId: string;
  userName: string;
  phone: string;
  venueId: string;
  tableId: string;
  date: string;
  time: string;
  guests: number;
  status: ReservationStatus;
  createdAt: string;
  hookahPreorder: HookahPreorder;
};

export type ReservationView = Reservation & {
  venue: Venue;
  table: Table;
  menuItems: MenuItem[];
};

export type PersistedDatabase = {
  reservations: Reservation[];
  tableAvailability: Record<string, TableAvailability>;
};

export type MiniAppCatalog = {
  venues: Venue[];
  tables: Table[];
  menuItems: MenuItem[];
  reservations: Reservation[];
};

export type AdminDashboardData = {
  venues: Venue[];
  tables: Table[];
  menuItems: MenuItem[];
  reservations: ReservationView[];
  stats: {
    total: number;
    newCount: number;
    confirmedCount: number;
    todayCount: number;
  };
};

export type CreateReservationInput = {
  userId: string;
  userName: string;
  phone: string;
  venueId: string;
  tableId: string;
  date: string;
  time: string;
  guests: number;
  hookahPreorder: HookahPreorder;
};
