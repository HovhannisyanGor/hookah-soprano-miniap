import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { hookahFlavorLabel, hookahStrengthLabel, normalizePhone } from "@/lib/format";
import { menuItems, tables, venues } from "@/lib/mock-data";
import { getSelectableTablesForSlot } from "@/lib/reservation-utils";
import type {
  AdminDashboardData,
  CreateReservationInput,
  HookahPreorder,
  MiniAppCatalog,
  PersistedDatabase,
  Reservation,
  ReservationStatus,
  ReservationView,
  Table,
  TableAvailability
} from "@/lib/types";

const SQLITE_DB_PATH = join(process.cwd(), "data", "miniapp.sqlite");
const JSON_IMPORT_PATH = join(process.cwd(), "data", "miniapp-db.json");
const seedDatabase: PersistedDatabase = {
  reservations: [
    {
      id: "res-demo-001",
      userId: "web-demo-user",
      userName: "Алексей Белов",
      phone: "+79991234567",
      venueId: "patriki",
      tableId: "tbl-patriki-lounge-1",
      date: "2026-03-27",
      time: "20:00",
      guests: 4,
      status: "new",
      createdAt: "2026-03-26T17:10:00.000Z",
      hookahPreorder: {
        strength: "medium",
        flavorCategory: "fruity",
        bowlType: "phunnel",
        comment: "Без холода, с чайной нотой.",
        menuItemIds: ["item-tea-signature", "item-fruit-plate"]
      }
    },
    {
      id: "res-demo-002",
      userId: "demo-user-002",
      userName: "Сабина Рахимова",
      phone: "+79995554433",
      venueId: "river",
      tableId: "tbl-river-sofa-1",
      date: "2026-03-28",
      time: "21:30",
      guests: 5,
      status: "confirmed",
      createdAt: "2026-03-26T16:30:00.000Z",
      hookahPreorder: {
        strength: "light",
        flavorCategory: "citrus",
        bowlType: "classic",
        comment: "Лёгкий вечерний микс и вода без газа.",
        menuItemIds: ["item-sparkling-water"]
      }
    },
    {
      id: "res-demo-003",
      userId: "demo-user-003",
      userName: "Илья Самойлов",
      phone: "+79997775544",
      venueId: "loft",
      tableId: "tbl-loft-stage-2",
      date: "2026-03-29",
      time: "19:00",
      guests: 7,
      status: "arrived",
      createdAt: "2026-03-25T19:15:00.000Z",
      hookahPreorder: {
        strength: "strong",
        flavorCategory: "spicy",
        bowlType: "fruit_bowl",
        comment: "Плотнее по крепости, можно с пряностями.",
        menuItemIds: ["item-baklava-box", "item-lemonade-yuzu"]
      }
    }
  ],
  tableAvailability: {
    "tbl-river-terrace-2": "maintenance",
    "tbl-loft-vip-1": "vip_only"
  }
};

type ReservationRow = {
  id: string;
  user_id: string;
  user_name: string;
  phone: string;
  venue_id: string;
  table_id: string;
  date: string;
  time: string;
  guests: number;
  status: ReservationStatus;
  created_at: string;
  hookah_strength: HookahPreorder["strength"];
  hookah_flavor_category: HookahPreorder["flavorCategory"];
  hookah_bowl_type: HookahPreorder["bowlType"];
  hookah_comment: string;
  menu_item_ids: string;
};

type TableAvailabilityRow = {
  table_id: string;
  availability: TableAvailability;
};

let database: DatabaseSync | null = null;

function getDatabase() {
  if (database) {
    return database;
  }

  mkdirSync(dirname(SQLITE_DB_PATH), { recursive: true });

  const db = new DatabaseSync(SQLITE_DB_PATH);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;

    CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      venue_id TEXT NOT NULL,
      table_id TEXT NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      guests INTEGER NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      hookah_strength TEXT NOT NULL,
      hookah_flavor_category TEXT NOT NULL,
      hookah_bowl_type TEXT NOT NULL,
      hookah_comment TEXT NOT NULL DEFAULT '',
      menu_item_ids TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS table_availability (
      table_id TEXT PRIMARY KEY,
      availability TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
    CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
    CREATE INDEX IF NOT EXISTS idx_reservations_slot ON reservations(venue_id, date, time);
    CREATE INDEX IF NOT EXISTS idx_reservations_created_at ON reservations(created_at DESC);
  `);

  seedDatabaseIfNeeded(db);
  database = db;

  return db;
}

function seedDatabaseIfNeeded(db: DatabaseSync) {
  const row = db.prepare("SELECT COUNT(*) AS count FROM reservations").get() as
    | { count?: number }
    | undefined;
  const count = Number(row?.count ?? 0);

  if (count > 0) {
    return;
  }

  const initialSnapshot = loadInitialSnapshot();
  const insertReservation = db.prepare(`
    INSERT INTO reservations (
      id,
      user_id,
      user_name,
      phone,
      venue_id,
      table_id,
      date,
      time,
      guests,
      status,
      created_at,
      hookah_strength,
      hookah_flavor_category,
      hookah_bowl_type,
      hookah_comment,
      menu_item_ids
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const upsertTableAvailability = db.prepare(`
    INSERT INTO table_availability (table_id, availability)
    VALUES (?, ?)
    ON CONFLICT(table_id) DO UPDATE SET availability = excluded.availability
  `);

  db.exec("BEGIN");

  try {
    initialSnapshot.reservations.forEach((reservation) => {
      insertReservation.run(
        reservation.id,
        reservation.userId,
        reservation.userName,
        reservation.phone,
        reservation.venueId,
        reservation.tableId,
        reservation.date,
        reservation.time,
        reservation.guests,
        reservation.status,
        reservation.createdAt,
        reservation.hookahPreorder.strength,
        reservation.hookahPreorder.flavorCategory,
        reservation.hookahPreorder.bowlType,
        reservation.hookahPreorder.comment,
        JSON.stringify(reservation.hookahPreorder.menuItemIds)
      );
    });

    Object.entries(initialSnapshot.tableAvailability).forEach(([tableId, availability]) => {
      upsertTableAvailability.run(tableId, availability);
    });

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function loadInitialSnapshot(): PersistedDatabase {
  if (!existsSync(JSON_IMPORT_PATH)) {
    return structuredClone(seedDatabase);
  }

  try {
    const raw = readFileSync(JSON_IMPORT_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<PersistedDatabase>;

    return {
      reservations: Array.isArray(parsed.reservations) ? parsed.reservations : seedDatabase.reservations,
      tableAvailability: parsed.tableAvailability ?? seedDatabase.tableAvailability
    };
  } catch {
    return structuredClone(seedDatabase);
  }
}

function parseMenuItemIds(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function rowToReservation(row: ReservationRow): Reservation {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    phone: row.phone,
    venueId: row.venue_id,
    tableId: row.table_id,
    date: row.date,
    time: row.time,
    guests: row.guests,
    status: row.status,
    createdAt: row.created_at,
    hookahPreorder: {
      strength: row.hookah_strength,
      flavorCategory: row.hookah_flavor_category,
      bowlType: row.hookah_bowl_type,
      comment: row.hookah_comment,
      menuItemIds: parseMenuItemIds(row.menu_item_ids)
    }
  };
}

function getTableAvailabilityMap(db: DatabaseSync) {
  const rows = db.prepare("SELECT table_id, availability FROM table_availability").all() as
    | TableAvailabilityRow[]
    | undefined;

  return Object.fromEntries(
    (rows ?? []).map((row) => [row.table_id, row.availability])
  ) as Record<string, TableAvailability>;
}

function getAllReservations(db: DatabaseSync) {
  const rows = db.prepare(`
    SELECT
      id,
      user_id,
      user_name,
      phone,
      venue_id,
      table_id,
      date,
      time,
      guests,
      status,
      created_at,
      hookah_strength,
      hookah_flavor_category,
      hookah_bowl_type,
      hookah_comment,
      menu_item_ids
    FROM reservations
    ORDER BY created_at DESC
  `).all() as ReservationRow[] | undefined;

  return (rows ?? []).map(rowToReservation);
}

function getPersistedDatabase(): PersistedDatabase {
  const db = getDatabase();

  return {
    reservations: getAllReservations(db),
    tableAvailability: getTableAvailabilityMap(db)
  };
}

function resolveTables(availabilityMap: Record<string, TableAvailability>) {
  return tables.map((table) => ({
    ...table,
    availability: availabilityMap[table.id] ?? table.availability
  }));
}

function getMenuItemsByIds(ids: string[]) {
  return menuItems.filter((item) => ids.includes(item.id));
}

function hydrateReservation(reservation: Reservation, resolvedTables: Table[]): ReservationView {
  const venue = venues.find((item) => item.id === reservation.venueId);
  const table = resolvedTables.find((item) => item.id === reservation.tableId);

  if (!venue || !table) {
    throw new Error(`Не удалось собрать reservation view для ${reservation.id}`);
  }

  return {
    ...reservation,
    venue,
    table,
    menuItems: getMenuItemsByIds(reservation.hookahPreorder.menuItemIds)
  };
}

function validatePreorder(preorder: HookahPreorder) {
  const strengthValues = ["light", "medium", "strong"];
  const flavorValues = ["fruity", "dessert", "citrus", "mint", "spicy"];
  const bowlValues = ["classic", "phunnel", "fruit_bowl"];

  return (
    strengthValues.includes(preorder.strength) &&
    flavorValues.includes(preorder.flavorCategory) &&
    bowlValues.includes(preorder.bowlType)
  );
}

export async function getMiniAppCatalog(): Promise<MiniAppCatalog> {
  const snapshot = getPersistedDatabase();

  return {
    venues,
    tables: resolveTables(snapshot.tableAvailability),
    menuItems,
    reservations: [...snapshot.reservations].sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt)
    )
  };
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const catalog = await getMiniAppCatalog();
  const reservationViews = catalog.reservations.map((item) =>
    hydrateReservation(item, catalog.tables)
  );
  const todayKey = new Date().toISOString().slice(0, 10);

  return {
    venues: catalog.venues,
    tables: catalog.tables,
    menuItems: catalog.menuItems,
    reservations: reservationViews,
    stats: {
      total: reservationViews.length,
      newCount: reservationViews.filter((item) => item.status === "new").length,
      confirmedCount: reservationViews.filter((item) => item.status === "confirmed").length,
      todayCount: reservationViews.filter((item) => item.date === todayKey).length
    }
  };
}

export async function getReservationViews(userId?: string) {
  const catalog = await getMiniAppCatalog();
  const filtered = userId
    ? catalog.reservations.filter((item) => item.userId === userId)
    : catalog.reservations;

  return filtered.map((item) => hydrateReservation(item, catalog.tables));
}

export async function getReservationView(reservationId: string) {
  const catalog = await getMiniAppCatalog();
  const reservation = catalog.reservations.find((item) => item.id === reservationId);

  return reservation ? hydrateReservation(reservation, catalog.tables) : null;
}

export async function createReservation(payload: CreateReservationInput) {
  const db = getDatabase();
  const snapshot = getPersistedDatabase();
  const resolvedTables = resolveTables(snapshot.tableAvailability);
  const targetTable = resolvedTables.find((table) => table.id === payload.tableId);

  if (!payload.userName.trim()) {
    throw new Error("Укажите имя гостя.");
  }

  if (!validatePreorder(payload.hookahPreorder)) {
    throw new Error("Проверьте параметры предзаказа кальяна.");
  }

  if (!targetTable) {
    throw new Error("Стол не найден.");
  }

  if (targetTable.venueId !== payload.venueId) {
    throw new Error("Стол относится к другому филиалу.");
  }

  if (payload.guests < 1 || payload.guests > targetTable.capacity) {
    throw new Error("Количество гостей не подходит для выбранного стола.");
  }

  const availableTables = getSelectableTablesForSlot({
    venueId: payload.venueId,
    date: payload.date,
    time: payload.time,
    tables: resolvedTables,
    reservations: snapshot.reservations
  });

  const isTableAvailable = availableTables.some((table) => table.id === payload.tableId);
  if (!isTableAvailable) {
    throw new Error("Этот стол уже занят или временно недоступен.");
  }

  const reservation: Reservation = {
    id: `res-${randomUUID()}`,
    userId: payload.userId,
    userName: payload.userName.trim(),
    phone: normalizePhone(payload.phone.trim()),
    venueId: payload.venueId,
    tableId: payload.tableId,
    date: payload.date,
    time: payload.time,
    guests: payload.guests,
    status: "new",
    createdAt: new Date().toISOString(),
    hookahPreorder: {
      ...payload.hookahPreorder,
      comment: payload.hookahPreorder.comment.trim()
    }
  };

  db.prepare(`
    INSERT INTO reservations (
      id,
      user_id,
      user_name,
      phone,
      venue_id,
      table_id,
      date,
      time,
      guests,
      status,
      created_at,
      hookah_strength,
      hookah_flavor_category,
      hookah_bowl_type,
      hookah_comment,
      menu_item_ids
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    reservation.id,
    reservation.userId,
    reservation.userName,
    reservation.phone,
    reservation.venueId,
    reservation.tableId,
    reservation.date,
    reservation.time,
    reservation.guests,
    reservation.status,
    reservation.createdAt,
    reservation.hookahPreorder.strength,
    reservation.hookahPreorder.flavorCategory,
    reservation.hookahPreorder.bowlType,
    reservation.hookahPreorder.comment,
    JSON.stringify(reservation.hookahPreorder.menuItemIds)
  );

  return hydrateReservation(reservation, resolvedTables);
}

export async function updateReservationStatus(
  reservationId: string,
  status: ReservationStatus
) {
  const db = getDatabase();
  const row = db.prepare(`
    SELECT
      id,
      user_id,
      user_name,
      phone,
      venue_id,
      table_id,
      date,
      time,
      guests,
      status,
      created_at,
      hookah_strength,
      hookah_flavor_category,
      hookah_bowl_type,
      hookah_comment,
      menu_item_ids
    FROM reservations
    WHERE id = ?
  `).get(reservationId) as ReservationRow | undefined;

  if (!row) {
    return null;
  }

  db.prepare("UPDATE reservations SET status = ? WHERE id = ?").run(status, reservationId);

  return hydrateReservation(
    { ...rowToReservation(row), status },
    resolveTables(getTableAvailabilityMap(db))
  );
}

export async function updateTableAvailability(
  tableId: string,
  availability: TableAvailability
) {
  if (!tables.some((table) => table.id === tableId)) {
    return null;
  }

  const db = getDatabase();
  db.prepare(`
    INSERT INTO table_availability (table_id, availability)
    VALUES (?, ?)
    ON CONFLICT(table_id) DO UPDATE SET availability = excluded.availability
  `).run(tableId, availability);

  return resolveTables(getTableAvailabilityMap(db)).find((item) => item.id === tableId) ?? null;
}

export function hookahDebugLine(preorder: HookahPreorder) {
  return `${hookahStrengthLabel(preorder.strength)} · ${hookahFlavorLabel(
    preorder.flavorCategory
  )}`;
}
