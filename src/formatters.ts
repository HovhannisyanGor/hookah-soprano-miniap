import { randomUUID } from "node:crypto";

import {
  business,
  getBranchById,
  getConsultationTopicById,
  getStrengthById,
} from "./config/business.js";
import type {
  BookingDraft,
  BookingRecord,
  ConsultationDraft,
  ConsultationRecord,
} from "./types.js";

const fullDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  weekday: "short",
  day: "numeric",
  month: "long",
});

const compactDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
});

const dateTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey: string): Date {
  const [yearRaw, monthRaw, dayRaw] = dateKey.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return new Date();
  }

  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function getUpcomingDateOptions(days = 6): Array<{
  value: string;
  label: string;
}> {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + index);

    let prefix = "";
    if (index === 0) {
      prefix = "Сегодня, ";
    } else if (index === 1) {
      prefix = "Завтра, ";
    }

    return {
      value: toDateKey(date),
      label: `${prefix}${capitalize(fullDateFormatter.format(date))}`,
    };
  });
}

export function formatDate(dateKey: string): string {
  return capitalize(fullDateFormatter.format(parseDateKey(dateKey)));
}

export function formatTimestamp(timestamp: string): string {
  return dateTimeFormatter.format(new Date(timestamp));
}

export function formatCompactDate(dateKey: string): string {
  return compactDateFormatter.format(parseDateKey(dateKey));
}

export function formatBookingSummary(draft: BookingDraft): string {
  const branch = getBranchById(draft.branchId);
  const strength = getStrengthById(draft.strengthId);

  return [
    "Проверьте бронь:",
    `Филиал: ${branch?.name ?? draft.branchId}`,
    `Адрес: ${branch?.address ?? "уточним с менеджером"}`,
    `Дата: ${formatDate(draft.date)}`,
    `Время: ${draft.time}`,
    `Гостей: ${draft.guests}`,
    `Крепость: ${strength?.title ?? draft.strengthId}`,
    `Пожелания по вкусу: ${draft.flavorNotes}`,
    `Телефон: ${draft.phone}`,
    `Комментарий: ${draft.comment || "без комментария"}`,
  ].join("\n");
}

export function formatConsultationSummary(draft: ConsultationDraft): string {
  const topic = getConsultationTopicById(draft.topicId);

  return [
    "Проверьте заявку:",
    `Тема: ${topic?.title ?? draft.topicId}`,
    `Вопрос: ${draft.question}`,
    `Телефон: ${draft.phone}`,
  ].join("\n");
}

export function formatUserBooking(booking: BookingRecord): string {
  const branch = getBranchById(booking.branchId);

  return [
    `${booking.id} • ${statusLabel(booking.status)}`,
    `${formatDate(booking.date)} в ${booking.time}`,
    `${branch?.name ?? booking.branchId} • ${booking.guests} гост.`,
  ].join("\n");
}

export function formatUserConsultation(
  consultation: ConsultationRecord,
): string {
  const topic = getConsultationTopicById(consultation.topicId);

  return [
    `${consultation.id} • ${consultationStatusLabel(consultation.status)}`,
    `${topic?.title ?? consultation.topicId}`,
    `${truncate(consultation.question, 90)}`,
  ].join("\n");
}

export function makeBookingRecord(
  draft: BookingDraft,
  user: {
    userId: number;
    username?: string;
    fullName: string;
  },
): BookingRecord {
  return {
    ...draft,
    id: `BK-${randomUUID().slice(0, 8).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    status: "new",
    userId: user.userId,
    fullName: user.fullName,
    ...(user.username ? { username: user.username } : {}),
  };
}

export function makeConsultationRecord(
  draft: ConsultationDraft,
  user: {
    userId: number;
    username?: string;
    fullName: string;
  },
): ConsultationRecord {
  return {
    ...draft,
    id: `CS-${randomUUID().slice(0, 8).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    status: "new",
    userId: user.userId,
    fullName: user.fullName,
    ...(user.username ? { username: user.username } : {}),
  };
}

export function formatAdminBooking(booking: BookingRecord): string {
  const branch = getBranchById(booking.branchId);
  const strength = getStrengthById(booking.strengthId);

  return [
    `Новая бронь ${booking.id}`,
    `Клиент: ${booking.fullName}${booking.username ? ` (@${booking.username})` : ""}`,
    `Филиал: ${branch?.name ?? booking.branchId}`,
    `Дата: ${formatDate(booking.date)} в ${booking.time}`,
    `Гостей: ${booking.guests}`,
    `Крепость: ${strength?.title ?? booking.strengthId}`,
    `Вкус: ${booking.flavorNotes}`,
    `Телефон: ${booking.phone}`,
    `Комментарий: ${booking.comment || "без комментария"}`,
  ].join("\n");
}

export function formatAdminConsultation(
  consultation: ConsultationRecord,
): string {
  const topic = getConsultationTopicById(consultation.topicId);

  return [
    `Новая консультация ${consultation.id}`,
    `Клиент: ${consultation.fullName}${consultation.username ? ` (@${consultation.username})` : ""}`,
    `Тема: ${topic?.title ?? consultation.topicId}`,
    `Телефон: ${consultation.phone}`,
    `Вопрос: ${consultation.question}`,
  ].join("\n");
}

export function formatAdminPanelSummary(input: {
  totalBookings: number;
  totalConsultations: number;
  newBookings: number;
  newConsultations: number;
}): string {
  return [
    "Админ-панель",
    `Всего броней: ${input.totalBookings}`,
    `Новых броней: ${input.newBookings}`,
    `Всего консультаций: ${input.totalConsultations}`,
    `Новых консультаций: ${input.newConsultations}`,
    "",
    "Выберите раздел ниже.",
  ].join("\n");
}

export function formatAdminBookingListLabel(booking: BookingRecord): string {
  return truncate(
    `${formatCompactDate(booking.date)} ${booking.time} • ${booking.fullName} • ${statusLabel(booking.status)}`,
    60,
  );
}

export function formatAdminConsultationListLabel(
  consultation: ConsultationRecord,
): string {
  return truncate(
    `${consultation.fullName} • ${statusLabel(consultation.status)} • ${formatTimestamp(consultation.createdAt)}`,
    60,
  );
}

export function formatAdminBookingDetails(booking: BookingRecord): string {
  const branch = getBranchById(booking.branchId);
  const strength = getStrengthById(booking.strengthId);

  return [
    `Бронь ${booking.id}`,
    `Статус: ${statusLabel(booking.status)}`,
    `Создана: ${formatTimestamp(booking.createdAt)}`,
    "",
    `Клиент: ${booking.fullName}${booking.username ? ` (@${booking.username})` : ""}`,
    `User ID: ${booking.userId}`,
    `Телефон: ${booking.phone}`,
    "",
    `Филиал: ${branch?.name ?? booking.branchId}`,
    `Адрес: ${branch?.address ?? "уточнить"}`,
    `Дата: ${formatDate(booking.date)} в ${booking.time}`,
    `Гостей: ${booking.guests}`,
    `Крепость: ${strength?.title ?? booking.strengthId}`,
    `Вкусы: ${booking.flavorNotes}`,
    `Комментарий: ${booking.comment || "без комментария"}`,
  ].join("\n");
}

export function formatAdminConsultationDetails(
  consultation: ConsultationRecord,
): string {
  const topic = getConsultationTopicById(consultation.topicId);

  return [
    `Консультация ${consultation.id}`,
    `Статус: ${statusLabel(consultation.status)}`,
    `Создана: ${formatTimestamp(consultation.createdAt)}`,
    "",
    `Клиент: ${consultation.fullName}${consultation.username ? ` (@${consultation.username})` : ""}`,
    `User ID: ${consultation.userId}`,
    `Телефон: ${consultation.phone}`,
    `Тема: ${topic?.title ?? consultation.topicId}`,
    "",
    consultation.question,
  ].join("\n");
}

export function formatShowcase(): string {
  const services = business.services
    .map(
      (item) => `• ${item.name} — ${item.price}\n${item.description}`,
    )
    .join("\n\n");

  return [
    `${business.name}`,
    business.tagline,
    "",
    "Что можно показать клиенту в демо:",
    services,
  ].join("\n");
}

export function formatContacts(): string {
  const branches = business.branches
    .map((branch) =>
      [
        `• ${branch.name}`,
        `${branch.address}${branch.nearestMetro ? `, ${branch.nearestMetro}` : ""}`,
        `Время работы: ${branch.hours}`,
        `Телефон: ${branch.phone}`,
      ].join("\n"),
    )
    .join("\n\n");

  return [
    "Контакты",
    branches,
    "",
    `Основной номер: ${business.phone}`,
    `Менеджер: ${business.managerHandle}`,
    `${business.responseWindow}.`,
  ].join("\n");
}

export function formatFaqAnswer(question: string, answer: string): string {
  return [`FAQ`, question, "", answer].join("\n");
}

export function normalizePhone(raw: string): string | null {
  const cleaned = raw.replace(/[^\d+]/g, "");

  if (!cleaned) {
    return null;
  }

  if (cleaned.startsWith("+")) {
    const digits = cleaned.slice(1).replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 15
      ? `+${digits}`
      : null;
  }

  const digits = cleaned.replace(/\D/g, "");

  if (digits.length === 10) {
    return `+7${digits}`;
  }

  if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
    return `+7${digits.slice(1)}`;
  }

  return null;
}

export function parseGuestCount(input: string): number | null {
  const match = input.match(/\d{1,2}/);
  if (!match) {
    return null;
  }

  const guests = Number(match[0]);
  return guests >= 1 && guests <= 12 ? guests : null;
}

export function buildWelcomeText(): string {
  return [
    `${business.name}`,
    business.hero,
    "",
    "В этом боте можно:",
    "• забронировать стол и кальян",
    "• получить консультацию по вкусу, крепости и формату отдыха",
    "• посмотреть цены, FAQ и контакты",
  ].join("\n");
}

export function statusLabel(
  status: BookingRecord["status"] | ConsultationRecord["status"],
): string {
  switch (status) {
    case "new":
      return "Новая";
    case "confirmed":
      return "Подтверждена";
    case "completed":
      return "Завершена";
    case "cancelled":
      return "Отменена";
    case "in_progress":
      return "В работе";
    case "resolved":
      return "Закрыта";
    default:
      return "Неизвестно";
  }
}

export function consultationStatusLabel(
  status: ConsultationRecord["status"],
): string {
  return statusLabel(status);
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}

export function safeFullName(firstName?: string, lastName?: string): string {
  return [firstName, lastName].filter(Boolean).join(" ") || "Без имени";
}

export function isBookingDraftComplete(
  draft: Partial<BookingDraft>,
): draft is BookingDraft {
  return Boolean(
    draft.branchId &&
      draft.date &&
      draft.time &&
      draft.guests &&
      draft.strengthId &&
      draft.flavorNotes &&
      draft.phone &&
      draft.comment !== undefined,
  );
}

export function isConsultationDraftComplete(
  draft: Partial<ConsultationDraft>,
): draft is ConsultationDraft {
  return Boolean(draft.topicId && draft.question && draft.phone);
}
