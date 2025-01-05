import bs58 from "bs58";
import { Keypair } from "@solana/web3.js";
import SolanaWallet from "../model/SolanaWallet.js";

/**  
 * This function retrieves the address of a user's main Solana wallet.  
 *  
 * @param {Object} ctx - The context object, typically containing user information.  
 * @returns {string} The Base58 encoded public key or address of the main wallet.   
 * @throws {Error} Will throw an error if a main wallet doesn't exist for the user, if the private key is not available, or if the private key is invalid.  
 */
export const retrieveMainWalletAddress = async (ctx) => {
	// Query the main Solana Wallet created by the user from the database  
	var wlt = await SolanaWallet.findOne({ createdBy: ctx.from.username, isMain: true });

	// Check if the main wallet exists  
	if (!wlt) {
		throw new Error("Please create a main wallet first");
	}

	// Get the private key from the main wallet  
	var privateKey = wlt.privateKey;

	// Check if privateKey is available  
	if (!privateKey) {
		throw new Error("Private key is not available");
	}

	// Try to to decode the Bs58 private key  
	var decodedKey;
	try {
		decodedKey = bs58.decode(privateKey);
	} catch (error) {
		throw new Error("Invalid private key");
	}

	// Use the decoded private key to get the Keypair  
	const keypair = Keypair.fromSecretKey(decodedKey);

	// Convert publicKey to Base58 to get the address  
	const address = keypair.publicKey.toBase58();

	// Return the address (public key)  
	return address;
};