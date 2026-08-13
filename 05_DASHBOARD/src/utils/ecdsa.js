import { ec as EC } from "elliptic";

const ec = new EC("p256");

// Fixed local key pair for the prototype
const PRIVATE_KEY =
  "519b423d715f8b5d5491f8b6e3f7b5b7b1f3d8a5b9c6d7e8f9a0b1c2d3e4f5a6";

const keyPair = ec.keyFromPrivate(PRIVATE_KEY, "hex");

export const publicKey = keyPair.getPublic("hex");

// Sign a SHA-256 hash
export function signHash(hash) {
  return keyPair.sign(hash).toDER("hex");
}

// Verify a SHA-256 hash
export function verifyHash(hash, signature) {
  const publicKeyObj = ec.keyFromPublic(publicKey, "hex");
  return publicKeyObj.verify(hash, signature);
}