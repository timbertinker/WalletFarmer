import bs58 from "bs58";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, unpackAccount } from "@solana/spl-token";
import SolanaWallet from "../model/SolanaWallet.js";
import { DecimalUtil } from "@orca-so/common-sdk";
import { connection } from "./constant.js";
import BN from 'bn.js';

/**  
 * This function is used to check the balance and details of the main Solana wallet for a particular user.  
 *   
 * @param {Object} ctx - The context object, usually containing user information.  
 * @returns {string} A string containing the Public Key, Private Key, Secret Key, and balance of the Solana wallet.   
 * @throws {Error} If the user doesn't have a main wallet, if the private key is not available, if the private key is invalid, or if unable to fetch the balance.  
 */
export const checkSolanaMainWallet = async (ctx) => {
	// Query the database for the main Solana Wallet created by the user  
	var wlt = await SolanaWallet.findOne({ createdBy: ctx.from.username, isMain: true });

	// Check if the wallet exists  
	if (!wlt) {
		return "Please create one main wallet for you";
	}

	var privateKey = wlt.privateKey;

	// Check if privateKey is available  
	if (!privateKey) {
		throw new Error("Private key is not available");
	}

	var decodedKey;

	// Try to decode the private key  
	try {
		decodedKey = bs58.decode(privateKey);
		// Catch decoding errors  
	} catch (error) {
		throw new Error("Invalid private key");
	}

	// Create a Keypair from the decoded private key  
	const keypair = Keypair.fromSecretKey(decodedKey);
	// Get the public key from the keypair  
	const address = keypair.publicKey;

	let balance;
	// Try to fetch the balance of the wallet  
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
	return `-Public Key: ${address}\n\nPrivate Key: ${privateKey}\n\n-Balance: ${balance} SOL\n\n-USDC Balance: ${usdcBalance}`;
};   