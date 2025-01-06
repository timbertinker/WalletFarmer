import { InlineKeyboard } from "grammy";

import SolanaWallet from "../../../model/SolanaWallet.js";
import User from "../../../model/User.js";
import { checkSolanaSubWallet } from "../../../solana/checkSubWallet.js";
import { depositToSubWallet } from "../../../solana/depositToSubWallet.js";
import { wrapFromSubWallet } from "../../../solana/wrapFromSubWallet.js";

const CAPTION_SOLANA_MANAGE_SUB_WALLET =
  "❓How many wallet would you like to create?\n💡We will create randomized wallet for you.";

const SolanaManageSubWalletKeyboard = new InlineKeyboard()
  .row()
  .text("Create Sub Wallets", "solana_input_crerate_sub_wallets")
  .row()
  .text("Deposit Amount", "solana_input_deposite_amount")
  .row()
  .text("Deposit", "solana_input_deposite_sub_wallet")
  .text("Wrap", "solana_input_wrap_sub_wallet")
  .row()
  .text("Check Sub Wallets", "solana_input_check_sub_wallets")
  .row()
  .text("Back", "back_to_solana");

export const returnToManageSubWallet = async (tgBot, ctx, isCallbackQuery = false) => {
  if (ctx.session.previousMessage) tgBot.api.deleteMessage(ctx.chat.id, ctx.session.previousMessage);
  const message = await ctx.replyWithPhoto(process.env.LOGO_SOLANA_VOLUME, {
    caption: CAPTION_SOLANA_MANAGE_SUB_WALLET,
    reply_markup: SolanaManageSubWalletKeyboard,
  });
  ctx.session.previousMessage = message.message_id;
  if (isCallbackQuery) {
    await ctx.answerCallbackQuery();
  }
};

export const addCallbackQueries = async (tgBot) => {
  tgBot.callbackQuery("solana_input_crerate_sub_wallets", async (ctx) => {
    ctx.session.state = "solana_input_crerate_sub_wallets";
    await ctx.reply("Please enter the number of wallets you want to create");
    await ctx.answerCallbackQuery();
  });
  tgBot.callbackQuery("solana_input_deposite_amount", async (ctx) => {
    ctx.session.state = "solana_input_deposite_amount";
    await ctx.reply("Please input the default amount that will be sent from user wallet to each generated wallets");
    await ctx.answerCallbackQuery();
  });
  tgBot.callbackQuery("solana_input_deposite_sub_wallet", async (ctx) => {
    await ctx.reply("Please wait for a moment");
    var user = await User.findOne({ username: ctx.from.username });
    var mainWallet = await SolanaWallet.findOne({ createdBy: ctx.from.username, isMain: true });
    var wallets = await SolanaWallet.find({ createdBy: ctx.from.username, isMain: false });
    if (wallets == null || wallets.length == 0) return await ctx.reply("There is no sub wallets to deposit");
    for (let i = 0; i < wallets.length; i++) {
      let wallet = wallets[i];
      try {
        var retVal = await depositToSubWallet(mainWallet.privateKey, wallet.privateKey, user.defaultAmountForSolana);
        await ctx.reply(retVal);
      } catch (error) {
        await ctx.reply(`Error: ${error.message || error}`);
      }
    }
    await ctx.answerCallbackQuery();
  });
  tgBot.callbackQuery("solana_input_wrap_sub_wallet", async (ctx) => {
    await ctx.reply("Please wait for a moment");
    var mainWallet = await SolanaWallet.findOne({ createdBy: ctx.from.username, isMain: true });
    var wallets = await SolanaWallet.find({ createdBy: ctx.from.username, isMain: false });
    if (wallets == null || wallets.length == 0) return await ctx.reply("There is no sub wallets to wrap");
    for (let i = 0; i < wallets.length; i++) {
      let wallet = wallets[i];
      try {
        var retVal = await wrapFromSubWallet(mainWallet.privateKey, wallet.privateKey);
        await ctx.reply(retVal);
      } catch (error) {
        await ctx.reply(`Error: ${error.message || error}`);
      }
    }
    await ctx.answerCallbackQuery();
  });
  tgBot.callbackQuery("solana_input_check_sub_wallets", async (ctx) => {
    var wallets = await SolanaWallet.find({ createdBy: ctx.from.username, isMain: false });
    if (wallets == null || wallets.length == 0) {
      await ctx.reply("There is no sub wallets to check");
      return await ctx.answerCallbackQuery();
    }
    for (let i = 0; i < wallets.length; i++) {
      let wallet = wallets[i];
      try {
        var retVal = await checkSolanaSubWallet(wallet.privateKey);
        await ctx.reply(retVal);
      } catch (error) {
        await ctx.reply(`Error: ${error.message || error}`);
      }
    }
    await ctx.answerCallbackQuery();
  });
};
