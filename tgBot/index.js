import { Bot, session } from "grammy";
import { addCallbackQueries } from './menu/main.js';

export const createTgBot = async () => {
    const tgBot = new Bot(process.env.BOT_TOKEN);
    const initial = () => {
        return {};
    };
    tgBot.use(session({ initial }));
    tgBot.catch((error) => {
        console.error("Error in bot:", error);
        if (error.message.includes("Cannot read properties of null (reading 'items')")){
            console.log("Detected critical error. Please restart the server...");
        }
    });
    addCallbackQueries(tgBot);
    await tgBot.api.deleteWebhook();
    tgBot.start();
    console.info("Bot started!");
    return tgBot;
}