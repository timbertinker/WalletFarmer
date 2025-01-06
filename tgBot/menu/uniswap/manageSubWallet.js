import { InlineKeyboard } from "grammy";

import EtherWallet from "../../../model/EtherWallet.js";
import User from "../../../model/User.js";
import { checkSubWallet } from "../../../uniswap/checkSubWallet.js";
import { depositToSubWallet } from "../../../uniswap/depositToSubWallet.js";
import { wrapToMainWallet } from "../../../uniswap/wrapToMainWallet.js";

const CAPTION_UNISWAP_CREATE =
  "❓How many wallet would you like to create?\n💡We will create randomized wallet for you.";

const UniswapInputWalletCountKeyboard = new InlineKeyboard()
  .row()
  .text("Create Sub Wallets", "uniswap_create_sub_wallets")
  .row()
  .text("Default Amount", "uniswap_default_amount")
  .row()
  .text("Deposit", "uniswap_deposite_sub_wallets")
  .text("Wrap", "uniswap_input_wrap_sub_wallets")
  .row()
  .text("Check Sub Wallets", "uniswap_check_sub_wallets")
  .row()
  .text("Back", "back_to_uniswap");

export const returnToManageSubWallet = async (tgBot, ctx, isCallbackQuery = false) => {
  if (ctx.session.previousMessage) tgBot.api.deleteMessage(ctx.chat.id, ctx.session.previousMessage);
  const message = await ctx.replyWithPhoto(process.env.LOGO_UNISWAP_VOLUME, {
    caption: CAPTION_UNISWAP_CREATE,
    reply_markup: UniswapInputWalletCountKeyboard,
  });
  ctx.session.previousMessage = message.message_id;
  if (isCallbackQuery) {
    await ctx.answerCallbackQuery();
  }
};

export const addCallbackQueries = async (tgBot) => {
  tgBot.callbackQuery("uniswap_create_sub_wallets", async (ctx) => {
    ctx.session.state = "uniswap_create_sub_wallets";
    await ctx.reply("Please enter the number of wallets you want to create");
    await ctx.answerCallbackQuery();
  });
  tgBot.callbackQuery("uniswap_default_amount", async (ctx) => {
    ctx.session.state = "uniswap_default_amount";
    await ctx.reply("Please input the default amount that will be sent from user wallet to each generated wallets");
    await ctx.answerCallbackQuery();
  });
  tgBot.callbackQuery("uniswap_deposite_sub_wallets", async (ctx) => {
    await ctx.reply("Please wait for a moment");
    var user = await User.findOne({ username: ctx.from.username });
    var mainWallet = await EtherWallet.findOne({ createdBy: ctx.from.username, isMain: true });
    var wallets = await EtherWallet.find({ createdBy: ctx.from.username, isMain: false });
    if (wallets == null || wallets.length == 0) return await ctx.reply("There is no sub wallets to deposit");
    for (let i = 0; i < wallets.length; i++) {
      let wallet = wallets[i];
      await ctx.reply(await depositToSubWallet(wallet.privateKey, mainWallet.privateKey, user.defaultAmountForEther));
    }
    await ctx.answerCallbackQuery();
  });
  tgBot.callbackQuery("uniswap_input_wrap_sub_wallets", async (ctx) => {
    await ctx.reply("Please wait for a moment");
    var mainWallet = await EtherWallet.findOne({ createdBy: ctx.from.username, isMain: true });
    var wallets = await EtherWallet.find({ createdBy: ctx.from.username, isMain: false });
    if (wallets == null || wallets.length == 0) return await ctx.reply("There is no sub wallets to wrap");
    for (let i = 0; i < wallets.length; i++) {
      let wallet = wallets[i];
      await ctx.reply(await wrapToMainWallet(wallet.privateKey, mainWallet.privateKey));
    }
    await ctx.answerCallbackQuery();
  });
  tgBot.callbackQuery("uniswap_check_sub_wallets", async (ctx) => {
    var wallets = await EtherWallet.find({ createdBy: ctx.from.username, isMain: false });
    if (wallets == null || wallets.length == 0) {
      await ctx.reply("There is no sub wallets to check");
      return await ctx.answerCallbackQuery();
    }
    for (let i = 0; i < wallets.length; i++) {
      let wallet = wallets[i];
      try {
        await ctx.reply(await checkSubWallet(wallet.privateKey));
      } catch (error) {
        await ctx.reply(`Error: ${error.message || error}`);
      }
    }
    await ctx.answerCallbackQuery();
  });
};
