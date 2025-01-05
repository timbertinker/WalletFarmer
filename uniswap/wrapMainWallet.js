import { ethers } from "ethers";
import { provider } from "./provider.js";
import EtherWallet from '../model/EtherWallet.js';

export const wrapMainWallet = async (ctx, yourAddress) => {
    if (!ethers.isAddress(yourAddress))
        return {
            message: "Please input a valid address",
            success: false
        }
    var wlt = await EtherWallet.findOne({ createdBy: ctx.from.username, isMain: true });
    if (wlt == null)
        return {
            message: "Please create one main wallet for you.",
            success: false
        };
    var privateKey = wlt.privateKey;
    var wallet = new ethers.Wallet(privateKey, provider);
    let balance = await provider.getBalance(wallet.address);
    console.log(wallet.address, ethers.formatEther(balance));
    if (balance == BigInt(0))
        return {
            message: "There is no ETH on provided wallet",
            success: false
        }
    const fee = await provider.getFeeData();

    console.log(fee.gasPrice.toString())
    balance = balance - BigInt(21000) * fee.gasPrice * BigInt(2);
    console.log(ethers.formatEther(balance));
    const transaction = await wallet.sendTransaction({
        to: yourAddress,
        value: balance,
        gasLimit: 21000,
        gasPrice: fee.gasPrice
    });
    await transaction.wait();
    return {
        message: `Successfully transfer ${ethers.formatEther(balance)} from ${wallet.address} to ${yourAddress} on https://sepolia.etherscan.io/tx/${transaction.hash}\n`,
        success: true
    }
}
