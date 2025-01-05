import { Connection, clusterApiUrl } from '@solana/web3.js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

export const minimumDipositAmountForSolana = 0.005;
export const Commitment = "confirmed";
export const network = "devnet";
export const connection = new Connection(process.env.RPC_URL_SOLANA, Commitment);
// export let connection = new Connection(clusterApiUrl(network), Commitment);