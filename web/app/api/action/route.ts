import {
  Connection,
  Keypair,
  PublicKey,
  clusterApiUrl,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import {
  getAccount,
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  TokenAccountNotFoundError,
  TokenInvalidAccountOwnerError,
} from "@solana/spl-token";

// Define constants for CORS
const ACTIONS_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Access-Control-Allow-Headers": "Content-Type",
};

// GET handler for fetching the carbon credit purchase information
export async function GET(request: Request) {
  const responseBody = {
    icon: "https://www.pngitem.com/pimgs/m/235-2356755_environmental-science-icon-png-eco-friendly-icon-png.png",
    description:
      "Purchase carbon credits to offset your carbon footprint. Each credit represents a verified reduction in carbon emissions, contributing to sustainable projects.",
    title: "Buy Carbon Credits",
    label: "Purchase Now",
    error: {
      message: "Carbon credit purchase not implemented yet",
    },
  };

  return new Response(JSON.stringify(responseBody), {
    headers: ACTIONS_CORS_HEADERS,
  });
}

// POST handler for processing the purchase of carbon credits
export async function POST(request: Request) {
  try {
    const requestBody = await request.json();
    console.log("Received request body:", requestBody); // Log the incoming request body

    const {
      account: userPubkey,
      credits: creditsToBuy,
      secretKey: userSecretKey,
      destinationPublicKey: destinationPublicKeyString,
    } = requestBody;

    // Validate the request fields
    if (!userPubkey || creditsToBuy === undefined || !userSecretKey || !destinationPublicKeyString) {
      return new Response(
        JSON.stringify({ error: "Missing required fields in the request body." }),
        { status: 400, headers: ACTIONS_CORS_HEADERS }
      );
    }

    let pubKey: PublicKey;
    let destinationPubKey: PublicKey;
    try {
      pubKey = new PublicKey(userPubkey);
      destinationPubKey = new PublicKey(destinationPublicKeyString);
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Invalid public key provided." }),
        { status: 400, headers: ACTIONS_CORS_HEADERS }
      );
    }

    // Establish connection to the Solana cluster
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    // Define the SPL token mint address for carbon credits
    const carbonCreditMint = new PublicKey("AzBFgrEpWXneX7fmhvW41L6W5TAjgfARoKwdWWjEsdJG");

    // Create user keypair from the provided secret key
    const userKeypair = Keypair.fromSecretKey(new Uint8Array(userSecretKey));

    // Check the user's SOL balance for transaction fees
    const userBalance = await connection.getBalance(pubKey);
    if (userBalance < 0.002 * 1e9) {
      return new Response(
        JSON.stringify({ error: "Insufficient SOL balance to cover transaction fees." }),
        { status: 400, headers: ACTIONS_CORS_HEADERS }
      );
    }

    // Get or create the associated token account for the user
    let userTokenAccount;
    try {
      userTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        userKeypair,
        carbonCreditMint,
        pubKey
      );
    } catch (error: any) {
      return new Response(
        JSON.stringify({ error: "Failed to get or create user token account.", details: error.message }),
        { status: 500, headers: ACTIONS_CORS_HEADERS }
      );
    }

    // Validate the user's token account to ensure it's valid
    try {
      const tokenAccountInfo = await getAccount(connection, userTokenAccount.address);
      if (!tokenAccountInfo) {
        throw new Error("User token account not found or invalid.");
      }
    } catch (error) {
      if (error instanceof TokenAccountNotFoundError) {
        return new Response(
          JSON.stringify({ error: "User token account not found." }),
          { status: 400, headers: ACTIONS_CORS_HEADERS }
        );
      } else if (error instanceof TokenInvalidAccountOwnerError) {
        return new Response(
          JSON.stringify({ error: "Invalid account owner for token account." }),
          { status: 400, headers: ACTIONS_CORS_HEADERS }
        );
      } else {
        return new Response(
          JSON.stringify({ error: "Error fetching user token account." }),
          { status: 500, headers: ACTIONS_CORS_HEADERS }
        );
      }
    }

    // Get or create the associated token account for the destination
    let destinationTokenAccount;
    try {
      destinationTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        userKeypair,
        carbonCreditMint,
        destinationPubKey
      );
    } catch (error: any) {
      return new Response(
        JSON.stringify({ error: "Failed to get or create destination token account.", details: error.message }),
        { status: 500, headers: ACTIONS_CORS_HEADERS }
      );
    }

    // Calculate amount to transfer (assuming 9 decimal places)
    const amount = creditsToBuy * Math.pow(10, 9); 

    // Create the instruction to transfer carbon credits (SPL tokens)
    const transferInstruction = createTransferInstruction(
      userTokenAccount.address,
      destinationTokenAccount.address,
      userKeypair.publicKey,
      amount,
      [],
      TOKEN_PROGRAM_ID
    );

    // Construct the transaction
    const tx = new Transaction().add(transferInstruction);
    tx.feePayer = pubKey;
    const { blockhash } = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;

    // Sign the transaction with the user's keypair
    tx.sign(userKeypair);

    // Send the transaction and wait for confirmation
    const signature = await connection.sendTransaction(tx, [userKeypair], {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });

    await connection.confirmTransaction(signature, "confirmed");

    // Respond with transaction details to display in Blink
    const response = {
      transaction: signature,
      message: `Hello ${userPubkey}, your purchase of ${creditsToBuy} carbon credits is in progress.`,
    };

    return new Response(JSON.stringify(response), {
      headers: ACTIONS_CORS_HEADERS,
    });
  } catch (error: unknown) {
    console.error("POST handler error:", error);

    let errorMessage = "An unknown error occurred.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: errorMessage }),
      { status: 500, headers: ACTIONS_CORS_HEADERS }
    );
  }
}

// Function to handle CORS preflight requests
export async function OPTIONS(request: Request) {
  return new Response(null, {
    headers: ACTIONS_CORS_HEADERS,
  });
}
