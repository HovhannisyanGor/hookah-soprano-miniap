import {
  Bot,
  Context,
  InlineKeyboard,
  session,
  type SessionFlavor,
} from "grammy";

import {
  business,
  getBranchById,
  getConsultationTopicById,
  getFaqById,
} from "./config/business.js";
import { env, isPublicHttpsUrl } from "./config/env.js";
import { LocalStore } from "./data/store.js";
import {
  buildWelcomeText,
  formatAdminBooking,
  formatAdminBookingDetails,
  formatAdminConsultation,
  formatAdminConsultationDetails,
  formatAdminPanelSummary,
  formatBookingSummary,
  formatContacts,
  formatConsultationSummary,
  formatFaqAnswer,
  formatShowcase,
  formatUserBooking,
  formatUserConsultation,
  isBookingDraftComplete,
  isConsultationDraftComplete,
  makeBookingRecord,
  makeConsultationRecord,
  normalizePhone,
  parseGuestCount,
  safeFullName,
  statusLabel,
} from "./formatters.js";
import {
  bookingConfirmKeyboard,
  adminBookingDetailsKeyboard,
  adminBookingListKeyboard,
  adminConsultationDetailsKeyboard,
  adminConsultationListKeyboard,
  adminPanelKeyboard,
  branchKeyboard,
  commentStepKeyboard,
  consultationConfirmKeyboard,
  consultationTopicKeyboard,
  dateKeyboard,
  faqKeyboard,
  guestStepKeyboard,
  infoActionsKeyboard,
  mainMenuKeyboard,
  miniAppKeyboard,
  phoneStepKeyboard,
  strengthKeyboard,
  textStepKeyboard,
  timeKeyboard,
} from "./keyboards.js";
import type {
  BookingStep,
  ConsultationStep,
  SessionData,
} from "./types.js";

type BotContext = Context & SessionFlavor<SessionData>;
type AdminFilter = "all" | "new";

const store = new LocalStore(env.dataFile);

function initialSession(): SessionData {
  return {
    flow: "idle",
    step: null,
    bookingDraft: {},
    consultationDraft: {},
  };
}

function resetSession(ctx: BotContext): void {
  ctx.session = initialSession();
}

function isAdmin(userId: number | undefined): boolean {
  return Boolean(userId && env.adminChatIds.includes(userId));
}

function currentBookingStep(ctx: BotContext): BookingStep | null {
  return ctx.session.flow === "booking" ? (ctx.session.step as BookingStep | null) : null;
}

function currentConsultationStep(ctx: BotContext): ConsultationStep | null {
  return ctx.session.flow === "consultation"
    ? (ctx.session.step as ConsultationStep | null)
    : null;
}

function menuKeyboardFor(ctx: BotContext) {
  return mainMenuKeyboard(isAdmin(ctx.from?.id));
}

async function showMiniAppEntry(ctx: BotContext): Promise<void> {
  if (isPublicHttpsUrl(env.miniAppUrl)) {
    const lines = [
      "Мини-приложение готово.",
      `Публичный адрес: ${env.miniAppUrl}`,
      "",
      "Эта кнопка откроет Mini App прямо внутри Telegram.",
    ];

    await ctx.reply(lines.join("\n"), {
      reply_markup: miniAppKeyboard(env.miniAppUrl),
    });
    return;
  }

  const lines = [
    "Мини-приложение пока работает только локально.",
    `Текущий адрес: ${env.miniAppUrl}`,
    "",
    "Telegram Mini App не открывается с localhost или обычного http.",
    "Нужен публичный HTTPS URL. После этого бот начнет открывать Mini App корректно.",
    "Пока что локальную версию можно открыть только обычным браузером вне Telegram.",
  ];

  await ctx.reply(lines.join("\n"));
}

async function showInlineScreen(
  ctx: BotContext,
  text: string,
  replyMarkup: InlineKeyboard,
): Promise<void> {
  if (ctx.callbackQuery) {
    await ctx
      .editMessageText(text, { reply_markup: replyMarkup })
      .catch(async () => {
        await ctx.reply(text, { reply_markup: replyMarkup });
      });
    return;
  }

  await ctx.reply(text, { reply_markup: replyMarkup });
}

async function showMainMenu(
  ctx: BotContext,
  text = buildWelcomeText(),
): Promise<void> {
  resetSession(ctx);
  await ctx.reply(text, { reply_markup: menuKeyboardFor(ctx) });
}

async function startBooking(ctx: BotContext): Promise<void> {
  ctx.session.flow = "booking";
  ctx.session.step = "branch";
  ctx.session.bookingDraft = {};
  ctx.session.consultationDraft = {};

  await ctx.reply(
    "Выберите филиал. Это первый шаг брони, дальше бот сам проведет вас по сценарию.",
    {
      reply_markup: branchKeyboard(),
    },
  );
}

async function startConsultation(ctx: BotContext): Promise<void> {
  ctx.session.flow = "consultation";
  ctx.session.step = "topic";
  ctx.session.consultationDraft = {};
  ctx.session.bookingDraft = {};

  await ctx.reply(
    "Выберите тему. После этого бот соберет вопрос и контакт для менеджера.",
    {
      reply_markup: consultationTopicKeyboard(),
    },
  );
}

async function showShowcase(ctx: BotContext): Promise<void> {
  await ctx.reply(formatShowcase(), {
    reply_markup: infoActionsKeyboard(),
  });
}

async function showContacts(ctx: BotContext): Promise<void> {
  await ctx.reply(formatContacts(), {
    reply_markup: infoActionsKeyboard(),
  });
}

async function showFaq(ctx: BotContext): Promise<void> {
  await ctx.reply("FAQ\nВыберите вопрос, и бот покажет быстрый ответ.", {
    reply_markup: faqKeyboard(),
  });
}

async function showMyRequests(ctx: BotContext): Promise<void> {
  if (!ctx.from) {
    await ctx.reply("Не удалось определить пользователя. Попробуйте еще раз.");
    return;
  }

  const snapshot = await store.getUserSnapshot(ctx.from.id);

  const bookingsText = snapshot.bookings.length
    ? snapshot.bookings.slice(0, 5).map(formatUserBooking).join("\n\n")
    : "Броней пока нет.";

  const consultationsText = snapshot.consultations.length
    ? snapshot.consultations.slice(0, 5).map(formatUserConsultation).join("\n\n")
    : "Консультаций пока нет.";

  await ctx.reply(
    ["Мои заявки", "", "Брони", bookingsText, "", "Консультации", consultationsText].join(
      "\n",
    ),
    {
      reply_markup: menuKeyboardFor(ctx),
    },
  );
}

async function showAdminSummary(ctx: BotContext): Promise<void> {
  if (!isAdmin(ctx.from?.id)) {
    await ctx.reply("Команда доступна только администраторам.");
    return;
  }

  resetSession(ctx);
  const snapshot = await store.getAdminSnapshot();
  await showInlineScreen(
    ctx,
    formatAdminPanelSummary(snapshot),
    adminPanelKeyboard({
      newBookings: snapshot.newBookings,
      newConsultations: snapshot.newConsultations,
    }),
  );
}

async function showAdminBookingList(
  ctx: BotContext,
  filter: AdminFilter,
): Promise<void> {
  if (!isAdmin(ctx.from?.id)) {
    await ctx.reply("Команда доступна только администраторам.");
    return;
  }

  const bookings = await store.getBookings(filter === "new" ? "new" : undefined);
  const visibleCount = Math.min(bookings.length, 10);
  const text = [
    filter === "new" ? "Новые брони" : "Все брони",
    bookings.length
      ? `Показаны последние ${visibleCount} из ${bookings.length}.`
      : "Список пока пуст.",
    "",
    "Нажмите на заявку ниже, чтобы открыть детали и изменить статус.",
  ].join("\n");

  await showInlineScreen(ctx, text, adminBookingListKeyboard(bookings, filter));
}

async function showAdminConsultationList(
  ctx: BotContext,
  filter: AdminFilter,
): Promise<void> {
  if (!isAdmin(ctx.from?.id)) {
    await ctx.reply("Команда доступна только администраторам.");
    return;
  }

  const consultations = await store.getConsultations(
    filter === "new" ? "new" : undefined,
  );
  const visibleCount = Math.min(consultations.length, 10);
  const text = [
    filter === "new" ? "Новые консультации" : "Все консультации",
    consultations.length
      ? `Показаны последние ${visibleCount} из ${consultations.length}.`
      : "Список пока пуст.",
    "",
    "Нажмите на заявку ниже, чтобы открыть детали и изменить статус.",
  ].join("\n");

  await showInlineScreen(
    ctx,
    text,
    adminConsultationListKeyboard(consultations, filter),
  );
}

async function showAdminBookingDetails(
  ctx: BotContext,
  bookingId: string,
  filter: AdminFilter,
): Promise<void> {
  if (!isAdmin(ctx.from?.id)) {
    await ctx.reply("Команда доступна только администраторам.");
    return;
  }

  const booking = await store.getBookingById(bookingId);

  if (!booking) {
    await showInlineScreen(
      ctx,
      "Эта бронь не найдена или уже была удалена.",
      adminPanelKeyboard({ newBookings: 0, newConsultations: 0 }),
    );
    return;
  }

  await showInlineScreen(
    ctx,
    formatAdminBookingDetails(booking),
    adminBookingDetailsKeyboard(booking, filter),
  );
}

async function showAdminConsultationDetails(
  ctx: BotContext,
  consultationId: string,
  filter: AdminFilter,
): Promise<void> {
  if (!isAdmin(ctx.from?.id)) {
    await ctx.reply("Команда доступна только администраторам.");
    return;
  }

  const consultation = await store.getConsultationById(consultationId);

  if (!consultation) {
    await showInlineScreen(
      ctx,
      "Эта консультация не найдена или уже была удалена.",
      adminPanelKeyboard({ newBookings: 0, newConsultations: 0 }),
    );
    return;
  }

  await showInlineScreen(
    ctx,
    formatAdminConsultationDetails(consultation),
    adminConsultationDetailsKeyboard(consultation, filter),
  );
}

async function updateAdminBookingStatus(
  ctx: BotContext,
  bookingId: string,
  status: "confirmed" | "completed" | "cancelled",
  filter: AdminFilter,
): Promise<void> {
  if (!isAdmin(ctx.from?.id)) {
    await ctx.reply("Команда доступна только администраторам.");
    return;
  }

  const updated = await store.updateBookingStatus(bookingId, status);

  if (!updated) {
    await ctx.answerCallbackQuery({ text: "Бронь не найдена" });
    await showAdminBookingList(ctx, filter);
    return;
  }

  await ctx.answerCallbackQuery({ text: `Статус: ${statusLabel(status)}` });
  await showAdminBookingDetails(ctx, bookingId, filter);
}

async function updateAdminConsultationStatus(
  ctx: BotContext,
  consultationId: string,
  status: "new" | "in_progress" | "resolved",
  filter: AdminFilter,
): Promise<void> {
  if (!isAdmin(ctx.from?.id)) {
    await ctx.reply("Команда доступна только администраторам.");
    return;
  }

  const updated = await store.updateConsultationStatus(consultationId, status);

  if (!updated) {
    await ctx.answerCallbackQuery({ text: "Заявка не найдена" });
    await showAdminConsultationList(ctx, filter);
    return;
  }

  await ctx.answerCallbackQuery({ text: `Статус: ${statusLabel(status)}` });
  await showAdminConsultationDetails(ctx, consultationId, filter);
}

async function sendBookingDatePrompt(ctx: BotContext): Promise<void> {
  ctx.session.step = "date";
  await ctx.reply("Выберите дату визита.", { reply_markup: dateKeyboard() });
}

async function sendBookingTimePrompt(ctx: BotContext): Promise<void> {
  ctx.session.step = "time";
  await ctx.reply("Выберите удобное время.", { reply_markup: timeKeyboard() });
}

async function sendGuestPrompt(ctx: BotContext): Promise<void> {
  ctx.session.step = "guests";
  await ctx.reply("Сколько будет гостей? Напишите число от 1 до 12.", {
    reply_markup: guestStepKeyboard(),
  });
}

async function sendStrengthPrompt(ctx: BotContext): Promise<void> {
  ctx.session.step = "strength";
  await ctx.reply("Какую крепость предпочитаете?", {
    reply_markup: strengthKeyboard(),
  });
}

async function sendFlavorPrompt(ctx: BotContext): Promise<void> {
  ctx.session.step = "flavor";
  await ctx.reply(
    "Опишите вкусовой профиль. Например: ягоды и чай, цитрус без холода, десертный микс.",
    {
      reply_markup: textStepKeyboard(),
    },
  );
}

async function sendBookingPhonePrompt(ctx: BotContext): Promise<void> {
  ctx.session.step = "phone";
  await ctx.reply("Оставьте телефон для подтверждения брони.", {
    reply_markup: phoneStepKeyboard(),
  });
}

async function sendBookingCommentPrompt(ctx: BotContext): Promise<void> {
  ctx.session.step = "comment";
  await ctx.reply(
    "Есть ли комментарий к брони? Можно указать повод, пожелания по посадке или особые детали.",
    {
      reply_markup: commentStepKeyboard(),
    },
  );
}

async function sendBookingConfirmation(ctx: BotContext): Promise<void> {
  if (!isBookingDraftComplete(ctx.session.bookingDraft)) {
    await ctx.reply("Не хватает данных для подтверждения. Верну вас в начало брони.");
    await startBooking(ctx);
    return;
  }

  ctx.session.step = "confirm";
  await ctx.reply(formatBookingSummary(ctx.session.bookingDraft), {
    reply_markup: bookingConfirmKeyboard(),
  });
}

async function sendConsultationQuestionPrompt(ctx: BotContext): Promise<void> {
  const topic = getConsultationTopicById(ctx.session.consultationDraft.topicId ?? "");
  ctx.session.step = "question";
  await ctx.reply(
    topic?.prompt ??
      "Опишите ваш вопрос в свободной форме, а менеджер подхватит диалог.",
    {
      reply_markup: textStepKeyboard(),
    },
  );
}

async function sendConsultationPhonePrompt(ctx: BotContext): Promise<void> {
  ctx.session.step = "phone";
  await ctx.reply("Куда менеджеру лучше написать или позвонить?", {
    reply_markup: phoneStepKeyboard(),
  });
}

async function sendConsultationConfirmation(ctx: BotContext): Promise<void> {
  if (!isConsultationDraftComplete(ctx.session.consultationDraft)) {
    await ctx.reply(
      "Для отправки заявки не хватает данных. Верну вас в начало консультации.",
    );
    await startConsultation(ctx);
    return;
  }

  ctx.session.step = "confirm";
  await ctx.reply(formatConsultationSummary(ctx.session.consultationDraft), {
    reply_markup: consultationConfirmKeyboard(),
  });
}

async function cancelFlow(ctx: BotContext): Promise<void> {
  await showMainMenu(ctx, "Текущий сценарий отменен. Ниже снова главное меню.");
}

async function goBack(ctx: BotContext): Promise<void> {
  if (ctx.session.flow === "booking") {
    switch (currentBookingStep(ctx)) {
      case "date":
        ctx.session.step = "branch";
        await ctx.reply("Выберите филиал заново.", {
          reply_markup: branchKeyboard(),
        });
        return;
      case "time":
        await sendBookingDatePrompt(ctx);
        return;
      case "guests":
        await sendBookingTimePrompt(ctx);
        return;
      case "strength":
        await sendGuestPrompt(ctx);
        return;
      case "flavor":
        await sendStrengthPrompt(ctx);
        return;
      case "phone":
        await sendFlavorPrompt(ctx);
        return;
      case "comment":
        await sendBookingPhonePrompt(ctx);
        return;
      case "confirm":
        await sendBookingCommentPrompt(ctx);
        return;
      default:
        await showMainMenu(ctx);
        return;
    }
  }

  if (ctx.session.flow === "consultation") {
    switch (currentConsultationStep(ctx)) {
      case "question":
        ctx.session.step = "topic";
        await ctx.reply("Выберите тему консультации.", {
          reply_markup: consultationTopicKeyboard(),
        });
        return;
      case "phone":
        await sendConsultationQuestionPrompt(ctx);
        return;
      case "confirm":
        await sendConsultationPhonePrompt(ctx);
        return;
      default:
        await showMainMenu(ctx);
        return;
    }
  }

  await showMainMenu(ctx);
}

async function finishBooking(ctx: BotContext): Promise<void> {
  if (!ctx.from || !isBookingDraftComplete(ctx.session.bookingDraft)) {
    await ctx.reply("Не удалось завершить бронь. Попробуйте пройти сценарий еще раз.");
    await startBooking(ctx);
    return;
  }

  const booking = makeBookingRecord(ctx.session.bookingDraft, {
    userId: ctx.from.id,
    fullName: safeFullName(ctx.from.first_name, ctx.from.last_name),
    ...(ctx.from.username ? { username: ctx.from.username } : {}),
  });

  await store.addBooking(booking);
  await notifyAdmins(ctx, formatAdminBooking(booking));
  resetSession(ctx);

  await ctx.reply(
    [
      `Бронь ${booking.id} создана.`,
      `Менеджер подтвердит детали, ${business.responseWindow}.`,
      `Если нужно, можно сразу открыть новую консультацию или еще одну бронь.`,
    ].join("\n"),
    {
      reply_markup: menuKeyboardFor(ctx),
    },
  );
}

async function finishConsultation(ctx: BotContext): Promise<void> {
  if (!ctx.from || !isConsultationDraftComplete(ctx.session.consultationDraft)) {
    await ctx.reply("Не удалось отправить заявку. Попробуйте еще раз.");
    await startConsultation(ctx);
    return;
  }

  const consultation = makeConsultationRecord(ctx.session.consultationDraft, {
    userId: ctx.from.id,
    fullName: safeFullName(ctx.from.first_name, ctx.from.last_name),
    ...(ctx.from.username ? { username: ctx.from.username } : {}),
  });

  await store.addConsultation(consultation);
  await notifyAdmins(ctx, formatAdminConsultation(consultation));
  resetSession(ctx);

  await ctx.reply(
    [
      `Заявка ${consultation.id} отправлена.`,
      `Менеджер свяжется с вами, ${business.responseWindow}.`,
      `Если хотите, можно сразу посмотреть цены, FAQ или оформить бронь.`,
    ].join("\n"),
    {
      reply_markup: menuKeyboardFor(ctx),
    },
  );
}

async function notifyAdmins(ctx: BotContext, text: string): Promise<void> {
  if (!env.adminChatIds.length) {
    return;
  }

  await Promise.allSettled(
    env.adminChatIds.map((chatId) => ctx.api.sendMessage(chatId, text)),
  );
}

function ensurePrivateChat(ctx: BotContext): boolean {
  return ctx.chat?.type === "private";
}

async function dismissInlineKeyboard(ctx: BotContext): Promise<void> {
  if (!ctx.callbackQuery) {
    return;
  }

  await ctx.editMessageReplyMarkup().catch(() => undefined);
}

export function createBot(): Bot<BotContext> {
  const bot = new Bot<BotContext>(env.botToken);

  bot.use(session({ initial: initialSession }));

  bot.use(async (ctx, next) => {
    if (!ensurePrivateChat(ctx)) {
      if (ctx.update.message) {
        await ctx.reply("Этот бот работает в личных сообщениях. Откройте его в личке и продолжим.");
      }
      return;
    }

    await next();
  });

  bot.catch(async (error) => {
    console.error("Bot error", error.error);
    await error.ctx.reply(
      "Что-то пошло не так. Я сохранил ошибку в логах, попробуйте повторить действие еще раз.",
      { reply_markup: menuKeyboardFor(error.ctx) },
    );
  });

  bot.command("start", async (ctx) => {
    await showMainMenu(ctx);
  });

  bot.command("menu", async (ctx) => {
    await showMainMenu(ctx, "Главное меню");
  });

  bot.command("admin", async (ctx) => {
    await showAdminSummary(ctx);
  });

  bot.hears("Главное меню", async (ctx) => {
    await showMainMenu(ctx, "Главное меню");
  });

  bot.hears("Забронировать", async (ctx) => {
    await startBooking(ctx);
  });

  bot.hears("Мини-приложение", async (ctx) => {
    await showMiniAppEntry(ctx);
  });

  bot.hears("Консультация", async (ctx) => {
    await startConsultation(ctx);
  });

  bot.hears("Меню и цены", async (ctx) => {
    await showShowcase(ctx);
  });

  bot.hears("Контакты", async (ctx) => {
    await showContacts(ctx);
  });

  bot.hears("FAQ", async (ctx) => {
    await showFaq(ctx);
  });

  bot.hears("Мои заявки", async (ctx) => {
    await showMyRequests(ctx);
  });

  bot.hears("Админ-панель", async (ctx) => {
    await showAdminSummary(ctx);
  });

  bot.hears("Отмена", async (ctx) => {
    await cancelFlow(ctx);
  });

  bot.hears("Назад", async (ctx) => {
    await goBack(ctx);
  });

  bot.hears("Пропустить", async (ctx) => {
    if (ctx.session.flow === "booking" && currentBookingStep(ctx) === "comment") {
      ctx.session.bookingDraft.comment = "";
      await sendBookingConfirmation(ctx);
      return;
    }

    await ctx.reply("Сейчас этот вариант недоступен. Выберите действие из меню.");
  });

  bot.callbackQuery("menu", async (ctx) => {
    await ctx.answerCallbackQuery();
    await showMainMenu(ctx, "Главное меню");
  });

  bot.callbackQuery("admin:panel", async (ctx) => {
    await ctx.answerCallbackQuery();
    await showAdminSummary(ctx);
  });

  bot.callbackQuery(/^admin:bookings:(all|new)$/, async (ctx) => {
    const filter = ctx.match[1] as AdminFilter | undefined;

    if (!filter) {
      await ctx.answerCallbackQuery({ text: "Не удалось открыть список" });
      return;
    }

    await ctx.answerCallbackQuery();
    await showAdminBookingList(ctx, filter);
  });

  bot.callbackQuery(/^admin:consultations:(all|new)$/, async (ctx) => {
    const filter = ctx.match[1] as AdminFilter | undefined;

    if (!filter) {
      await ctx.answerCallbackQuery({ text: "Не удалось открыть список" });
      return;
    }

    await ctx.answerCallbackQuery();
    await showAdminConsultationList(ctx, filter);
  });

  bot.callbackQuery(/^admin:booking:view:([^:]+):(all|new)$/, async (ctx) => {
    const bookingId = ctx.match[1];
    const filter = ctx.match[2] as AdminFilter | undefined;

    if (!bookingId || !filter) {
      await ctx.answerCallbackQuery({ text: "Не удалось открыть бронь" });
      return;
    }

    await ctx.answerCallbackQuery();
    await showAdminBookingDetails(ctx, bookingId, filter);
  });

  bot.callbackQuery(
    /^admin:consultation:view:([^:]+):(all|new)$/,
    async (ctx) => {
      const consultationId = ctx.match[1];
      const filter = ctx.match[2] as AdminFilter | undefined;

      if (!consultationId || !filter) {
        await ctx.answerCallbackQuery({ text: "Не удалось открыть заявку" });
        return;
      }

      await ctx.answerCallbackQuery();
      await showAdminConsultationDetails(ctx, consultationId, filter);
    },
  );

  bot.callbackQuery(
    /^admin:booking:status:([^:]+):(confirmed|completed|cancelled):(all|new)$/,
    async (ctx) => {
      const bookingId = ctx.match[1];
      const status = ctx.match[2] as
        | "confirmed"
        | "completed"
        | "cancelled"
        | undefined;
      const filter = ctx.match[3] as AdminFilter | undefined;

      if (!bookingId || !status || !filter) {
        await ctx.answerCallbackQuery({ text: "Не удалось обновить статус" });
        return;
      }

      await updateAdminBookingStatus(ctx, bookingId, status, filter);
    },
  );

  bot.callbackQuery(
    /^admin:consultation:status:([^:]+):(new|in_progress|resolved):(all|new)$/,
    async (ctx) => {
      const consultationId = ctx.match[1];
      const status = ctx.match[2] as
        | "new"
        | "in_progress"
        | "resolved"
        | undefined;
      const filter = ctx.match[3] as AdminFilter | undefined;

      if (!consultationId || !status || !filter) {
        await ctx.answerCallbackQuery({ text: "Не удалось обновить статус" });
        return;
      }

      await updateAdminConsultationStatus(ctx, consultationId, status, filter);
    },
  );

  bot.callbackQuery("cancel", async (ctx) => {
    await ctx.answerCallbackQuery({ text: "Сценарий отменен" });
    await cancelFlow(ctx);
  });

  bot.callbackQuery("back", async (ctx) => {
    await ctx.answerCallbackQuery();
    await goBack(ctx);
  });

  bot.callbackQuery("action:book", async (ctx) => {
    await ctx.answerCallbackQuery();
    await startBooking(ctx);
  });

  bot.callbackQuery("action:consult", async (ctx) => {
    await ctx.answerCallbackQuery();
    await startConsultation(ctx);
  });

  bot.callbackQuery(/^faq:(.+)$/, async (ctx) => {
    const faqId = ctx.match[1];

    await ctx.answerCallbackQuery();

    if (!faqId) {
      await ctx.reply("Не удалось распознать вопрос. Попробуйте еще раз.");
      return;
    }

    const item = getFaqById(faqId);

    if (!item) {
      await ctx.reply("Не нашел этот FAQ. Попробуйте выбрать другой вопрос.");
      return;
    }

    await ctx.reply(formatFaqAnswer(item.question, item.answer), {
      reply_markup: infoActionsKeyboard(),
    });
  });

  bot.callbackQuery(/^book:branch:(.+)$/, async (ctx) => {
    if (ctx.session.flow !== "booking" || currentBookingStep(ctx) !== "branch") {
      await ctx.answerCallbackQuery({ text: "Начните бронь заново через меню." });
      return;
    }

    const branchId = ctx.match[1];
    if (!branchId) {
      await ctx.answerCallbackQuery({ text: "Филиал не найден" });
      return;
    }

    const branch = getBranchById(branchId);

    if (!branch) {
      await ctx.answerCallbackQuery({ text: "Филиал не найден" });
      return;
    }

    ctx.session.bookingDraft.branchId = branch.id;

    await ctx.answerCallbackQuery({ text: `Филиал: ${branch.name}` });
    await dismissInlineKeyboard(ctx);
    await sendBookingDatePrompt(ctx);
  });

  bot.callbackQuery(/^book:date:(.+)$/, async (ctx) => {
    if (ctx.session.flow !== "booking" || currentBookingStep(ctx) !== "date") {
      await ctx.answerCallbackQuery({ text: "Сначала выберите филиал." });
      return;
    }

    const date = ctx.match[1];
    if (!date) {
      await ctx.answerCallbackQuery({ text: "Дата не найдена" });
      return;
    }

    ctx.session.bookingDraft.date = date;

    await ctx.answerCallbackQuery({ text: "Дата сохранена" });
    await dismissInlineKeyboard(ctx);
    await sendBookingTimePrompt(ctx);
  });

  bot.callbackQuery(/^book:time:(.+)$/, async (ctx) => {
    if (ctx.session.flow !== "booking" || currentBookingStep(ctx) !== "time") {
      await ctx.answerCallbackQuery({ text: "Сначала выберите дату." });
      return;
    }

    const time = ctx.match[1];
    if (!time) {
      await ctx.answerCallbackQuery({ text: "Время не найдено" });
      return;
    }

    ctx.session.bookingDraft.time = time;

    await ctx.answerCallbackQuery({ text: "Время сохранено" });
    await dismissInlineKeyboard(ctx);
    await sendGuestPrompt(ctx);
  });

  bot.callbackQuery(/^book:strength:(.+)$/, async (ctx) => {
    if (ctx.session.flow !== "booking" || currentBookingStep(ctx) !== "strength") {
      await ctx.answerCallbackQuery({ text: "Сначала укажите количество гостей." });
      return;
    }

    const strengthId = ctx.match[1];
    if (!strengthId) {
      await ctx.answerCallbackQuery({ text: "Крепость не найдена" });
      return;
    }

    ctx.session.bookingDraft.strengthId = strengthId;

    await ctx.answerCallbackQuery({ text: "Крепость сохранена" });
    await dismissInlineKeyboard(ctx);
    await sendFlavorPrompt(ctx);
  });

  bot.callbackQuery("book:edit", async (ctx) => {
    if (ctx.session.flow !== "booking" || currentBookingStep(ctx) !== "confirm") {
      await ctx.answerCallbackQuery({ text: "Сценарий брони уже завершен." });
      return;
    }

    await ctx.answerCallbackQuery({ text: "Вернул на редактирование" });
    await dismissInlineKeyboard(ctx);
    await sendBookingCommentPrompt(ctx);
  });

  bot.callbackQuery("book:confirm", async (ctx) => {
    if (ctx.session.flow !== "booking" || currentBookingStep(ctx) !== "confirm") {
      await ctx.answerCallbackQuery({ text: "Сценарий брони уже завершен." });
      return;
    }

    await ctx.answerCallbackQuery({ text: "Сохраняю бронь" });
    await dismissInlineKeyboard(ctx);
    await finishBooking(ctx);
  });

  bot.callbackQuery(/^consult:topic:(.+)$/, async (ctx) => {
    if (ctx.session.flow !== "consultation" || currentConsultationStep(ctx) !== "topic") {
      await ctx.answerCallbackQuery({ text: "Начните консультацию заново через меню." });
      return;
    }

    const topicId = ctx.match[1];
    if (!topicId) {
      await ctx.answerCallbackQuery({ text: "Тема не найдена" });
      return;
    }

    const topic = getConsultationTopicById(topicId);

    if (!topic) {
      await ctx.answerCallbackQuery({ text: "Тема не найдена" });
      return;
    }

    ctx.session.consultationDraft.topicId = topic.id;

    await ctx.answerCallbackQuery({ text: `Тема: ${topic.title}` });
    await dismissInlineKeyboard(ctx);
    await sendConsultationQuestionPrompt(ctx);
  });

  bot.callbackQuery("consult:edit", async (ctx) => {
    if (ctx.session.flow !== "consultation" || currentConsultationStep(ctx) !== "confirm") {
      await ctx.answerCallbackQuery({ text: "Сценарий консультации уже завершен." });
      return;
    }

    await ctx.answerCallbackQuery({ text: "Вернул на редактирование" });
    await dismissInlineKeyboard(ctx);
    await sendConsultationPhonePrompt(ctx);
  });

  bot.callbackQuery("consult:confirm", async (ctx) => {
    if (ctx.session.flow !== "consultation" || currentConsultationStep(ctx) !== "confirm") {
      await ctx.answerCallbackQuery({ text: "Сценарий консультации уже завершен." });
      return;
    }

    await ctx.answerCallbackQuery({ text: "Отправляю заявку" });
    await dismissInlineKeyboard(ctx);
    await finishConsultation(ctx);
  });

  bot.on("message:contact", async (ctx) => {
    const phone = normalizePhone(ctx.msg.contact.phone_number);

    if (!phone) {
      await ctx.reply("Не получилось распознать номер. Отправьте его текстом, например +79991234567.");
      return;
    }

    if (ctx.session.flow === "booking" && currentBookingStep(ctx) === "phone") {
      ctx.session.bookingDraft.phone = phone;
      await sendBookingCommentPrompt(ctx);
      return;
    }

    if (ctx.session.flow === "consultation" && currentConsultationStep(ctx) === "phone") {
      ctx.session.consultationDraft.phone = phone;
      await sendConsultationConfirmation(ctx);
      return;
    }

    await ctx.reply("Контакт получен. Выберите действие из меню.", {
      reply_markup: menuKeyboardFor(ctx),
    });
  });

  bot.on("message:text", async (ctx) => {
    const text = ctx.msg.text.trim();

    if (ctx.session.flow === "booking") {
      switch (currentBookingStep(ctx)) {
        case "guests": {
          const guests = parseGuestCount(text);

          if (!guests) {
            await ctx.reply("Нужно число от 1 до 12. Например: 2, 4 или 6.");
            return;
          }

          ctx.session.bookingDraft.guests = guests;
          await sendStrengthPrompt(ctx);
          return;
        }
        case "flavor":
          ctx.session.bookingDraft.flavorNotes = text;
          await sendBookingPhonePrompt(ctx);
          return;
        case "phone": {
          const phone = normalizePhone(text);

          if (!phone) {
            await ctx.reply("Не получилось распознать номер. Пример: +79991234567.");
            return;
          }

          ctx.session.bookingDraft.phone = phone;
          await sendBookingCommentPrompt(ctx);
          return;
        }
        case "comment":
          ctx.session.bookingDraft.comment = text;
          await sendBookingConfirmation(ctx);
          return;
        case "branch":
        case "date":
        case "time":
        case "strength":
        case "confirm":
          await ctx.reply("На этом шаге удобнее выбрать вариант кнопкой ниже.");
          return;
        default:
          break;
      }
    }

    if (ctx.session.flow === "consultation") {
      switch (currentConsultationStep(ctx)) {
        case "question":
          ctx.session.consultationDraft.question = text;
          await sendConsultationPhonePrompt(ctx);
          return;
        case "phone": {
          const phone = normalizePhone(text);

          if (!phone) {
            await ctx.reply("Не получилось распознать номер. Пример: +79991234567.");
            return;
          }

          ctx.session.consultationDraft.phone = phone;
          await sendConsultationConfirmation(ctx);
          return;
        }
        case "topic":
        case "confirm":
          await ctx.reply("На этом шаге лучше выбрать вариант кнопкой.");
          return;
        default:
          break;
      }
    }

    await ctx.reply(
      "Я могу помочь с бронью, консультацией, FAQ и контактами. Выберите действие в меню ниже.",
      {
        reply_markup: menuKeyboardFor(ctx),
      },
    );
  });

  return bot;
}
