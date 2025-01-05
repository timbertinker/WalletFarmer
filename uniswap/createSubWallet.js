import { ethers } from "ethers";
import crypto from "crypto";
import { provider } from "./provider.js";
import User from '../model/User.js';
import EtherWallet from '../model/EtherWallet.js';

export const createSubWallet = async (defaultAmount, mainWalletPrivateKey, ctx) => {
    // const fee = await provider.getFeeData();
    // console.log("createSubWallet:", defaultAmount, mainWalletPrivateKey)
    // if (mainWalletPrivateKey == null || mainWalletPrivateKey == "")
    //     return "Please input your main wallet private key.";
    // if (defaultAmount == null || defaultAmount == 0)
    //     return "Please provide the default amount to send to every created wallets";
    // const mainWallet = new ethers.Wallet(mainWalletPrivateKey, provider);
    // let mainWalletBalance = await provider.getBalance(mainWallet.address);
    // console.log("Main Wallet Balance:", mainWalletBalance);
    // mainWalletBalance = mainWalletBalance - BigInt(21000) * fee.gasPrice;
    // console.log(ethers.formatEther(mainWalletBalance));
    // if (mainWalletBalance < ethers.parseEther(defaultAmount.toString()))
    //     return "There is no enough ETH on your main Wallet";
    var privateKey = crypto.randomBytes(32).toString("hex");
    console.log("Created Sub Wallet Private Key:", privateKey);
    var wallet = new ethers.Wallet(privateKey, provider);
    console.log("Created Sub Wallet Address:", wallet.address)
    // const transaction = await mainWallet.sendTransaction({
    //     to: wallet.address,
    //     value: ethers.parseEther(defaultAmount.toString()),
    //     gasLimit: 21000,
    //     gasPrice: fee.gasPrice
    // });
    // await transaction.wait();
    // console.log(`Transaction Hash: https://sepolia.etherscan.io/tx/${transaction.hash}`);
    var wlt = new EtherWallet();
    wlt.address = wallet.address;
    wlt.privateKey = privateKey;
    wlt.isMain = false;
    wlt.createdBy = ctx.from.username;
    wlt.save();
    var user = await User.findOne({username: ctx.from.username});
    user.subEtherWallets.push(wlt);
    user.save();
    return `-Address: ${wallet.address}\n\n-PrivateKey: ${privateKey}\n`;//Send ${defaultAmount} ETH to wallet: ${wallet.address}\nTracsaction Hash: https://sepolia.etherscan.io/tx/${transaction.hash}\n`;
}