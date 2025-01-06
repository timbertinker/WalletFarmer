import { InlineKeyboard } from "grammy";

import { returnToManageMainWallet } from "./manageMainWallet.js";
import { addCallbackQueries as addMainCallbackQueries } from "./manageMainWallet.js";
import { returnToManageSubWallet } from "./manageSubWallet.js";
import { addCallbackQueries as addSubCallbackQueries } from "./manageSubWallet.js";
import { returnToSwapInSubWallet } from "./swapInSubWallet.js";
import { addCallbackQueries as addSwapCallbackQueries } from "./swapInSubWallet.js";

const CAPTION_SOLANA =
  "🚀Here you can create Solana wallets and engage in trading between them to increase the volume of the token.\n Please choose one to create or swap.";

const SolanaInputMainKeyboard = new InlineKeyboard()
  .row()
  .text("Manage Main Wallet", "solana_input_manage_main_wallet")
  .row()
  .text("Manage Sub Wallets", "solana_input_manage_sub_wallets")
  .row()
  .text("Swap on Sub Wallets", "solana_input_swap_on_sub_wallets")
  .row()
  .text("Back To Main", "back_to_first");

export const returnToSolana = async (tgBot, ctx) => {
  if (ctx.session.previousMessage) tgBot.api.deleteMessage(ctx.chat.id, ctx.session.previousMessage);
  const message = await ctx.replyWithPhoto(process.env.LOGO_SOLANA_VOLUME, {
    caption: CAPTION_SOLANA,
    reply_markup: SolanaInputMainKeyboard,
  });
  ctx.session.previousMessage = message.message_id;
  await ctx.answerCallbackQuery();
};

export const addCallbackQueries = (tgBot) => {
  tgBot.callbackQuery("solana_input_manage_main_wallet", async (ctx) => {
    await returnToManageMainWallet(tgBot, ctx, true);
  });
  tgBot.callbackQuery("solana_input_manage_sub_wallets", async (ctx) => {
    await returnToManageSubWallet(tgBot, ctx, true);
  });
  tgBot.callbackQuery("solana_input_swap_on_sub_wallets", async (ctx) => {
    returnToSwapInSubWallet(tgBot, ctx);
  });
  tgBot.callbackQuery("back_to_solana", async (ctx) => {
    await returnToSolana(tgBot, ctx);
  });
  addMainCallbackQueries(tgBot);
  addSubCallbackQueries(tgBot);
  addSwapCallbackQueries(tgBot);
};
