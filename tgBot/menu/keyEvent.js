
import { returnToManageMainWallet as returnToUniswapMainWallet } from './uniswap/manageMainWallet.js';
import { returnToManageSubWallet as returnToUniswapSubWallet } from './uniswap/manageSubWallet.js';
import { returnToSwapInSubWallet as returnToUniswapSwapInSubWallet } from './uniswap/swapInSubWallet.js';
import { returnToManageMainWallet as returnToSolanaMainInSubWallet } from './solana/manageMainWallet.js';
import { returnToManageSubWallet as returnToSolanaSubInSubWallet } from './solana/manageSubWallet.js';
import { returnToSwapInSubWallet as returnToSolanaSwapInSubWallet } from './solana/swapInSubWallet.js';
import { wrapMainWallet } from '../../uniswap/wrapMainWallet.js';
import { createSubWallet } from '../../uniswap/createSubWallet.js';
import { createSolanaSubWallet } from '../../solana/createSubWallet.js';
import { wrapFromMainWallet } from '../../solana/wrapFromMainWallet.js';
import EtherWallet from '../../model/EtherWallet.js';
import SolanaWallet from '../../model/SolanaWallet.js';
import User from '../../model/User.js';
import { minimumDipositAmountForSolana } from '../../solana/constant.js';
export const addKeyEvent = (tgBot) => {
    tgBot.on("message:text", async (ctx) => {
        let user = await User.findOne({username: ctx.from.username})
        if (!user){
            user = new User();
            user.username = ctx.from.username;
        }
        if (ctx.session.state === 'uniswap_input_withdraw_main_wallet'){
            let yourAddress = ctx.message.text;
            var retVal = await wrapMainWallet(ctx, yourAddress);
            if (retVal.success){
                await ctx.reply(retVal.message);
                ctx.session.state = '';
                await returnToUniswapMainWallet(tgBot, ctx);
            }else{
                if (!yourAddress.includes("(empty)"))
                {
                    await ctx.reply(retVal.message);
                }else{
                    await ctx.reply(`You can try next time. Thanks`)
                }
            }
        }else if (ctx.session.state === 'uniswap_create_sub_wallets') {
            let numOfWallets = Number(ctx.message.text);
            if(isNaN(numOfWallets) || numOfWallets <= 0) {
                await ctx.reply('Invalid input. Please enter a positive number');  
            } else {  
                await ctx.reply(`${numOfWallets} wallets will be created`);
                ctx.session.state = '';
                var wlt = await EtherWallet.findOne({createdBy: ctx.from.username, isMain: true});
                var privateKey = wlt.privateKey;
                for (let i = 0; i < numOfWallets; i++){
                    await ctx.replyWithChatAction("typing");
                    await ctx.reply(await createSubWallet(user.defaultAmountForEther, privateKey, ctx));
                }
                await returnToUniswapSubWallet(tgBot, ctx);
            }
        } else if (ctx.session.state == "uniswap_default_amount") {
            let num = parseFloat(ctx.message.text);
            if(isNaN(num) || num <= 0) {
                await ctx.reply('Invalid input. Please enter a positive number');  
            } else {  
                await ctx.reply(`It will send ${num} ETH from user wallet to each generated wallet.`);
                ctx.session.state = '';
                user.defaultAmountForEther = num.toString();
                await returnToUniswapSubWallet(tgBot, ctx);
            }
        } else if (ctx.session.state == "uniswap_swap_amount") {
            let num = parseFloat(ctx.message.text);
            if(isNaN(num) || num <= 0) {
                await ctx.reply('Invalid input. Please enter a positive number');  
            } else {  
                await ctx.reply(`In each wallet, we will wrap ${num} ETH into WETH for buy/sell.`);
                ctx.session.state = '';
                user.swapAmountForEther = num.toString();
                await returnToUniswapSwapInSubWallet(tgBot, ctx);
            }
        } else if (ctx.session.state == "uniswap_repeat_count") {
            let num = Number(ctx.message.text);
            if(isNaN(num) || num <= 0) {
                await ctx.reply('Invalid input. Please enter a positive number');  
            } else {  
                await ctx.reply(`You can repeat ${num} buy/sell for each wallet.`);
                ctx.session.state = '';
                user.repeatCountForEther = num;
                await returnToUniswapSwapInSubWallet(tgBot, ctx);
            }
        } else if (ctx.session.state == "uniswap_input_swap_token_address") {
            let address = ctx.message.text;
            user.etherTokenAddress = address;
            ctx.session.state = "uniswap_input_swap_token_decimal";
            await ctx.reply("Please input the token decimal")
        } else if (ctx.session.state == "uniswap_input_swap_token_decimal"){
            let decimal = Number(ctx.message.text);
            if(isNaN(decimal) || decimal <= 0) {
                await ctx.reply('Invalid input. Please enter a positive number');  
            } else {  
                user.etherTokenDecimal = decimal;
                ctx.session.state = "uniswap_input_swap_token_name";
                await ctx.reply("Please input token name");
            }
        } else if (ctx.session.state == "uniswap_input_swap_token_name") {
            let name = ctx.message.text;
            user.etherTokenName = name;
            ctx.session.state = '';
        } else if (ctx.session.state == 'solana_input_crerate_sub_wallets') {
            let numOfWallets = Number(ctx.message.text);
            if(isNaN(numOfWallets) || numOfWallets <= 0) {
                await ctx.reply('Invalid input. Please enter a positive number');  
            } else {  
                await ctx.reply(`${numOfWallets} wallets will be created`);
                ctx.session.state = '';
                ctx.session.numOfSolanaWallets = numOfWallets;
                for (let i = 0; i < numOfWallets; i++) {
                    var retVal = await createSolanaSubWallet(ctx);
                    await ctx.reply(retVal);
                }
                returnToSolanaSubInSubWallet(tgBot, ctx);
            }
        } else if (ctx.session.state == "solana_input_withdraw_main_wallet") {
            let yourAddress = ctx.message.text;
            let solanaWallet = await SolanaWallet.findOne({createdBy: ctx.from.username, isMain: true})
            if (solanaWallet){
                let privateKey = solanaWallet.privateKey;
                try {
                    let retVal = await wrapFromMainWallet(yourAddress, privateKey);
                    await ctx.reply(retVal);
                    returnToSolanaMainInSubWallet(tgBot, ctx);
                }catch(error){
                    if (!yourAddress.includes("(empty)"))
                    {
                        await ctx.reply(`Error: ${error.message || error}`);
                    }else{
                        await ctx.reply(`You can try next time. Thanks`);
                    }
                }
            }else{
                await ctx.reply("Please create a main wallet first");
            }
        } else if (ctx.session.state == "solana_input_deposite_amount") {
            let num = parseFloat(ctx.message.text);
            if(isNaN(num) || num <= 0) {
                await ctx.reply('Invalid input. Please enter a positive number');
            } else if (num <= minimumDipositAmountForSolana) {
                await ctx.reply(`The minimum diposit amount for solana is ${minimumDipositAmountForSolana} SOL\nPlease try again`);
            }else {  
                await ctx.reply(`It will send ${num} SOL from main wallet to each generated wallet.`);
                ctx.session.state = '';
                user.defaultAmountForSolana = num.toString();
                await returnToSolanaSubInSubWallet(tgBot, ctx);
            }
        } else if (ctx.session.state == "solana_swap_amount") {
            let num = parseFloat(ctx.message.text);
            if(isNaN(num) || num <= 0) {
                await ctx.reply('Invalid input. Please enter a positive number');  
            } else if (num <= minimumDipositAmountForSolana) {
                await ctx.reply(`The minimum swap amount for solana is ${minimumDipositAmountForSolana} SOL\nPlease try again`);
            } else {  
                await ctx.reply(`In each wallet, we will wrap ${num} SOL into token for buy/sell.`);
                ctx.session.state = '';
                user.swapAmountForSolana = num.toString();
                await returnToSolanaSwapInSubWallet(tgBot, ctx);
            }
        } else if (ctx.session.state == "solana_repeat_count") {
            let num = Number(ctx.message.text);
            if(isNaN(num) || num <= 0) {
                await ctx.reply('Invalid input. Please enter a positive number');  
            } else {  
                await ctx.reply(`You can repeat ${num} buy/sell for each wallet.`);
                ctx.session.state = '';
                user.repeatCountForSolana = num;
                await returnToSolanaSwapInSubWallet(tgBot, ctx);
            }
        } else if (ctx.session.state == "solana_input_swap_token_address") {
            let address = ctx.message.text;
            user.solanaTokenAddress = address;
            ctx.session.state = "solana_input_swap_token_decimal"
            await ctx.reply("Please input token decimal")
        } else if (ctx.session.state == "solana_input_swap_token_decimal") {
            let decimal = Number(ctx.message.text);
            if(isNaN(decimal) || decimal <= 0) {
                await ctx.reply('Invalid input. Please enter a positive number');  
            } else {  
                user.solanaTokenDecimal = decimal;
                ctx.session.state = "solana_input_swap_token_name";
                await ctx.reply("Please input token name");
            }
        } else if (ctx.session.state == "solana_input_swap_token_name") {
            let name = ctx.message.text;
            user.solanaTokenName = name;
            ctx.session.state = '';
        }
        user.save();
    })
}