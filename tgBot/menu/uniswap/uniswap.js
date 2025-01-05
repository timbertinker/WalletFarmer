import { InlineKeyboard } from "grammy";
import { returnToManageSubWallet } from "./manageSubWallet.js";
import { returnToManageMainWallet } from "./manageMainWallet.js";
import { returnToSwapInSubWallet } from "./swapInSubWallet.js";
import { addCallbackQueries as addMainCallbackQueries } from "./manageMainWallet.js";
import { addCallbackQueries as addSubCallbackQueries } from "./manageSubWallet.js";
import { addCallbackQueries as addSwapCallbackQueries } from "./swapInSubWallet.js";

const CAPTION_UNISWAP = "🦄Here you can create Uniswap wallets and engage in trading between them to increase the volume of the token.\n Please choose one to create or swap.";

const UniswapKeyboard = new InlineKeyboard()
        .row().text("Manage Main Wallet", "uniswap_input_manage_main_wallet")
        .row().text("Manage Sub Wallets", "uniswap_manage_sub_wallet")
        .row().text("Swap on Sub Wallets", "uniswap_swap_on_sub_wallet")
        .row().text("Back", "back_to_first");

export const returnToUniswap = async (tgBot, ctx) => {
    if (ctx.session.previousMessage)
        tgBot.api.deleteMessage(ctx.chat.id, ctx.session.previousMessage);
    const message = await ctx.replyWithPhoto(
        process.env.LOGO_UNISWAP_VOLUME,
        {
            caption: CAPTION_UNISWAP,
            reply_markup: UniswapKeyboard
        }
    )
    ctx.session.previousMessage = message.message_id;
}

export const addCallbackQueries = (tgBot) => {
    tgBot.callbackQuery("uniswap_input_manage_main_wallet", async (ctx) => {
        await returnToManageMainWallet(tgBot, ctx);
    });
    tgBot.callbackQuery("uniswap_manage_sub_wallet", async (ctx) => {
        await returnToManageSubWallet(tgBot, ctx);
    });
    tgBot.callbackQuery("uniswap_swap_on_sub_wallet", async (ctx) => {
        await returnToSwapInSubWallet(tgBot, ctx);
    })
    tgBot.callbackQuery("back_to_uniswap", async (ctx) => {
        await returnToUniswap(tgBot, ctx);
    })
    addMainCallbackQueries(tgBot);
    addSubCallbackQueries(tgBot);
    addSwapCallbackQueries(tgBot);
}