import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import type {
  BookingRecord,
  ConsultationRecord,
  Database,
} from "../types.js";

const EMPTY_DATABASE: Database = {
  bookings: [],
  consultations: [],
};

export class LocalStore {
  constructor(private readonly filePath: string) {}

  async addBooking(booking: BookingRecord): Promise<void> {
    const database = await this.read();
    database.bookings.push(booking);
    await this.write(database);
  }

  async addConsultation(consultation: ConsultationRecord): Promise<void> {
    const database = await this.read();
    database.consultations.push(consultation);
    await this.write(database);
  }

  async getUserSnapshot(userId: number): Promise<{
    bookings: BookingRecord[];
    consultations: ConsultationRecord[];
  }> {
    const database = await this.read();

    return {
      bookings: database.bookings
        .filter((entry) => entry.userId === userId)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
      consultations: database.consultations
        .filter((entry) => entry.userId === userId)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    };
  }

  async getAdminSnapshot(): Promise<{
    totalBookings: number;
    totalConsultations: number;
    newBookings: number;
    newConsultations: number;
    latestBookings: BookingRecord[];
    latestConsultations: ConsultationRecord[];
  }> {
    const database = await this.read();

    return {
      totalBookings: database.bookings.length,
      totalConsultations: database.consultations.length,
      newBookings: database.bookings.filter((entry) => entry.status === "new").length,
      newConsultations: database.consultations.filter((entry) => entry.status === "new").length,
      latestBookings: [...database.bookings]
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .slice(0, 5),
      latestConsultations: [...database.consultations]
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .slice(0, 5),
    };
  }

  async getBookings(status?: BookingRecord["status"]): Promise<BookingRecord[]> {
    const database = await this.read();

    return database.bookings
      .filter((entry) => !status || entry.status === status)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  async getConsultations(
    status?: ConsultationRecord["status"],
  ): Promise<ConsultationRecord[]> {
    const database = await this.read();

    return database.consultations
      .filter((entry) => !status || entry.status === status)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  async getBookingById(bookingId: string): Promise<BookingRecord | null> {
    const database = await this.read();

    return database.bookings.find((entry) => entry.id === bookingId) ?? null;
  }

  async getConsultationById(
    consultationId: string,
  ): Promise<ConsultationRecord | null> {
    const database = await this.read();

    return (
      database.consultations.find((entry) => entry.id === consultationId) ?? null
    );
  }

  async updateBookingStatus(
    bookingId: string,
    status: BookingRecord["status"],
  ): Promise<BookingRecord | null> {
    const database = await this.read();
    const booking = database.bookings.find((entry) => entry.id === bookingId);

    if (!booking) {
      return null;
    }

    booking.status = status;
    await this.write(database);

    return booking;
  }

  async updateConsultationStatus(
    consultationId: string,
    status: ConsultationRecord["status"],
  ): Promise<ConsultationRecord | null> {
    const database = await this.read();
    const consultation = database.consultations.find(
      (entry) => entry.id === consultationId,
    );

    if (!consultation) {
      return null;
    }

    consultation.status = status;
    await this.write(database);

    return consultation;
  }

  private async read(): Promise<Database> {
    await mkdir(dirname(this.filePath), { recursive: true });

    try {
      const raw = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<Database>;

      return {
        bookings: Array.isArray(parsed.bookings) ? parsed.bookings : [],
        consultations: Array.isArray(parsed.consultations)
          ? parsed.consultations
          : [],
      };
    } catch (error) {
      const isMissingFile =
        error instanceof Error &&
        "code" in error &&
        (error as NodeJS.ErrnoException).code === "ENOENT";

      if (!isMissingFile) {
        throw error;
      }

      await this.write(EMPTY_DATABASE);
      return structuredClone(EMPTY_DATABASE);
    }
  }

  private async write(database: Database): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(database, null, 2), "utf8");
  }
}
