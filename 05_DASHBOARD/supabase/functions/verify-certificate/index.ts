import { createClient } from "@supabase/supabase-js";
import elliptic from "npm:elliptic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ec = new elliptic.ec("p256");

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);

  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    bytes
  );

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export default {
  async fetch(req: Request): Promise<Response> {
    if (req.method === "OPTIONS") {
      return new Response("ok", {
        headers: corsHeaders,
      });
    }

    if (req.method !== "POST") {
      return Response.json(
        {
          success: false,
          verified: false,
          error: "Method not allowed.",
        },
        {
          status: 405,
          headers: corsHeaders,
        }
      );
    }

    try {
      const body = await req.json();

      const certificateId =
        String(body.certificateId || "").trim();

      const receivedToken =
        String(body.token || "").trim();

      const receivedHash =
        String(body.hash || "").trim();

      const receivedSignature =
        String(body.signature || "").trim();

      if (!certificateId) {
        return Response.json(
          {
            success: false,
            verified: false,
            error: "Certificate ID is required.",
          },
          {
            status: 400,
            headers: corsHeaders,
          }
        );
      }

      const supabaseUrl =
        Deno.env.get("SUPABASE_URL");

      const serviceRoleKey =
        Deno.env.get(
          "SUPABASE_SERVICE_ROLE_KEY"
        );

      const privateKey =
        Deno.env.get(
          "CERTIFICATE_PRIVATE_KEY"
        );

      if (
        !supabaseUrl ||
        !serviceRoleKey ||
        !privateKey
      ) {
        throw new Error(
          "Required Supabase server environment variables are not configured."
        );
      }

      const supabase = createClient(
        supabaseUrl,
        serviceRoleKey
      );

      const { data: certificate, error } =
        await supabase
          .from("certificates")
          .select(`
            certificate_id,
            trainee_id,
            trainee_name,
            student_id,
            qualification,
            skill,
            issued_on,
            result,
            token,
            hash,
            signature,
            status,
            created_at
          `)
          .eq(
            "certificate_id",
            certificateId
          )
          .maybeSingle();

      if (error) {
        console.error(
          "Certificate lookup failed:",
          error
        );

        throw error;
      }

      if (!certificate) {
        return Response.json(
          {
            success: false,
            verified: false,
            error:
              "Certificate could not be found.",
          },
          {
            status: 404,
            headers: corsHeaders,
          }
        );
      }

      /*
       * Reconstruct the exact payload that was
       * signed when the certificate was created.
       */
      const signingPayload = [
        certificate.certificate_id,
        certificate.trainee_id,
        certificate.trainee_name,
        certificate.student_id,
        certificate.qualification,
        certificate.skill,
        certificate.issued_on,
        certificate.result,
      ].join("|");

      const calculatedHash =
        await sha256Hex(signingPayload);

      /*
       * TOKEN CHECK
       *
       * The current creation function stores
       * certificateId as the token.
       */
      const tokenValid =
        receivedToken ===
        certificate.token &&
        certificate.token ===
        certificate.certificate_id;

      /*
       * DATABASE HASH CHECK
       */
      const databaseHashValid =
        calculatedHash === certificate.hash;

      /*
       * QR HASH CHECK
       */
      const qrHashValid =
        receivedHash === certificate.hash &&
        receivedHash === calculatedHash;

      /*
       * SIGNATURE STORED IN DATABASE
       */
      const signatureMatchesDatabase =
        receivedSignature ===
        certificate.signature;

      /*
       * ECDSA SIGNATURE CHECK
       *
       * We derive the public key from the
       * server-side private key.
       *
       * The private key itself is never returned
       * to the browser.
       */
      let signatureValid = false;

      try {
        if (
          certificate.signature &&
          receivedSignature &&
          calculatedHash
        ) {
          const keyPair =
            ec.keyFromPrivate(
              privateKey,
              "hex"
            );

          const publicKey =
            keyPair.getPublic(
              "hex"
            );

          const publicKeyObject =
            ec.keyFromPublic(
              publicKey,
              "hex"
            );

          signatureValid =
            publicKeyObject.verify(
              calculatedHash,
              certificate.signature
            );
        }
      } catch (signatureError) {
        console.error(
          "Signature verification failed:",
          signatureError
        );

        signatureValid = false;
      }

      const certificateStatusValid =
        certificate.status === "Valid";

      const verified =
        tokenValid &&
        databaseHashValid &&
        qrHashValid &&
        signatureMatchesDatabase &&
        signatureValid &&
        certificateStatusValid;

      return Response.json(
        {
          success: true,
          verified,

          certificate: {
            certificateId:
              certificate.certificate_id,

            traineeId:
              certificate.trainee_id,

            traineeName:
              certificate.trainee_name,

            studentId:
              certificate.student_id,

            qualification:
              certificate.qualification,

            skill:
              certificate.skill,

            issuedOn:
              certificate.issued_on,

            result:
              certificate.result,

            status:
              certificate.status,

            createdAt:
              certificate.created_at,
          },

          checks: {
            tokenValid,
            databaseHashValid,
            qrHashValid,
            signatureMatchesDatabase,
            signatureValid,
            certificateStatusValid,
          },

          error: verified
            ? null
            : "One or more certificate security checks failed.",
        },
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    } catch (error) {
      console.error(
        "Certificate verification failed:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : String(error);

      return Response.json(
        {
          success: false,
          verified: false,
          error: message,
        },
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        }
      );
    }
  },
};
