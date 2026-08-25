import { createClient } from "@supabase/supabase-js";
import elliptic from "elliptic";

const ec = new elliptic.ec("p256");

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);

  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    bytes,
  );

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  // =========================
  // CORS
  // =========================

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  // =========================
  // POST ONLY
  // =========================

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
    // =========================
    // READ REQUEST
    // =========================

    const body = await req.json();

    const trainee_name = String(
      body.trainee_name ?? "",
    ).trim();

    const trainee_id = String(
      body.trainee_id ?? "",
    ).trim();

    const student_id = String(
      body.student_id ?? "",
    ).trim();

    const qualification = String(
      body.qualification ?? "",
    ).trim();

    const skill = String(
      body.skill ?? "",
    ).trim();

    const result = String(
      body.result ?? "",
    ).trim();

    // =========================
    // VALIDATION
    // =========================

    if (!trainee_name) {
      throw new Error("Trainee name is required.");
    }

    if (!student_id) {
      throw new Error("Student ID is required.");
    }

    if (!qualification) {
      throw new Error("Qualification is required.");
    }

    if (!skill) {
      throw new Error("Skill is required.");
    }

    if (!result) {
      throw new Error("Result is required.");
    }

    // =========================
    // SUPABASE ADMIN CLIENT
    // =========================

    const supabaseUrl =
      Deno.env.get("SUPABASE_URL");

    const serviceRoleKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const privateKey =
      Deno.env.get("CERTIFICATE_PRIVATE_KEY");

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

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
    );

    // =========================
    // PRIVATE SIGNING KEY
    // =========================

    const keyPair = ec.keyFromPrivate(
      privateKey.trim(),
      "hex",
    );

    // =========================
    // GENERATE CERTIFICATE ID
    // =========================

    const year = new Date().getFullYear();

    const randomPart = Math.floor(
      100000 + Math.random() * 900000,
    );

    const certificateId =
      `CERT-${year}-${randomPart}`;

    // =========================
    // TRAINEE ID
    // =========================

    const traineeId =
      trainee_id ||
      `TR-${crypto.randomUUID()}`;

    // =========================
    // ISSUE DATE
    // =========================

    const issuedOn =
      new Date()
        .toISOString()
        .split("T")[0];

    // =========================
    // SIGNING PAYLOAD
    // =========================

    const signingPayload = [
      certificateId,
      traineeId,
      trainee_name,
      student_id,
      qualification,
      skill,
      issuedOn,
      result,
    ].join("|");

    // =========================
    // SHA-256 HASH
    // =========================

    const hash =
      await sha256Hex(signingPayload);

    // =========================
    // DIGITAL SIGNATURE
    // =========================

    const signature =
      keyPair
        .sign(hash)
        .toDER("hex");

    // =========================
    // TOKEN
    // =========================

    const token = certificateId;

    // =========================
    // INSERT CERTIFICATE
    // =========================

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

        trainee_name:
          trainee_name,

        student_id:
          student_id,

        qualification:
          qualification,

        skill:
          skill,

        issued_on:
          issuedOn,

        result:
          result,

        token:
          token,

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

    // =========================
    // SUCCESS
    // =========================

    return new Response(
      JSON.stringify({
        success: true,
        certificate: data,
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