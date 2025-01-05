import { ethers } from "ethers";
import { provider, EBT_ADDRESS } from "./provider.js";
import EBT_ABI from '../abis/ebt.js';

/**
 * This function checks the balance of a sub wallet by providing its private key.
 * It retrieves both Ether and EBT token balances for the wallet.
 * 
 * @param {string} privateKey - The private key of the sub wallet.
 * @returns {string} The wallet details, including the address, private key, and balances.
 * @throws {Error} Throws an error if the private key is invalid, or there is an issue fetching the balances.
 */
export const checkSubWallet = async (privateKey) => {
    try {
        // Validate the private key format
        if (!privateKey || privateKey.length !== 64) { // 66 is the length of a valid private key (including the '0x' prefix)
            throw new Error("Invalid private key format.");
        }

        // Create a wallet instance using the private key
        var wallet = new ethers.Wallet(privateKey, provider);

        // Initialize the EBT contract instance
        const ebtContract = new ethers.Contract(EBT_ADDRESS, EBT_ABI, provider);

        // Fetch the Ether balance of the wallet
        const ethBalance = ethers.formatEther(await provider.getBalance(wallet.address));

        // Fetch the EBT token balance of the wallet
        const ebtBalance = ethers.formatEther(await ebtContract.balanceOf(wallet.address));

        // Return the wallet details and balances
        return `-Address: ${wallet.address}\n\n-PrivateKey: ${privateKey}\n\nEther Balance: ${ethBalance} ETH\n\nEBT Balance: ${ebtBalance} EBT`;
    } catch (error) {
        console.log(error)
        // Handle invalid private key format error
        if (error.message === "Invalid private key format.") {
            throw new Error("The private key provided is invalid. Please check the format.");
        }

        // Handle network errors (e.g., provider connection issues)
        if (error.message.includes("network") || error.message.includes("ECONNREFUSED")) {
            throw new Error("Network error. Unable to fetch wallet balances at the moment.");
        }

        // Handle any errors related to contract interactions or balance fetching
        throw new Error(`Failed to fetch wallet details: ${error.message}`);
    }
};
