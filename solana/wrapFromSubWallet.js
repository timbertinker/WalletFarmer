import { Keypair, sendAndConfirmRawTransaction, SystemProgram, Transaction } from '@solana/web3.js';  
import bs58 from 'bs58';
import { Commitment, connection } from './constant.js';

/**
 * Function to transfer SOL from a sub wallet to a main wallet on Solana's testnet.
 * The sub wallet's private key (encoded in bs58) is used to sign the transaction.
 * This function ensures there is sufficient balance to cover the transaction fees before proceeding with the transfer.
 *
 * @param {string} mainWalletPrivateKeyEncoded - The bs58-encoded private key of the main wallet to which SOL will be transferred.
 * @param {string} subWalletPrivateKeyEncoded - The bs58-encoded private key of the sub wallet from which SOL will be transferred.
 * @returns {Promise<string>} The transaction signature once the transaction is successfully sent.
 * @throws {Error} If there is an issue with the private keys, insufficient balance, or other transaction failures.
 */
export const wrapFromSubWallet = async (mainWalletPrivateKeyEncoded, subWalletPrivateKeyEncoded) => {  
    try {  
        // Check if both private keys are provided as arguments.
        if (!mainWalletPrivateKeyEncoded || !subWalletPrivateKeyEncoded) {  
            throw new Error('Private key(s) not available');  
        }  

        // Attempt to decode the private keys from bs58 encoding to Uint8Array format.
        let mainWalletDecodedKey;  
        let subWalletDecodedKey;  
        
        try {  
            mainWalletDecodedKey = new Uint8Array(bs58.decode(mainWalletPrivateKeyEncoded));  
            subWalletDecodedKey = new Uint8Array(bs58.decode(subWalletPrivateKeyEncoded));  
        } catch {  
            throw new Error('Invalid private key(s) format');  
        }  
    
        // Initialize Keypairs for the main wallet (recipient) and sub wallet (sender) using their decoded private keys.
        let toWallet = Keypair.fromSecretKey(mainWalletDecodedKey);  
        const fromWallet = Keypair.fromSecretKey(subWalletDecodedKey);  

        // Retrieve the balance of the sub wallet to ensure there is enough for the transaction.
        const subWalletBalance = await connection.getBalance(fromWallet.publicKey);  

        // Create a transaction to transfer SOL from the sub wallet to the main wallet.
        let transaction = new Transaction().add(  
            SystemProgram.transfer({  
                fromPubkey: fromWallet.publicKey,  
                toPubkey: toWallet.publicKey,  
                lamports: 0, // The amount to transfer will be set later, initially set to 0.
            }),  
        );  

        // Set the transaction fee payer as sub wallet
        transaction.feePayer = fromWallet.publicKey

        // Get the most recent blockhash for the transaction.
        transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;  

        // Retrieve the transaction fee for the created transaction.
        const transactionFee = await connection.getFeeForMessage(transaction.compileMessage(), Commitment);  

        // Ensure the sub wallet has enough balance to cover the transaction fee.
        if (transactionFee.value > subWalletBalance) {  
            throw new Error('Insufficient balance to cover the transaction fee');  
        }  

        // Set the actual transfer amount by subtracting the transaction fee from the sub wallet balance.
        transaction.instructions[0].data = SystemProgram.transfer({  
            lamports: subWalletBalance - transactionFee.value,  // The remaining balance after subtracting the fee
        }).data;  

        // Sign the transaction using the sub wallet's private key.
        transaction.sign(fromWallet);  

        // Serialize the transaction to a Buffer
		const serializedTransaction = transaction.serialize();

        // Send the signed transaction to the Solana network and retrieve the transaction signature.
        let signature = await sendAndConfirmRawTransaction(connection, serializedTransaction, [fromWallet]);

        // Log the transaction signature and return it.
        console.log('Transaction sent and hash:', signature);  
        return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
        
    } catch (error) {  
        console.log(error)
        // Handle and throw any errors that occur during the transaction process.
        throw new Error(`Transfer failed: ${error.message}`);  
    }
};
