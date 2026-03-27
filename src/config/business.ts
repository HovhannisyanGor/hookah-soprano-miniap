import {
  type Branch,
  type BusinessConfig,
  type ConsultationTopic,
  type FAQItem,
  type StrengthOption,
} from "../types.js";

export const business: BusinessConfig = {
  name: "Hookah Soprano",
  tagline: "Бронь кальяна и консультация в одном Telegram-боте",
  hero:
    "Подберем удобное время, филиал, крепость и вкусовой профиль без лишней переписки.",
  phone: "+7 (999) 123-45-67",
  managerHandle: "@hookahsoprano_manager",
  responseWindow: "обычно отвечаем в течение 5-10 минут",
  branches: [
    {
      id: "center",
      name: "Hookah Soprano Center",
      address: "ул. Петровка, 21",
      nearestMetro: "м. Трубная",
      hours: "ежедневно 12:00-02:00",
      phone: "+7 (999) 123-45-67",
    },
    {
      id: "river",
      name: "Hookah Soprano Riverside",
      address: "Пресненская наб., 8",
      nearestMetro: "м. Деловой центр",
      hours: "ежедневно 14:00-03:00",
      phone: "+7 (999) 765-43-21",
    },
  ],
  timeSlots: [
    "12:00",
    "14:00",
    "16:00",
    "18:00",
    "20:00",
    "22:00",
    "23:30",
    "01:00",
  ],
  services: [
    {
      name: "Standard Bowl",
      price: "от 1 800 ₽",
      description: "классические вкусы, мягкая посадка и комфортный дым",
    },
    {
      name: "Signature Mix",
      price: "от 2 500 ₽",
      description: "авторские миксы с подбором под настроение и формат встречи",
    },
    {
      name: "Tea Pairing",
      price: "от 900 ₽",
      description: "чайная карта с рекомендациями под выбранный вкус",
    },
  ],
  strengths: [
    {
      id: "soft",
      title: "Легкий",
      note: "мягко, спокойно, без сильной никотиновой нагрузки",
    },
    {
      id: "medium",
      title: "Средний",
      note: "самый популярный сбалансированный вариант",
    },
    {
      id: "strong",
      title: "Крепкий",
      note: "яркий никотиновый профиль для опытных гостей",
    },
  ],
  consultationTopics: [
    {
      id: "mixes",
      title: "Подбор вкуса",
      prompt:
        "Расскажите, какие ноты вам нравятся: ягоды, цитрус, десерт, чай, специи или что-то необычное.",
    },
    {
      id: "strength",
      title: "Подбор крепости",
      prompt:
        "Опишите ваш опыт и желаемую крепость, а мы предложим комфортный вариант.",
    },
    {
      id: "event",
      title: "Бронь на событие",
      prompt:
        "Напишите, что за формат: свидание, встреча с друзьями, день рождения или корпоратив.",
    },
    {
      id: "custom",
      title: "Свой вопрос",
      prompt: "Задайте вопрос в свободной форме, менеджер подхватит диалог.",
    },
  ],
  faq: [
    {
      id: "deposit",
      question: "Нужен ли депозит при брони?",
      answer:
        "В демо-логике депозит не списывается автоматически. Обычно его можно включить отдельным шагом после согласования условий.",
    },
    {
      id: "duration",
      question: "На сколько времени бронируется стол?",
      answer:
        "Базовый слот можно считать на 2 часа, а дальше администратор уточнит детали и продлит бронь при необходимости.",
    },
    {
      id: "nicotine",
      question: "Можно ли подобрать совсем легкий кальян?",
      answer:
        "Да, бот собирает пожелания по крепости, а менеджер может доуточнить вкусовой профиль и предложить мягкие миксы.",
    },
  ],
};

export function getBranchById(branchId: string): Branch | undefined {
  return business.branches.find((branch) => branch.id === branchId);
}

export function getStrengthById(strengthId: string): StrengthOption | undefined {
  return business.strengths.find((strength) => strength.id === strengthId);
}

export function getConsultationTopicById(
  topicId: string,
): ConsultationTopic | undefined {
  return business.consultationTopics.find((topic) => topic.id === topicId);
}

export function getFaqById(faqId: string): FAQItem | undefined {
  return business.faq.find((item) => item.id === faqId);
}
