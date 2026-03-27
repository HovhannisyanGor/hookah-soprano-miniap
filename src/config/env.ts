import dotenv from "dotenv";

dotenv.config();

function parseAdminChatIds(value: string | undefined): number[] {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((chunk) => Number(chunk.trim()))
    .filter((chatId) => Number.isFinite(chatId));
}

export const env = {
  botToken: process.env.BOT_TOKEN?.trim() ?? "",
  adminChatIds: parseAdminChatIds(process.env.ADMIN_CHAT_IDS),
  dataFile: process.env.DATA_FILE?.trim() || "./data/runtime.json",
  miniAppUrl: process.env.MINIAPP_URL?.trim() || "http://localhost:3000",
};

export function isPublicHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isLocalUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return ["localhost", "127.0.0.1", "0.0.0.0"].includes(url.hostname);
  } catch {
    return false;
  }
}

export function assertEnv(): void {
  if (!env.botToken) {
    throw new Error(
      "Не найден BOT_TOKEN. Создайте .env на основе .env.example и укажите токен Telegram-бота.",
    );
  }
}
