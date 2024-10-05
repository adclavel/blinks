const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');

// Your private key in Base58 format
const base58PrivateKey = "4HoKvLqn1ytkQ5sJxqecyT2n3nGf81bhhNDtFgckEmAFL9976KETGDXjLskY1ucfZowk2XnvQeFoPkKQawKbrj93";

// Decode the Base58 private key to get the secret key as a Uint8Array
const secretKey = bs58.decode(base58PrivateKey);

// Create a new Keypair from the secret key
const keypair = Keypair.fromSecretKey(secretKey);

// Output the secret key as an array of numbers
console.log("Secret Key:", Array.from(keypair.secretKey));
console.log("Secret Key Length:", keypair.secretKey.length);
