import { InlineKeyboard } from "grammy";
import { swapTokens } from '../../../uniswap/swapTokens.js';
import EtherWallet from '../../../model/EtherWallet.js';
import User from '../../../model/User.js';

const CAPTION_UNISWAP_SWAP = "Here you can swap between weth and ebt on sub wallet";

const UniswapInputSwapInSubWalletKeyboard = new InlineKeyboard()
        .row().text("Swap Amount", "uniswap_swap_amount")
        .row().text("Repeat Count", "uniswap_repeat_count")
        .row().text("Swap", "uniswap_input_swap")
        .row().text("Token Address", 'uniswap_input_swap_token_address')
        .row().text("Check Token Address", 'uniswap_input_swap_check_token_address')
        .row().text('Back','back_to_uniswap');

export const returnToSwapInSubWallet = async (tgBot, ctx) => {
    if (ctx.session.previousMessage)
        tgBot.api.deleteMessage(ctx.chat.id, ctx.session.previousMessage);
    const message = await ctx.replyWithPhoto(
        process.env.LOGO_UNISWAP_VOLUME,
        {
            caption: CAPTION_UNISWAP_SWAP,
            reply_markup: UniswapInputSwapInSubWalletKeyboard
        }
    )
    ctx.session.previousMessage = message.message_id;
}

export const addCallbackQueries = async (tgBot) => {
    tgBot.callbackQuery("uniswap_input_swap", async (ctx) => {
        await ctx.replyWithChatAction("typing");
        var wallets = await EtherWallet.find({ createdBy: ctx.from.username, isMain: false });
        var user = await User.findOne({ username: ctx.from.username });
        if (wallets == null || wallets.length == 0)
            return await ctx.reply("There is no sub wallets to swap");
        for (let i = 0; i < wallets.length; i++){
            let wallet = wallets[i];
            await ctx.reply(await swapTokens(wallet.privateKey, user.swapAmountForEther, Math.random() < 0.5, user.etherTokenAddress, user.etherTokenDecimal, user.etherTokenName));
        }
    });

    tgBot.callbackQuery("uniswap_swap_amount", async (ctx) => {
        ctx.session.state = "uniswap_swap_amount";
        await ctx.reply("Please input the swap amount that we will wrap into WETH for buy/sell");
    });

    tgBot.callbackQuery("uniswap_repeat_count", async (ctx) => {
        ctx.session.state = "uniswap_repeat_count";
        await ctx.reply("Please input the repeat count to buy/sell for each wallet");
    });

    tgBot.callbackQuery("uniswap_input_swap_token_address", async (ctx) => {
        ctx.session.state = "uniswap_input_swap_token_address";
        await ctx.reply("Please input the token address that you need to volume up");
    });

    tgBot.callbackQuery("uniswap_input_swap_check_token_address", async (ctx) => {
        var user = await User.findOne({ username: ctx.from.username });
        if (user.etherTokenAddress)
            await ctx.reply(`-Token Address: ${user.etherTokenAddress}\n\nToken Decimals: ${user.etherTokenDecimal}\n\nToken Name: ${user.etherTokenName}`);
        else
            await ctx.reply("Please input token address to volume up");
    });
}