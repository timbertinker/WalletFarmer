import { Keypair } from "@solana/web3.js";  
import * as bip39 from "bip39";  
import bs58 from "bs58";  
import { HDKey } from "micro-ed25519-hdkey";  
import SolanaWallet from "../model/SolanaWallet.js";  
import User from '../model/User.js';  

/**  
 * This function is used to create a Solana sub-wallet for a user.  
 *  
 * @param {Object} ctx - The context object, usually containing user information.  
 * @returns {string} A string containing the Public Key, Private Key, and Secret Key of the new Solana sub-wallet.  
 * @throws {Error} Will throw an error if there are any issues during the wallet creation process (e.g. issue in generating Keypair, saving wallet details in database).  
 */  
export const createSolanaSubWallet = async (ctx) => {  
    // Generate a mnemonic using bip39 library  
    const mnemonic = bip39.generateMnemonic();  

    // Create seed from the generated mnemonic  
    const seed = bip39.mnemonicToSeedSync(mnemonic, "");  

    // Get the HD key from the seed  
    const hd = HDKey.fromMasterSeed(seed.toString("hex"));  

    // Define derivation path   
    const path = `m/44'/501'/1'/0'`;  

    // Create keypair from HD key derived using defined path  
    const keypair = Keypair.fromSeed(hd.derive(path).privateKey);  

    // Instantiate a new SolanaWallet object  
    const wallet = new SolanaWallet();  

    // Assign properties to the wallet object  
    wallet.address = keypair.publicKey.toBase58(); // set address from public key of keypair  
    wallet.privateKey = bs58.encode(Uint8Array.from(keypair.secretKey)); // set the base58 encoded private key  
    wallet.isMain = false; // wallet is not main  
    wallet.createdBy = ctx.from.username; // set wallet creator name from context object  

    // Save the wallet details to the database  
    wallet.save();  

    // Fetch the corresponding user from the database  
    var user = await User.findOne({ username: ctx.from.username });  

    // If user does not exist in database, create a new user  
    if (!user){  
        user = new User();  
        user.username = ctx.from.username;  
    }  

    // Update the subSolanaWallet field of the user object by adding the new wallet's ID  
    user.subSolanaWallet.push(wallet._id);  

    // Save the user changes to the database  
    user.save();  

    // Return the wallet details string  
    return `Public Key: ${wallet.address}\n\nPrivate Key: ${wallet.privateKey}\n\n`;  
};