import { InlineKeyboard } from "grammy";
import { createSolanaMainWallet } from "../../../solana/createMainWallet.js";
import { retrieveMainWalletAddress } from "../../../solana/retrieveMainWalletAddress.js";
import { checkSolanaMainWallet } from "../../../solana/checkMainWallet.js";

const CAPTION_SOLANA_MANAGE_MAIN_WALLET = "❓How many wallet would you like to create?\n💡We will create randomized wallet for you.";

const SolanaManageMainWalletKeyboard = new InlineKeyboard()
        .row().text("Create Main Wallet", "solana_input_create_main_wallet")
        .row().text("Deposit", "solana_input_deposite_main_wallet").text("Withdraw", "solana_input_withdraw_main_wallet")
        .row().text("Check Main Wallet", "solana_input_check_main_wallet")
        .row().text('Back To Main','back_to_solana');

export const returnToManageMainWallet = async (tgBot, ctx) => {
    if (ctx.session.previousMessage)
        tgBot.api.deleteMessage(ctx.chat.id, ctx.session.previousMessage);
    const message = await ctx.replyWithPhoto(
        process.env.LOGO_SOLANA_VOLUME,
        {
            caption: CAPTION_SOLANA_MANAGE_MAIN_WALLET,
            reply_markup: SolanaManageMainWalletKeyboard
        }
    )
    ctx.session.previousMessage = message.message_id;
}

export const addCallbackQueries = async (tgBot) => {
    tgBot.callbackQuery('solana_input_create_main_wallet', async (ctx) => {
        await ctx.reply("It will create one main wallet for you. Please wait for a moment.");
        try {
            var retVal = await createSolanaMainWallet(ctx);
            await ctx.reply(retVal);
        } catch (error) {
            await ctx.reply(`Error: ${error.message || error}`);
        }
    });
    tgBot.callbackQuery('solana_input_deposite_main_wallet', async (ctx) => {
        await ctx.reply("Here is your main wallet address.\nPlease deposit SOL as you want.");
        try {
            var retVal = await retrieveMainWalletAddress(ctx);
            await ctx.reply(retVal.toString());
        }catch (error) {
            await ctx.reply(`Error: ${error.message || error}`);
        }
    });
    tgBot.callbackQuery('solana_input_withdraw_main_wallet', async (ctx) => {
        ctx.session.state = "solana_input_withdraw_main_wallet";
        await ctx.reply("Please input your personal wallet address.\nInput (empty) to return.");
    });
    tgBot.callbackQuery('solana_input_check_main_wallet', async (ctx) => {
        try {
            var retVal = await checkSolanaMainWallet(ctx);
            await ctx.reply(retVal)
        }catch (error) {
            await ctx.reply(`Error: ${error.message || error}`);
        }
    });
}