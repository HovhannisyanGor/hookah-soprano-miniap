import { createBot } from "./bot.js";
import { assertEnv, env, isPublicHttpsUrl } from "./config/env.js";

async function main(): Promise<void> {
  assertEnv();

  const bot = createBot();

  await bot.api.setMyCommands([
    { command: "start", description: "Открыть главное меню" },
    { command: "menu", description: "Показать главное меню" },
    { command: "admin", description: "Краткая admin-сводка" },
  ]);

  if (isPublicHttpsUrl(env.miniAppUrl)) {
    await bot.api.setChatMenuButton({
      menu_button: {
        type: "web_app",
        text: "Открыть Mini App",
        web_app: {
          url: env.miniAppUrl,
        },
      },
    });
  }

  await bot.start({
    onStart: () => {
      console.log("Hookah Soprano bot started");
    },
  });
}

main().catch((error) => {
  console.error("Failed to start bot", error);
  process.exitCode = 1;
});
