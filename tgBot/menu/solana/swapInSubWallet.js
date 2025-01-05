import { InlineKeyboard } from "grammy";
import { swapJupiter } from "../../../solana/swapJupiter.js";
import SolanaWallet from '../../../model/SolanaWallet.js';
import User from '../../../model/User.js';

const CAPTION_SOLANA_SWAP = "Here you can swap between token and sol on sub wallet";

const SolanaInputSwapInSubWalletKeyboard = new InlineKeyboard()
        .row().text("Swap Amount", "solana_swap_amount")
        .row().text("Repeat Count", "solana_repeat_count")
        .row().text("Swap", "solana_input_swap")
        .row().text("Token Address", "solana_input_swap_token_address")
        .row().text("Check Token Address", "solana_input_swap_check_token_address")
        .row().text('Back','back_to_solana');

export const returnToSwapInSubWallet = async (tgBot, ctx) => {
    if (ctx.session.previousMessage)
        tgBot.api.deleteMessage(ctx.chat.id, ctx.session.previousMessage);
    const message = await ctx.replyWithPhoto(
        process.env.LOGO_SOLANA_VOLUME,
        {
            caption: CAPTION_SOLANA_SWAP,
            reply_markup: SolanaInputSwapInSubWalletKeyboard
        }
    )
    ctx.session.previousMessage = message.message_id;
}

export const addCallbackQueries = async (tgBot) => {
    tgBot.callbackQuery("solana_input_swap", async (ctx) => {
        await ctx.replyWithChatAction("typing");
        var user = await User.findOne({ username: ctx.from.username });
        var amount = user.swapAmountForSolana;
        var wallets = await SolanaWallet.find({ createdBy: ctx.from.username, isMain: false });
        if (wallets == null || wallets.length == 0)
            return await ctx.reply("There is no sub wallets to swap");
        for (let i = 0; i < wallets.length; i++){
            let wallet = wallets[i];
            let retVal = await swapJupiter(Math.random() < 0.5, amount, wallet.privateKey, user.solanaTokenAddress, user.solanaTokenDecimal, user.solanaTokenName);
            await ctx.reply(retVal);
        }
    });

    tgBot.callbackQuery("solana_swap_amount", async (ctx) => {
        ctx.session.state = "solana_swap_amount";
        await ctx.reply("Please input the swap amount that we will wrap into token for buy/sell");
    });

    tgBot.callbackQuery("solana_repeat_count", async (ctx) => {
        ctx.session.state = "solana_repeat_count";
        await ctx.reply("Please input the repeat count to buy/sell for each wallet");
    });
    
    tgBot.callbackQuery("solana_input_swap_token_address", async (ctx) => {
        ctx.session.state = "solana_input_swap_token_address";
        await ctx.reply("Please input the token address that you need to volume up");
    });

    tgBot.callbackQuery("solana_input_swap_check_token_address", async (ctx) => {
       var  user = await User.findOne({ username: ctx.from.username });
       if (user.solanaTokenAddress)
        await ctx.reply(`-Token Address: ${user.solanaTokenAddress}\n\n-Token Decimals: ${user.solanaTokenDecimal}\n\n-Token Name: ${user.solanaTokenName}`);
       else
        await ctx.reply("Please input token address to volume up");
    });
}