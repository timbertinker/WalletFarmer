import { Keypair, sendAndConfirmRawTransaction, SystemProgram, Transaction } from '@solana/web3.js';
import bs58 from 'bs58';
import { Commitment, connection } from './constant.js';

/**
 * Function to transfer SOL from a main wallet to a personal wallet on Solana's testnet.
 * The main wallet's private key (encoded in bs58) is used to sign the transaction.
 * This function ensures there is sufficient balance to cover the transaction fees before proceeding with the transfer.
 *
 * @param {string} personalPublicKey - The public key of the personal wallet to which SOL will be transferred.
 * @param {string} mainWalletPrivateKeyEncoded - The bs58-encoded private key of the main wallet used for the transaction.
 * @returns {Promise<string>} The transaction signature once the transaction is successfully sent.
 * @throws {Error} If there is an issue with the public/private keys, insufficient balance, or other transaction failures.
 */
export const wrapFromMainWallet = async (personalPublicKey, mainWalletPrivateKeyEncoded) => {
	try {
		// Check if the public key and private key are provided as arguments.
		if (!personalPublicKey || !mainWalletPrivateKeyEncoded) {
			throw new Error('Public key and/or private key not available.');
		}

		// Attempt to decode the private key from bs58 encoding to a Uint8Array.
		let mainWalletSecretKey;
		try {
			mainWalletSecretKey = new Uint8Array(bs58.decode(mainWalletPrivateKeyEncoded));
		} catch {
			throw new Error('Unable to decode private key.');
		}

		// Initialize the main wallet using the decoded private key.
		const mainWallet = Keypair.fromSecretKey(mainWalletSecretKey);

		// Retrieve the public key of the main wallet.
		const mainWalletPublicKey = mainWallet.publicKey;

		// Fetch the balance of the main wallet.
		const balance = await connection.getBalance(mainWalletPublicKey);

		// Create a transfer transaction from the main wallet to the personal wallet.
		const transaction = new Transaction().add(
			SystemProgram.transfer({
				fromPubkey: mainWalletPublicKey,
				toPubkey: personalPublicKey,
				lamports: 0,  // The amount of SOL to transfer is set later, initially set to 0.
			}),
		);

		// Set the transaction fee payer as main wallet
		transaction.feePayer = mainWalletPublicKey

		// Get the most recent blockhash for the transaction.
		transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

		// Retrieve the fee required for the transaction.
		const transactionFee = await connection.getFeeForMessage(transaction.compileMessage(), Commitment);

		// Check if the wallet has sufficient balance to cover the transaction fee.
		if (transactionFee.value > balance) {
			throw new Error('Insufficient balance to cover the transaction fee');
		}

		// Set the actual transfer amount by subtracting the transaction fee from the wallet balance.
		transaction.instructions[0].data = SystemProgram.transfer({ lamports: balance - transactionFee.value }).data;

		// Sign the transaction using the main wallet's private key.
		transaction.sign(mainWallet);

		// Serialize the transaction to a Buffer
		const serializedTransaction = transaction.serialize();

		// Send the transaction to the Solana network and retrieve the transaction signature.
		let signature = await sendAndConfirmRawTransaction(connection, serializedTransaction, [mainWallet]);

		// Log the transaction signature and return it.
		console.log('Transaction sent and hash:', signature);
		return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;

	} catch (error) {
		console.log(error);
		// Handle and throw any errors that occur during the transaction process.
		throw new Error(`Transfer failed: ${error.message}`);
	}
};
