import { ec as EC } from "elliptic";

const ec = new EC("p256");

/**
 * NOERION ECDSA
 *
 * IMPORTANT:
 * The private signing key MUST NOT exist in frontend code.
 *
 * Certificate signing is performed by the Supabase Edge Function:
 *
 * supabase/functions/create-certificate/index.ts
 *
 * Certificate verification is performed by:
 *
 * supabase/functions/verify-certificate/index.ts
 *
 * The browser only needs the public key if local verification
 * is ever required.
 */

/**
 * Verify a SHA-256 hash using a supplied public key.
 *
 * @param {string} hash
 * @param {string} signature
 * @param {string} publicKey
 * @returns {boolean}
 */
export function verifyHash(hash, signature, publicKey) {
  try {
    if (!hash || !signature || !publicKey) {
      return false;
    }

    const publicKeyObj = ec.keyFromPublic(
      publicKey,
      "hex"
    );

    return publicKeyObj.verify(
      hash,
      signature
    );
  } catch (error) {
    console.error(
      "ECDSA verification failed:",
      error
    );

    return false;
  }
}