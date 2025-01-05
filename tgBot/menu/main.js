import { InlineKeyboard } from "grammy";
import { returnToUniswap } from "./uniswap/uniswap.js";
import { returnToSolana } from "./solana/solana.js";
import { addCallbackQueries as addUniswapCallbackQueries } from "./uniswap/uniswap.js";
import { addCallbackQueries as addSolanaCallbackQueries } from "./solana/solana.js";
import { addKeyEvent } from './keyEvent.js';

const CAPTION_MAIN = "👋 The Volume Bot welcomes you!\n💡Detailed info for this bot\n";

const mainKeyboard = new InlineKeyboard()
        .row().text('🦄UniswapV2🦄', "UniswapV2")
        .row().text('🚀Solana🚀', "Solana")

const returnToMain = async (tgBot, ctx) => {
    if (ctx.session.previousMessage)
        tgBot.api.deleteMessage(ctx.chat.id, ctx.session.previousMessage);
    const message = await ctx.replyWithPhoto(
        process.env.LOGO_MAIN,
        {
            caption: CAPTION_MAIN,
            reply_markup: mainKeyboard,
        }
    );
    ctx.session.previousMessage = message.message_id;
}

export const addCallbackQueries = (tgBot) => {
    tgBot.command("start", async (ctx) => {
        await returnToMain(tgBot, ctx);
    });
    tgBot.callbackQuery("UniswapV2", async (ctx) => {
        await returnToUniswap(tgBot,ctx);
    });

    tgBot.callbackQuery("Solana", async (ctx) => {
        await returnToSolana(tgBot,ctx);
    });
    tgBot.callbackQuery('back_to_first', async (ctx) => {
        await returnToMain(tgBot, ctx);
    });
    addUniswapCallbackQueries(tgBot);
    addSolanaCallbackQueries(tgBot);
    addKeyEvent(tgBot);
}