// Import necessary libraries  
import bs58 from "bs58";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { connection } from './constant.js';
import { TOKEN_PROGRAM_ID, unpackAccount } from "@solana/spl-token";
import { DecimalUtil } from "@orca-so/common-sdk";
import BN from 'bn.js';
/**  
 * This function is used to check the balance and details of a Solana sub-wallet given its private key.  
 *  
 * @param {string} privateKey - The wallet's private key in Base58 format.  
 * @returns {string} A string containing the Public Key, Private Key, Secret Key, and balance of the sub-wallet.  
 * @throws {Error} Will throw an error if the private key is not provided, if the private key is invalid based on Base58 encoding,   
				   or if an error occurs while trying to retrieve the wallet balance.  
 */
export const checkSolanaSubWallet = async (privateKey) => {
	try {
		// Check if the private key is available  
		if (!privateKey) {
			throw new Error('Private key not available');
		}

		// Try to decode the private key  
		let decodedKey;
		try {
			decodedKey = bs58.decode(privateKey);
		} catch (error) {
			throw new Error('Invalid base58 encoded private key');
		}

		// Create a Keypair from the decoded private key  
		const keypair = Keypair.fromSecretKey(decodedKey);

		// Get the public key from the keypair  
		const address = keypair.publicKey;
		// Try to fetch the balance of the wallet  
		// Try to fetch the balance of the wallet  
		let balance;
		try {
			balance = await connection.getBalance(address);
			// Catch any errors during fetching balance  
		} catch (error) {
			throw new Error("Unable to fetch balance");
		}

		balance = balance / LAMPORTS_PER_SOL;

		const accounts = await connection.getTokenAccountsByOwner(address, {
			programId: TOKEN_PROGRAM_ID,
		});
	
		const USDC = {
			mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
			name: "USDC",
			decimals: 6,
		};
	
		let usdcBalance = "None"
		if (accounts.value.length > 0){
			// Deserialize token account data
			for (let i = 0; i < accounts.value.length; i++) {
				const value = accounts.value[i];
				// Deserialize
				const parsed_token_account = unpackAccount(value.pubkey, value.account);
				// Use the mint address to determine which token account is for which token
				const mint = parsed_token_account.mint;
				if (mint == USDC.mint){
					// The balance is "amount"
					const amount = parsed_token_account.amount;
					// The balance is managed as an integer value, so it must be converted for UI display
					const ui_amount = DecimalUtil.fromBN(
						new BN(amount.toString()),
						USDC.decimals
					);
					usdcBalance = ui_amount.toString();
				}
			}
		}

		// Return the wallet details  
		return `-Public Key: ${address}\n\n-Private Key: ${privateKey}\n\nBalance: ${balance}\n\n-USDC Balance: ${usdcBalance}`;
	} catch (error) {
		throw new Error(`Failed to check wallet: ${error.message}`);
	}
};