import { LAMPORTS_PER_SOL } from '@solana/web3.js';
/**
 * Converts a value from Solana's SOL to lamports.
 * 1 SOL = 1,000,000,000 lamports.
 * 
 * @param {number|string} sol - The value in SOL to be converted to lamports. Can be a number or a string.
 * @returns {number} - The corresponding value in lamports.
 * @throws {Error} - Throws an error if the input is not a valid number or string that can be converted to a valid number, or is less than 0.
 */
const solToLamports = (sol) => {
    // Check if the input is a valid number or a string that can be converted to a number
    let solAmount = typeof sol === 'number' ? sol : parseFloat(sol);
    
    // If sol is not a valid number after parsing, throw an error
    if (isNaN(solAmount)) {
        throw new Error("The input must be a valid number or a string representing a number.");
    }

    // Check if the input is a positive number
    if (solAmount < 0) {
        throw new Error("The value of SOL cannot be negative.");
    }

    // Convert SOL to lamports
    return LAMPORTS_PER_SOL * solAmount;
};

export default solToLamports