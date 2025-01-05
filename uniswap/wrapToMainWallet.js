import { ethers } from "ethers";
import { provider } from "./provider.js";

export const wrapToMainWallet = async (privateKey, mainWalletPrivateKey) => {
    const fee = await provider.getFeeData();
    if (privateKey == null || privateKey == "")
        return "There are no wallets to wrap";
    if (mainWalletPrivateKey == null || mainWalletPrivateKey == "")
        return "Please input your main wallet private key.";
    const mainWallet = new ethers.Wallet(mainWalletPrivateKey, provider);
    var wallet = new ethers.Wallet(privateKey, provider);
    let balance = await provider.getBalance(wallet.address);
    console.log(wallet.address, balance);
    if (balance == BigInt(0))
        return "There is no ETH on provided wallet";
    balance = balance - BigInt(21000) * fee.gasPrice;
    console.log(ethers.formatEther(balance));
    const transaction = await wallet.sendTransaction({
        to: mainWallet.address,
        value: balance,
        gasLimit: 21000,
        gasPrice: fee.gasPrice
    });
    await transaction.wait();
    console.log(`https://sepolia.etherscan.io/tx/${transaction.hash}`);
    return `Successfully transfer ${ethers.formatEther(balance)} from ${wallet.address} to ${mainWallet.address} on https://sepolia.etherscan.io/tx/${transaction.hash}\n`;
}
