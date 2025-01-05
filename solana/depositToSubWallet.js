import { Keypair, sendAndConfirmRawTransaction, SystemProgram, Transaction } from '@solana/web3.js';
import bs58 from "bs58";
import solToLamports from './solToLamports.js';
import { Commitment, connection } from './constant.js';

/**  
 * This function is used to deposit a certain amount from a main wallet to a sub wallet on the Solana network.  
 *  
 * @param {string} mainWalletPrivateKeyEncoded - The encoded private key of the main Solana wallet, from which the deposit is made.  
 * @param {string} subWalletPrivateKeyEncoded - The encoded private key of the sub Solana wallet, to which the deposit will be credited.  
 * @param {number} depositAmountSol - The amount to deposit in sols(denominated in SOL, not Lamports).  
 * @returns {string} The signature of the transaction showing that the deposit was successful.  
 * @throws {Error} Will throw an error if parameters are missing, deposit is not valid, private keys encoding is invalid or if an error occurs during transaction.  
 */
export const depositToSubWallet = async (mainWalletPrivateKeyEncoded, subWalletPrivateKeyEncoded, depositAmountSol) => {
	try {
		// Check that all the necessary parameters are provided  
		if (!mainWalletPrivateKeyEncoded || !subWalletPrivateKeyEncoded || !depositAmountSol) {
			throw new Error('All parameters must be provided');
		}

		// Verify the deposit amount  
		const amount = parseFloat(depositAmountSol);
		if (isNaN(amount) || amount < 0) {
			throw new Error('Invalid deposit amount');
		}

		// Check and decode the provided private keys  
		let fromWalletSecretKey;
		let toWalletSecretKey;
		try {
			fromWalletSecretKey = new Uint8Array(bs58.decode(mainWalletPrivateKeyEncoded));
			toWalletSecretKey = new Uint8Array(bs58.decode(subWalletPrivateKeyEncoded));
		} catch (error) {
			throw new Error('Invalid bs58 encoded private key(s)');
		}

		// Generate keypairs for the wallets  
		let fromWallet = Keypair.fromSecretKey(fromWalletSecretKey);
		let toWalletPublicKey = Keypair.fromSecretKey(toWalletSecretKey).publicKey;

		// Convert the deposit amount from sols to lamports  
		let depositAmountLamports
		try {
			// Convert the amount to lamports using solToLamports function
			depositAmountLamports = solToLamports(amount);
		} catch (error) {
			// Re-throw the error with a more specific message
			throw new Error(`Failed to convert the provided amount to lamports: ${error.message}`)
		}

		// Fetch the balance of the main wallet.
		const balance = await connection.getBalance(fromWallet.publicKey);

		// Create a new transfer transaction  
		let transaction = new Transaction().add(
			SystemProgram.transfer({
				fromPubkey: fromWallet.publicKey,
				toPubkey: toWalletPublicKey,
				lamports: 0,
			}),
		);

		// Set the transaction fee payer as main wallet
		transaction.feePayer = fromWallet.publicKey

		// Fetch the latest blockhash for transaction processing  
		transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
		
		// Retrieve the fee required for the transaction.
		const transactionFee = await connection.getFeeForMessage(transaction.compileMessage(), Commitment);

		// Check if the wallet has sufficient balance to cover the transaction fee.
		if (transactionFee.value + depositAmountLamports > balance) {
			throw new Error('Insufficient balance to cover the transaction fee');
		}

		// Set the actual transfer amount by subtracting the transaction fee from the wallet balance.
		transaction.instructions[0].data = SystemProgram.transfer({ lamports: depositAmountLamports }).data;

		// Sign the transaction using main wallet's secret key  
		transaction.sign(fromWallet);

		// Serialize the transaction to a Buffer
		const serializedTransaction = transaction.serialize();

		// Send the transaction to the network  
		let signature = await sendAndConfirmRawTransaction(connection, serializedTransaction, [fromWallet]);

		// Log the transaction signature and return it.
		console.log('Transaction sent and hash:', signature);
		return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
	} catch (error) {
		console.log(error)
		throw new Error(`Transaction failed: ${error.message}`);
	}
};