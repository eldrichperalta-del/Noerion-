import { createClient } from "@supabase/supabase-js";
import elliptic from "elliptic";

const ec = new elliptic.ec("p256");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ============================================
// SHA-256
// ============================================

async function sha256Hex(
  value: string,
): Promise<string> {
  const bytes =
    new TextEncoder().encode(value);

  const hashBuffer =
    await crypto.subtle.digest(
      "SHA-256",
      bytes,
    );

  return Array.from(
    new Uint8Array(hashBuffer),
  )
    .map((byte) =>
      byte.toString(16).padStart(2, "0"),
    )
    .join("");
}

// ============================================
// VERIFY CERTIFICATE
// ============================================

Deno.serve(async (req: Request) => {
  // ============================================
  // CORS
  // ============================================

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  // ============================================
  // POST ONLY
  // ============================================

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        verified: false,
        error: "Method not allowed.",
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type":
            "application/json",
        },
      },
    );
  }

  try {
    // ============================================
    // REQUEST
    // ============================================

    const body = await req.json();

    const certificateId = String(
      body.certificateId ?? "",
    )
      .replace(/^#/, "")
      .trim();

    if (!certificateId) {
      return new Response(
        JSON.stringify({
          success: false,
          verified: false,
          error:
            "Certificate ID is required.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        },
      );
    }

    // ============================================
    // ENVIRONMENT
    // ============================================

    const supabaseUrl =
      Deno.env.get("SUPABASE_URL");

    const serviceRoleKey =
      Deno.env.get(
        "SUPABASE_SERVICE_ROLE_KEY",
      );

    const privateKey =
      Deno.env.get(
        "CERTIFICATE_PRIVATE_KEY",
      );

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        "Supabase server environment variables are not configured.",
      );
    }

    if (!privateKey) {
      throw new Error(
        "CERTIFICATE_PRIVATE_KEY is not configured.",
      );
    }

    // ============================================
    // ADMIN CLIENT
    // ============================================

    const supabaseAdmin =
      createClient(
        supabaseUrl,
        serviceRoleKey,
      );

    // ============================================
    // FETCH CERTIFICATE
    // ============================================

    const {
      data: certificate,
      error: certificateError,
    } = await supabaseAdmin
      .from("certificates")
      .select(`
        id,
        certificate_id,
        trainee_id,
        assessment_id,
        qualification,
        issued_on,
        result,
        token,
        token_hash,
        hash,
        signature,
        status,
        created_at
      `)
      .eq(
        "certificate_id",
        certificateId,
      )
      .maybeSingle();

    if (certificateError) {
      console.error(
        "Certificate lookup failed:",
        certificateError,
      );

      throw certificateError;
    }

    if (!certificate) {
      console.log(
        "Certificate not found:",
        certificateId,
      );

      return new Response(
        JSON.stringify({
          success: true,
          verified: false,
          certificate: null,
          checks: {
            tokenValid: false,
            databaseHashValid: false,
            qrHashValid: false,
            signatureValid: false,
            signatureMatchesDatabase: false,
            certificateStatusValid: false,
          },
          verificationMethod:
            "QR / Certificate Number",
          error:
            "Certificate could not be found.",
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type":
              "application/json",
          },
        },
      );
    }
    // ============================================
    // FETCH TRAINEE PROFILE
    // ============================================

    const {
      data: trainee,
      error: traineeError,
    } = await supabaseAdmin
      .from("profiles")
      .select(`
        id,
        first_name,
        middle_name,
        last_name,
        suffix
      `)
      .eq(
        "id",
        certificate.trainee_id,
      )
      .maybeSingle();

    if (traineeError) {
      console.error(
        "Trainee lookup failed:",
        traineeError,
      );

      throw traineeError;
    }

    if (!trainee) {
      throw new Error(
        "Trainee profile could not be found for this certificate.",
      );
    }

    // ============================================
    // BUILD TRAINEE NAME
    // ============================================

    const traineeName = [
      trainee.first_name,
      trainee.middle_name,
      trainee.last_name,
      trainee.suffix,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    // ============================================
    // QR / CERTIFICATE ID CHECK
    //
    // The QR code contains the certificate ID.
    // The certificate ID from the QR/request must
    // match the certificate retrieved from Supabase.
    // ============================================

    const qrHashValid =
      certificate.certificate_id ===
      certificateId;

    // ============================================
    // TOKEN CHECK
    //
    // The raw token remains server-side.
    //
    // We hash the stored token and compare it
    // against the stored token_hash.
    // ============================================

    let tokenValid = false;

    if (
      typeof certificate.token === "string" &&
      typeof certificate.token_hash === "string"
    ) {
      const calculatedTokenHash =
        await sha256Hex(
          certificate.token,
        );

      tokenValid =
        calculatedTokenHash ===
        certificate.token_hash;
    }

    // ============================================
    // REBUILD EXACT SIGNING PAYLOAD
    //
    // This MUST remain identical to create/index.ts
    // ============================================

    const signingPayload = [
      certificate.certificate_id,
      certificate.trainee_id,
      certificate.qualification,
      certificate.issued_on,
      certificate.result,
      certificate.token,
    ].join("|");

    console.log(
      "CERTIFICATE VERIFICATION PAYLOAD:",
      signingPayload,
    );

    // ============================================
    // RECALCULATE CERTIFICATE HASH
    // ============================================

    const calculatedHash =
      await sha256Hex(
        signingPayload,
      );

    // ============================================
    // CERTIFICATE INTEGRITY
    // ============================================

    const databaseHashValid =
      calculatedHash ===
      certificate.hash;

    // ============================================
    // DIGITAL SIGNATURE
    // ============================================

    let signatureValid = false;

    try {
      if (
        typeof certificate.signature ===
        "string" &&
        certificate.signature.length > 0
      ) {
        const keyPair =
          ec.keyFromPrivate(
            privateKey.trim(),
            "hex",
          );

        const publicKey =
          keyPair.getPublic("hex");

        const publicKeyObject =
          ec.keyFromPublic(
            publicKey,
            "hex",
          );

        signatureValid =
          publicKeyObject.verify(
            calculatedHash,
            certificate.signature,
          );
      }
    } catch (signatureError) {
      console.error(
        "Digital signature verification failed:",
        signatureError,
      );

      signatureValid = false;
    }

    // ============================================
    // SIGNATURE MATCH
    //
    // The signature is valid only when:
    //
    // 1. A signature exists.
    // 2. The signature validates against the
    //    recalculated certificate hash.
    // 3. The recalculated hash matches the
    //    database hash.
    // ============================================

    const signatureMatchesDatabase =
      Boolean(
        certificate.signature,
      ) &&
      signatureValid &&
      databaseHashValid;

    // ============================================
    // CERTIFICATE STATUS
    // ============================================

    const certificateStatusValid =
      certificate.status === "Valid";

    // ============================================
    // FINAL VERIFICATION
    // ============================================

    const verified =
      tokenValid &&
      databaseHashValid &&
      qrHashValid &&
      signatureValid &&
      signatureMatchesDatabase &&
      certificateStatusValid;


    // ============================================
    // RECORD SUCCESSFUL VERIFICATION
    // ============================================

    if (verified) {
      const { error: verificationLogError } =
        await supabaseAdmin
          .from("certificate_verifications")
          .insert({
            certificate_id: certificate.id,
            status: "Verified",
          });

      if (verificationLogError) {
        console.error(
          "Failed to record certificate verification:",
          verificationLogError
        );
      }
    }

    
    // ============================================
    // RESPONSE
    // ============================================

    return new Response(
      JSON.stringify({
        success: true,

        verified,

        certificate: {
          id:
            certificate.id,

          certificateId:
            certificate.certificate_id,

          traineeId:
            certificate.trainee_id,

          traineeName:
            traineeName || "—",

          qualification:
            certificate.qualification,

          issuedOn:
            certificate.issued_on,

          result:
            certificate.result,

          status:
            certificate.status,

          createdAt:
            certificate.created_at,

          assessmentId:
            certificate.assessment_id,
        },

        checks: {
          tokenValid,

          databaseHashValid,

          qrHashValid,

          signatureValid,

          signatureMatchesDatabase,

          certificateStatusValid,
        },

        verificationMethod:
          "QR / Certificate Number",

        error:
          verified
            ? null
            : "One or more certificate security checks failed.",
      }),
      {
        status: 200,

        headers: {
          ...corsHeaders,
          "Content-Type":
            "application/json",
        },
      },
    );
  } catch (error) {
    console.error(
      "Certificate verification failed:",
      error,
    );

    return new Response(
      JSON.stringify({
        success: false,
        verified: false,
        error:
          error instanceof Error
            ? error.message
            : "Certificate verification failed.",
      }),
      {
        status: 500,

        headers: {
          ...corsHeaders,
          "Content-Type":
            "application/json",
        },
      },
    );
  }
});