import { InlineKeyboard, Keyboard } from "grammy";

import { business } from "./config/business.js";
import {
  formatAdminBookingListLabel,
  formatAdminConsultationListLabel,
  getUpcomingDateOptions,
} from "./formatters.js";
import type { BookingRecord, ConsultationRecord } from "./types.js";

export function mainMenuKeyboard(isAdmin = false): Keyboard {
  const keyboard = new Keyboard()
    .text("Мини-приложение")
    .row()
    .text("Забронировать")
    .text("Консультация")
    .row()
    .text("Меню и цены")
    .text("FAQ")
    .row()
    .text("Контакты")
    .text("Мои заявки");

  if (isAdmin) {
    keyboard.row().text("Админ-панель");
  }

  return keyboard.resized().persistent();
}

export function miniAppKeyboard(url: string): InlineKeyboard {
  return new InlineKeyboard().webApp("Открыть Mini App", url).row().text("Главное меню", "menu");
}

export function textStepKeyboard(): Keyboard {
  return new Keyboard()
    .text("Назад")
    .text("Отмена")
    .row()
    .text("Главное меню")
    .resized();
}

export function commentStepKeyboard(): Keyboard {
  return new Keyboard()
    .text("Пропустить")
    .row()
    .text("Назад")
    .text("Отмена")
    .row()
    .text("Главное меню")
    .resized();
}

export function guestStepKeyboard(): Keyboard {
  return new Keyboard()
    .text("2")
    .text("4")
    .text("6")
    .row()
    .text("Назад")
    .text("Отмена")
    .row()
    .text("Главное меню")
    .resized();
}

export function phoneStepKeyboard(): Keyboard {
  return new Keyboard()
    .requestContact("Отправить телефон")
    .row()
    .text("Назад")
    .text("Отмена")
    .row()
    .text("Главное меню")
    .resized();
}

export function branchKeyboard(): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  business.branches.forEach((branch) => {
    keyboard.text(branch.name, `book:branch:${branch.id}`).row();
  });

  keyboard.text("Отмена", "cancel");

  return keyboard;
}

export function dateKeyboard(): InlineKeyboard {
  const keyboard = new InlineKeyboard();
  const options = getUpcomingDateOptions();

  options.forEach((option, index) => {
    keyboard.text(option.label, `book:date:${option.value}`);
    if (index % 2 === 1 || index === options.length - 1) {
      keyboard.row();
    }
  });

  keyboard.text("Назад", "back").text("Отмена", "cancel");

  return keyboard;
}

export function timeKeyboard(): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  business.timeSlots.forEach((slot, index) => {
    keyboard.text(slot, `book:time:${slot}`);
    if (index % 3 === 2 || index === business.timeSlots.length - 1) {
      keyboard.row();
    }
  });

  keyboard.text("Назад", "back").text("Отмена", "cancel");

  return keyboard;
}

export function strengthKeyboard(): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  business.strengths.forEach((strength) => {
    keyboard
      .text(
        `${strength.title} • ${strength.note}`,
        `book:strength:${strength.id}`,
      )
      .row();
  });

  keyboard.text("Назад", "back").text("Отмена", "cancel");

  return keyboard;
}

export function consultationTopicKeyboard(): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  business.consultationTopics.forEach((topic) => {
    keyboard.text(topic.title, `consult:topic:${topic.id}`).row();
  });

  keyboard.text("Отмена", "cancel");

  return keyboard;
}

export function bookingConfirmKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("Подтвердить", "book:confirm")
    .row()
    .text("Изменить", "book:edit")
    .text("Отмена", "cancel");
}

export function consultationConfirmKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("Отправить", "consult:confirm")
    .row()
    .text("Изменить", "consult:edit")
    .text("Отмена", "cancel");
}

export function infoActionsKeyboard(): InlineKeyboard {
  return new InlineKeyboard()
    .text("Забронировать", "action:book")
    .text("Консультация", "action:consult");
}

export function faqKeyboard(): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  business.faq.forEach((item) => {
    keyboard.text(item.question, `faq:${item.id}`).row();
  });

  keyboard.text("Консультация", "action:consult").text("Меню", "menu");

  return keyboard;
}

export function adminPanelKeyboard(counts: {
  newBookings: number;
  newConsultations: number;
}): InlineKeyboard {
  return new InlineKeyboard()
    .text(`Новые брони (${counts.newBookings})`, "admin:bookings:new")
    .row()
    .text("Все брони", "admin:bookings:all")
    .row()
    .text(`Новые консультации (${counts.newConsultations})`, "admin:consultations:new")
    .row()
    .text("Все консультации", "admin:consultations:all")
    .row()
    .text("Обновить", "admin:panel")
    .text("Главное меню", "menu");
}

export function adminBookingListKeyboard(
  bookings: BookingRecord[],
  filter: "all" | "new",
): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  bookings.slice(0, 10).forEach((booking) => {
    keyboard
      .text(
        formatAdminBookingListLabel(booking),
        `admin:booking:view:${booking.id}:${filter}`,
      )
      .row();
  });

  keyboard
    .text(filter === "new" ? "Показать все" : "Только новые", `admin:bookings:${filter === "new" ? "all" : "new"}`)
    .row()
    .text("Назад", "admin:panel")
    .text("Обновить", `admin:bookings:${filter}`);

  return keyboard;
}

export function adminConsultationListKeyboard(
  consultations: ConsultationRecord[],
  filter: "all" | "new",
): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  consultations.slice(0, 10).forEach((consultation) => {
    keyboard
      .text(
        formatAdminConsultationListLabel(consultation),
        `admin:consultation:view:${consultation.id}:${filter}`,
      )
      .row();
  });

  keyboard
    .text(
      filter === "new" ? "Показать все" : "Только новые",
      `admin:consultations:${filter === "new" ? "all" : "new"}`,
    )
    .row()
    .text("Назад", "admin:panel")
    .text("Обновить", `admin:consultations:${filter}`);

  return keyboard;
}

export function adminBookingDetailsKeyboard(
  booking: BookingRecord,
  filter: "all" | "new",
): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  if (booking.status !== "confirmed") {
    keyboard.text(
      "Подтвердить",
      `admin:booking:status:${booking.id}:confirmed:${filter}`,
    );
  }

  if (booking.status !== "completed") {
    keyboard.text(
      "Завершить",
      `admin:booking:status:${booking.id}:completed:${filter}`,
    );
  }

  if (booking.status !== "cancelled") {
    keyboard.text(
      "Отменить",
      `admin:booking:status:${booking.id}:cancelled:${filter}`,
    );
  }

  keyboard
    .row()
    .text("К списку", `admin:bookings:${filter}`)
    .text("К панели", "admin:panel");

  return keyboard;
}

export function adminConsultationDetailsKeyboard(
  consultation: ConsultationRecord,
  filter: "all" | "new",
): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  if (consultation.status !== "in_progress") {
    keyboard.text(
      "В работу",
      `admin:consultation:status:${consultation.id}:in_progress:${filter}`,
    );
  }

  if (consultation.status !== "resolved") {
    keyboard.text(
      "Закрыть",
      `admin:consultation:status:${consultation.id}:resolved:${filter}`,
    );
  }

  if (consultation.status !== "new") {
    keyboard.text(
      "Вернуть в новое",
      `admin:consultation:status:${consultation.id}:new:${filter}`,
    );
  }

  keyboard
    .row()
    .text("К списку", `admin:consultations:${filter}`)
    .text("К панели", "admin:panel");

  return keyboard;
}
