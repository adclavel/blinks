import { ActionGetResponse, ActionPostRequest, ActionPostResponse, ACTIONS_CORS_HEADERS} from "@solana/actions";
import { headers } from "next/headers";
import {PublicKey, SystemProgram, Transaction} from "@solana/web3.js"
import { ACTION } from "next/dist/client/components/app-router-headers";


export async function GET(request: Request) {
  const responseBody : ActionGetResponse = {
    icon: "https://www.pngitem.com/pimgs/m/235-2356755_environmental-science-icon-png-eco-friendly-icon-png.png",
    description: "Support global environmental projects with a quick, transparent donation through our Solana Blink. Your contribution funds initiatives like reforestation and carbon capture, tracked securely on the blockchain.",
    title: "Donation Blinks for Environmental Projects",
    label: "Click Me",
    error: {
      message: "Blinks not implemented yet"
    } 
  }

  const response = Response.json(responseBody, {headers: ACTIONS_CORS_HEADERS}) 
  return response
}
export async function POST(request: Request) {

  const requestBOdy: ActionPostRequest = await request.json();
  const userPubkey = requestBOdy.account;
  console.log(userPubkey);

  const tx = new Transaction(); 
  tx.feePayer = new PublicKey(userPubkey);
  tx.recentBlockhash = SystemProgram.programId.toBase58()
  const serialTX = tx.serialize({requireAllSignatures: false, verifySignatures: false}).toString("base64")

  const response: ActionPostResponse = {
    transaction: serialTX,
    message: "Hello " + userPubkey
  };

  return Response.json(response, {headers: ACTIONS_CORS_HEADERS})
}

export async function OPTIONS(request: Request) {
    return new Response(null, {headers: ACTIONS_CORS_HEADERS})
}

