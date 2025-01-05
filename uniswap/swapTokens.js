import { ethers } from "ethers";
import UNISWAP_ROUTER_ABI from '../abis/router.js';
import EBT_ABI from '../abis/ebt.js';  
import { provider, UNISWAP_ROUTER_ADDRESS, EBT_ADDRESS, WETH_ADDRESS } from "./provider.js";

const fee = await provider.getFeeData();

export const swapETHToToken = async (privateKey, swapAmount, tokenAddress, tokenDecimal, tokenName) => {
    try {
        // Create wallet instance
        var wallet = new ethers.Wallet(privateKey, provider);
        const uniswapRouter = new ethers.Contract(UNISWAP_ROUTER_ADDRESS, UNISWAP_ROUTER_ABI, wallet);
        
        // Check wallet balance
        let balance = await provider.getBalance(wallet.address);
        if (balance === BigInt(0)) {
            return "There is 0 ETH to swap";
        }
        
        // Convert swap amount to Ether
        const swapAmountInEther = ethers.parseEther(swapAmount);
        if (balance < swapAmountInEther) {
            return "There is not enough ETH to swap";
        }
        
        // Execute the swap
        const swapTransaction = await uniswapRouter.swapExactETHForTokens(
            0,
            [WETH_ADDRESS, tokenAddress],
            wallet.address,
            Math.floor(Date.now() / 1000) + 60 * 20,
            {
                value: swapAmountInEther
            }
        );
        
        // Wait for the transaction to be mined
        await swapTransaction.wait();
        return `Transaction Hash: http://sepolia.etherscan.io/tx/${swapTransaction.hash}`;
        
    } catch (error) {
        // Handle errors
        console.error("Error occurred during ETH to token swap:", error);
        return `Error: ${error.message || error}`;
    }
};

export const swapTokenToETH = async (privateKey, tokenAddress, tokenDecimal, tokenName) => {
    try {
        // Create wallet instance
        var wallet = new ethers.Wallet(privateKey, provider);  
        
        // Initialize token contract and Uniswap router contract
        const ebtContract = new ethers.Contract(tokenAddress, EBT_ABI, wallet);
        const uniswapRouter = new ethers.Contract(UNISWAP_ROUTER_ADDRESS, UNISWAP_ROUTER_ABI, wallet);
        
        // Check token balance of the wallet
        let balance = await ebtContract.balanceOf(wallet.address);
        
        // If balance is zero, return an appropriate message
        if (balance === BigInt(0)) {
            return "There are no tokens to swap";
        }
        
        // Approve the Uniswap router to spend the tokens
        const approveTx = await ebtContract.approve(UNISWAP_ROUTER_ADDRESS, balance);
        await approveTx.wait();
        
        // Swap tokens for ETH
        const swapTransaction = await uniswapRouter.swapExactTokensForETH(
            balance,
            0,
            [tokenAddress, WETH_ADDRESS],
            wallet.address,
            Math.floor(Date.now() / 1000) + 60 * 20
        );
        
        // Wait for the transaction to be mined
        await swapTransaction.wait();  
        
        return `Transaction Hash: http://sepolia.etherscan.io/tx/${swapTransaction.hash}\n`;
        
    } catch (error) {
        // Handle errors
        console.error("Error occurred during token to ETH swap:", error);
        return `Error: ${error.message || error}`;
    }
};



export const swapTokens = async (privateKey, swapAmount, buyOrSell, tokenAddress, tokenDecimal, tokenName) => {
    if (!tokenAddress || tokenAddress == "")
        return "Please input token address";
  
      if (!tokenDecimal)
        return "Please input token decimal"
  
      if (!tokenName || tokenName == '')
        return "Please input token name"
  
    const tempWallet = new ethers.Wallet(privateKey, provider);
    const ebtContract = new ethers.Contract(tokenAddress, EBT_ABI, provider);
    const balanceOfTokenOne = ethers.parseEther((await provider.getBalance(tempWallet.address)).toString());
    const balanceOfTokenTwo = ethers.parseEther((await ebtContract.balanceOf(tempWallet.address)).toString());
    if (buyOrSell)
        return await swapETHToToken(privateKey, swapAmount, tokenAddress, tokenDecimal, tokenName);
    else
        return await swapTokenToETH(privateKey, tokenAddress, tokenDecimal, tokenName);
}