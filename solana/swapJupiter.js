import { Keypair, VersionedTransaction, LAMPORTS_PER_SOL } from "@solana/web3.js";
import fetch from 'cross-fetch';
import { Wallet } from '@project-serum/anchor';
import bs58 from 'bs58';
import { Commitment, connection } from "./constant.js";
import { TOKEN_PROGRAM_ID, unpackAccount } from "@solana/spl-token";
import { DecimalUtil } from "@orca-so/common-sdk";
import BN from 'bn.js';

const fetchUSDCToSOLRate = async () => {
  try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
      const data = await response.json();
      const solPriceInUSD = data.solana.usd;

      // Now calculate the rate between USDC and SOL
      const rateUSDCtoSOL = 1 / solPriceInUSD;  // Rate from USDC to SOL (since USDC is pegged to USD)

      return rateUSDCtoSOL;
  } catch (error) {
      console.error("Error fetching USDC to SOL rate:", error);
      return null;
  }
};

export const swapJupiter = async (buyOrSell, amount, privateKeyEncoded, tokenAddress, tokenDecimal, tokenName) => {
  try{

    if (!tokenAddress || tokenAddress == "")
      return "Please input token address";

    if (!tokenDecimal)
      return "Please input token decimal"

    if (!tokenName || tokenName == '')
      return "Please input token name"

    console.log(tokenAddress, tokenDecimal, tokenName, typeof(tokenDecimal))

    console.log(privateKeyEncoded);
    const privateKey = bs58.decode(privateKeyEncoded);
    const keypair = Keypair.fromSecretKey(privateKey);
    const wallet = new Wallet(keypair);
    const address = keypair.publicKey;

    console.log(wallet.publicKey.toString());


    // Check the balance
    let balance;
    // Try to fetch the balance of the wallet  
    try {
      balance = await connection.getBalance(address);
      // Catch any errors during fetching balance  
    } catch (error) {
      throw new Error("Unable to fetch balance");
    }

    balance = balance / LAMPORTS_PER_SOL;

    console.log(balance)

    const accounts = await connection.getTokenAccountsByOwner(address, {
      programId: TOKEN_PROGRAM_ID,
    });

    // const USDC = {
    //   mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    //   name: "USDC",
    //   decimals: 6,
    // };

    const USDC = {
      mint: tokenAddress,
      name: tokenName,
      decimals: tokenDecimal,
    };

    const SOL = {
      mint: "So11111111111111111111111111111111111111112",
      name: "SOL",
      decimals: 9
    }

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
    console.log(usdcBalance);
    console.log(buyOrSell)
    let quoteParams = "";
    if (buyOrSell){
      if (balance < parseFloat(amount)) {
        return "There is no enough SOL to swap, please left some sol for fee"
      }
      const toBN = parseFloat(amount) * LAMPORTS_PER_SOL;
      quoteParams = `https://quote-api.jup.ag/v6/quote?inputMint=${SOL.mint}&outputMint=${USDC.mint}&amount=${toBN}&slippageBps=50`
    }else {
      if (usdcBalance != "None"){
        const solRate = await fetchUSDCToSOLRate();
        const calcultedSolFromUSDC = solRate * parseFloat(usdcBalance);
        if (calcultedSolFromUSDC < parseFloat(amount)) {
          const toBN = calcultedSolFromUSDC * LAMPORTS_PER_SOL;
          quoteParams = `https://quote-api.jup.ag/v6/quote?inputMint=${USDC.mint}&outputMint=${SOL.mint}&amount=${toBN}&slippageBps=50`
        }
        const toBN = parseFloat(amount) * LAMPORTS_PER_SOL
        quoteParams = `https://quote-api.jup.ag/v6/quote?inputMint=${USDC.mint}&outputMint=${SOL.mint}&amount=${toBN}&slippageBps=50`
      }else {
        return "There is no enough USDC to swap"
      }
    }
    
    console.log(quoteParams)
    
    // Swapping SOL to USDC with input 0.1 SOL and 0.5% slippage
    const quoteResponse = await (
      await fetch(quoteParams)
    ).json();

    console.log(quoteResponse);
    
    // get serialized transactions for the swap
    const { swapTransaction } = await (
      await fetch("https://quote-api.jup.ag/v6/swap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quoteResponse,
          userPublicKey: wallet.publicKey.toString(),
          wrapAndUnwrapSol: true,
        }),
      })
    ).json();

    console.log(swapTransaction)
    
    // deserialize the transaction
    const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
    var transaction = VersionedTransaction.deserialize(swapTransactionBuf);
    console.log(transaction);

    // sign the transaction
    transaction.sign([wallet.payer]);

    // Execute the transaction
    const rawTransaction = transaction.serialize()

    console.log(rawTransaction)
    const txid = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: true,
      maxRetries: 2
    });

    console.log(txid);

    // Fetch the latest block height dynamically before confirming the transaction
    const latestBlock = await connection.getLatestBlockhash();
    
    console.log(latestBlock);

    await connection.confirmTransaction({
      blockhash: latestBlock.blockhash,
      lastValidBlockHeight: latestBlock.lastValidBlockHeight,
      signature: txid
    }, Commitment);
    console.log(`Swap executed, transaction ID: ${txid}`);
    return `Transaction confirmed: https://solscan.io/tx/${txid}`;
  } catch (error){
    console.log(error);
		return `Transaction failed: ${error.message || error}`;
  }
};
