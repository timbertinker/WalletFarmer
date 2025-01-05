import { ethers } from "ethers";
import { provider } from "./provider.js";

export const depositToSubWallet = async (privateKey, mainWalletPrivateKey, defaultAmount) => {
    const fee = await provider.getFeeData();
    console.log("Deposit to SubWallet:", defaultAmount, mainWalletPrivateKey)
    if (mainWalletPrivateKey == null || mainWalletPrivateKey == "")
        return "Please input your main wallet private key.";
    if (defaultAmount == null || defaultAmount == 0)
        return "Please provide the default amount to send to every created wallets";
    if (privateKey == null || privateKey == "")
        return "Please provide the sub wallet private key";
    const mainWallet = new ethers.Wallet(mainWalletPrivateKey, provider);
    let mainWalletBalance = await provider.getBalance(mainWallet.address);
    console.log("Main Wallet Balance:", ethers.formatEther(mainWalletBalance));
    mainWalletBalance = mainWalletBalance - BigInt(21000) * fee.gasPrice;
    console.log(ethers.formatEther(mainWalletBalance));
    if (mainWalletBalance < ethers.parseEther(defaultAmount.toString()))
        return "There is no enough ETH on your main Wallet";
    var wallet = new ethers.Wallet(privateKey, provider);
    console.log(`${ethers.formatEther(ethers.parseEther(defaultAmount.toString()))} will be deposit`);
    const transaction = await mainWallet.sendTransaction({
        to: wallet.address,
        value: ethers.parseEther(defaultAmount.toString()),
        gasLimit: 21000,
        gasPrice: fee.gasPrice
    });
    await transaction.wait();
    console.log(`Transaction Hash: https://sepolia.etherscan.io/tx/${transaction.hash}`);
    return `Address: ${wallet.address}\nPrivateKey: ${privateKey}\nSend ${defaultAmount} ETH to wallet: ${wallet.address}\nTracsaction Hash: https://sepolia.etherscan.io/tx/${transaction.hash}\n`;
}