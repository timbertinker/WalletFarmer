import { ethers } from "ethers";
import { provider, EBT_ADDRESS } from "./provider.js";
import EtherWallet from '../model/EtherWallet.js';
import EBT_ABI from '../abis/ebt.js';

/**
 * This function checks the balance of the main wallet associated with the user.
 * It retrieves the Ether and EBT token balances and provides wallet details.
 * 
 * @param {Object} ctx - The context object, typically containing the user information.
 * @returns {string} The wallet details including address, private key, and balances.
 * @throws {Error} Throws an error if there is an issue with fetching wallet data or balances.
 */
export const checkMainWallet = async (ctx) => {
    try {
        // Retrieve the main wallet for the user
        const wlt = await EtherWallet.findOne({ createdBy: ctx.from.username, isMain: true });
        if (!wlt) {
            // If no main wallet exists, return an appropriate message
            return "Please create a main wallet first.";
        }

        // Get the private key of the wallet from the database
        const privateKey = wlt.privateKey;
        if (!privateKey) {
            // Ensure the private key is available
            throw new Error("Private key is missing or invalid in the wallet.");
        }

        // Create a wallet instance using the private key
        const wallet = new ethers.Wallet(privateKey, provider);

        // Initialize the EBT contract
        const ebtContract = new ethers.Contract(EBT_ADDRESS, EBT_ABI, provider);

        // Fetch the Ether balance of the wallet
        const ethBalance = ethers.formatEther(await provider.getBalance(wallet.address));

        // Return the wallet details and balances
        return `-Address: ${wallet.address}\n\n-PrivateKey: ${privateKey}\n\n-Ether Balance: ${ethBalance} ETH\n\n`;
    } catch (error) {
        // Handle errors and provide a user-friendly message
        if (error.message.includes("Private key is missing")) {
            throw new Error("Wallet does not have a valid private key.");
        }

        if (error.message.includes("ECONNREFUSED") || error.message.includes("network")) {
            throw new Error("Network error. Unable to fetch balances at the moment.");
        }

        // Handle other errors (e.g., invalid contract address or ABI)
        throw new Error(`Failed to fetch wallet details: ${error.message}`);
    }
};
