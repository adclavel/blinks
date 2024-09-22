import {
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
  ACTIONS_CORS_HEADERS
} from "@solana/actions";
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction
} from "@solana/web3.js";

/**
 * GET handler
 */
export async function GET(request: Request) {
  const responseBody: ActionGetResponse = {
    icon: "https://www.pngitem.com/pimgs/m/235-2356755_environmental-science-icon-png-eco-friendly-icon-png.png",
    description:
      "Support global environmental projects with a quick, transparent donation through our Solana Blink. Your contribution funds initiatives like reforestation and carbon capture, tracked securely on the blockchain.",
    title: "Donation Blinks for Environmental Projects",
    label: "Click Me",
    error: {
      message: "Blinks not implemented yet"
    }
  };

  return new Response(JSON.stringify(responseBody), { headers: ACTIONS_CORS_HEADERS });
}

/**
 * POST handler
 */
export async function POST(request: Request) {
  try {
    // Parse the incoming POST request body
    const requestBody: ActionPostRequest = await request.json();
    const userPubkey = requestBody.account;

    // Check if the public key exists in the request body
    if (!userPubkey) {
      return new Response(
        JSON.stringify({ error: 'Public key is missing in the request body.' }),
        { status: 400, headers: ACTIONS_CORS_HEADERS }
      );
    }

    // Validate that the public key is base58 encoded and valid
    try {
      const pubKey = new PublicKey(userPubkey);
      if (!PublicKey.isOnCurve(pubKey)) {
        throw new Error('Invalid public key.');
      }
    } catch (err) {
      return new Response(
        JSON.stringify({ error: 'Invalid public key format.' }),
        { status: 400, headers: ACTIONS_CORS_HEADERS }
      );
    }

    console.log("User Public Key:", userPubkey);

    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const tx = new Transaction();
    tx.feePayer = new PublicKey(userPubkey);

    const { blockhash } = await connection.getLatestBlockhash({ commitment: "finalized" });
    tx.recentBlockhash = blockhash;

    // Use an actual recipient public key
    const receiverPubkey = new PublicKey("5Lc2SK5L1Kja5qUj5xhK7N8TkEJbk8tEs92hQaHQg8tk"); // Replace with recipient's public key
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: new PublicKey(userPubkey),
      toPubkey: receiverPubkey,
      lamports: 10000000 // 0.01 SOL
    });

    tx.add(transferInstruction);

    const serializedTx = tx.serialize({ requireAllSignatures: false }).toString("base64");

    if (!serializedTx) {
      throw new Error('Failed to serialize the transaction.');
    }

    console.log("Serialized Transaction:", serializedTx);

    const response: ActionPostResponse = {
      transaction: serializedTx,
      message: `Hello ${userPubkey}, your donation is in progress.`
    };

    return new Response(JSON.stringify(response), { headers: ACTIONS_CORS_HEADERS });
  } catch (error) {
    console.error("POST handler error:", error);

    const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred';

    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: errorMessage }),
      { status: 500, headers: ACTIONS_CORS_HEADERS }
    );
  }
}

/**
 * OPTIONS handler
 */
export async function OPTIONS(request: Request) {
  return new Response(null, { headers: ACTIONS_CORS_HEADERS });
}
