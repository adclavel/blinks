'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { getOrCreateAssociatedTokenAccount, createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { useState } from 'react';

export default function PurchaseCarbonCredits() {
    const { connection } = useConnection();
    const { publicKey, sendTransaction } = useWallet();
    const [credits, setCredits] = useState(0); // Number of credits the user wants to buy
    const [message, setMessage] = useState<string | null>(null);

    const handlePurchase = async () => {
        if (!publicKey) {
            setMessage('Please connect your wallet.');
            return;
        }

        try {
            const tx = new Transaction();

            // Define the carbon credit mint address
            const carbonCreditMint = new PublicKey('DeK7SriaMf2xy9RM4nVe7Xmk3SmyvacKuJve9v3T9yRK'); // Your mint address
            const receiverPubkey = new PublicKey('DeK7SriaMf2xy9RM4nVe7Xmk3SmyvacKuJve9v3T9yRK'); // Your wallet address

            // Get or create the user's associated token account for carbon credits
            const userTokenAccount = await getOrCreateAssociatedTokenAccount(
                connection,
                publicKey as any, // Cast to any to satisfy TypeScript temporarily
                carbonCreditMint,
                publicKey, // Use the user's public key as the owner
                false
            );

            // Transfer amount (adjust based on your token decimals)
            const amount = credits * 1e9; // Assuming 9 decimal places for SPL token

            // Create the instruction to transfer carbon credits (SPL tokens)
            const transferInstruction = createTransferInstruction(
                userTokenAccount.address, // Source (user's token account)
                receiverPubkey,           // Destination (recipient's account)
                publicKey,                // Owner (user's public key)
                amount,                   // Amount to transfer (in tokens)
                [],
                TOKEN_PROGRAM_ID
            );

            // Add the transfer instruction to the transaction
            tx.add(transferInstruction);

            // Fetch the latest blockhash and set the fee payer
            const { blockhash } = await connection.getLatestBlockhash('finalized');
            tx.recentBlockhash = blockhash;
            tx.feePayer = publicKey;

            // Sign and send the transaction
            const signature = await sendTransaction(tx, connection);
            setMessage(`Transaction sent: ${signature}`);
        } catch (error) {
            console.error("Transaction failed", error);

            if (error instanceof Error) {
                setMessage(`Error: ${error.message}`);
            } else {
                setMessage("Unknown error occurred");
            }
        }
    };

    return (
        <div>
            <h2>Purchase Carbon Credits</h2>
            <input
                type="number"
                value={credits}
                onChange={(e) => setCredits(Number(e.target.value))}
                placeholder="Enter credits to buy"
            />
            <button onClick={handlePurchase}>Purchase Now</button>

            {message && <p>{message}</p>}
        </div>
    );
}
