import { InlineKeyboard } from "grammy";
import { createMainWallet } from "../../../uniswap/createMainwallet.js";
import EtherWallet from '../../../model/EtherWallet.js';
import { checkMainWallet } from "../../../uniswap/checkMainWallet.js";

const CAPTION_MANAGE_UNISWP_MAIN_WALLET = "🦄Here you can manage your main wallet🦄\n You can deposit to your main wallet from your personal wallet or withdraw from main wallet to your personal wallet.\n";

const UniswapManageMainwallet = new InlineKeyboard()
        .row().text("Create Main Wallet", "uniswap_input_create_main_wallet")
        .row().text("Deposit", "uniswap_input_deposit_main_wallet").text("Withdraw", "uniswap_input_withdraw_main_wallet")
        .row().text("Check Main Wallet", "uniswap_input_check_main_wallet")
        .row().text("Back", "back_to_uniswap")

export const returnToManageMainWallet = async (tgBot, ctx) => {
    if (ctx.session.previousMessage)
        tgBot.api.deleteMessage(ctx.chat.id, ctx.session.previousMessage);
    const message = await ctx.replyWithPhoto(
        process.env.LOGO_UNISWAP_VOLUME,
        {
            caption: CAPTION_MANAGE_UNISWP_MAIN_WALLET,
            reply_markup: UniswapManageMainwallet
        }
    )
    ctx.session.previousMessage = message.message_id;
}

export const addCallbackQueries = async (tgBot) => {
    tgBot.callbackQuery("uniswap_input_create_main_wallet", async (ctx) => {
        await ctx.reply("It will create one main wallet for you. Please wait for a moment.");
        var retVal = await createMainWallet(ctx);
        await ctx.reply(retVal);
    });
    tgBot.callbackQuery("uniswap_input_deposit_main_wallet", async (ctx) => {
        await ctx.reply("Here is your main wallet address.\nPlease deposit ETH as you want.");
        var wallet = await EtherWallet.findOne({createdBy: ctx.from.username, isMain: true});
        await ctx.reply(wallet.address);
    });
    tgBot.callbackQuery("uniswap_input_withdraw_main_wallet", async (ctx) => {
        ctx.session.state = "uniswap_input_withdraw_main_wallet";
        await ctx.reply("Please input your personal wallet address.\nInput (empty) to return.");
    });
    tgBot.callbackQuery("uniswap_input_check_main_wallet", async (ctx) => {
        try {
            var retVal = await checkMainWallet(ctx);
            await ctx.reply(retVal);
        } catch (error) {
            await ctx.reply(`Error: ${error.message || error}`);
        }
    });
}