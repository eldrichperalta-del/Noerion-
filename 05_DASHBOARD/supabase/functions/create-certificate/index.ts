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

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);

  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    bytes,
  );

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) =>
      byte.toString(16).padStart(2, "0"),
    )
    .join("");
}

// ============================================
// SECURE TOKEN
// ============================================

function generateSecureToken(): string {
  const bytes = new Uint8Array(32);

  crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map((byte) =>
      byte.toString(16).padStart(2, "0"),
    )
    .join("");
}

// ============================================
// SECURE CERTIFICATE NUMBER
// ============================================

function generateCertificateNumber(): number {
  const random = new Uint32Array(1);

  crypto.getRandomValues(random);

  return (
    100000 +
    (random[0] % 900000)
  );
}

// ============================================
// CREATE CERTIFICATE
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
        error: "Method not allowed.",
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }

  try {
    // ============================================
    // REQUEST BODY
    // ============================================

    const body = await req.json();

    const traineeId = String(
      body.trainee_id ?? "",
    ).trim();

    const qualification = String(
      body.qualification ?? "",
    ).trim();

    const result = String(
      body.result ?? "",
    ).trim();

    // ============================================
    // VALIDATION
    // ============================================

    if (!traineeId) {
      throw new Error(
        "Trainee ID is required.",
      );
    }

    if (!qualification) {
      throw new Error(
        "Qualification is required.",
      );
    }

    if (!result) {
      throw new Error(
        "Result is required.",
      );
    }

    // ============================================
    // SUPABASE ENVIRONMENT
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
    // SUPABASE ADMIN CLIENT
    // ============================================

    const supabaseAdmin =
      createClient(
        supabaseUrl,
        serviceRoleKey,
      );

    // ============================================
    // FETCH TRAINEE
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
      .eq("id", traineeId)
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
        "Trainee profile could not be found.",
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
    // GENERATE CERTIFICATE ID
    // ============================================

    const year =
      new Date().getFullYear();

    const certificateId =
      `CERT-${year}-${generateCertificateNumber()}`;

    // ============================================
    // ISSUE DATE
    // ============================================

    const issuedOn =
      new Date()
        .toISOString()
        .split("T")[0];

    // ============================================
    // GENERATE SECURITY TOKEN
    // ============================================

    const token =
      generateSecureToken();

    // ============================================
    // TOKEN HASH
    // ============================================

    const tokenHash =
      await sha256Hex(token);

    // ============================================
    // SIGNING PAYLOAD
    //
    // IMPORTANT:
    // Verify function MUST use this exact
    // same order and values.
    // ============================================

    const signingPayload = [
      certificateId,
      traineeId,
      qualification,
      issuedOn,
      result,
      token,
    ].join("|");

    console.log(
      "CERTIFICATE SIGNING PAYLOAD:",
      signingPayload,
    );

    // ============================================
    // CERTIFICATE HASH
    // ============================================

    const hash =
      await sha256Hex(
        signingPayload,
      );

    // ============================================
    // DIGITAL SIGNATURE
    // ============================================

    const keyPair =
      ec.keyFromPrivate(
        privateKey.trim(),
        "hex",
      );

    const signature =
      keyPair
        .sign(hash)
        .toDER("hex");

    // ============================================
    // INSERT CERTIFICATE
    // ============================================

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("certificates")
      .insert({
        certificate_id:
          certificateId,

        trainee_id:
          traineeId,

        qualification:
          qualification,

        issued_on:
          issuedOn,

        result:
          result,

        token:
          token,

        token_hash:
          tokenHash,

        hash:
          hash,

        signature:
          signature,

        status:
          "Valid",
      })
      .select(`
        id,
        certificate_id,
        trainee_id,
        qualification,
        issued_on,
        result,
        token,
        token_hash,
        hash,
        signature,
        status,
        created_at,
        assessment_id
      `)
      .single();

    if (error) {
      console.error(
        "Certificate insert failed:",
        error,
      );

      throw new Error(
        error.message,
      );
    }

    // ============================================
    // SUCCESS
    // ============================================

    return new Response(
      JSON.stringify({
        success: true,

        certificate: {
          ...data,

          traineeName:
            traineeName || "—",
        },
      }),
      {
        status: 201,

        headers: {
          ...corsHeaders,
          "Content-Type":
            "application/json",
        },
      },
    );
  } catch (error) {
    console.error(
      "Create certificate error:",
      error,
    );

    return new Response(
      JSON.stringify({
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Failed to create certificate.",
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
});