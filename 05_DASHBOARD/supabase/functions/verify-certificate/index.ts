import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export default {
  async fetch(req: Request): Promise<Response> {
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
      return Response.json(
        {
          success: false,
          error: "Method not allowed.",
        },
        {
          status: 405,
          headers: corsHeaders,
        }
      );
    }

    try {
      // =========================
      // READ REQUEST
      // =========================

      const body = await req.json();

      const name = String(body.name || "").trim();
      const studentId = String(body.studentId || "").trim();
      const qualification = String(
        body.qualification || ""
      ).trim();
      const skill = String(body.skill || "").trim();
      const result = String(body.result || "").trim();

      // =========================
      // VALIDATION
      // =========================

      if (!name) {
        return Response.json(
          {
            success: false,
            error: "Trainee name is required.",
          },
          {
            status: 400,
            headers: corsHeaders,
          }
        );
      }

      if (!studentId) {
        return Response.json(
          {
            success: false,
            error: "Student ID is required.",
          },
          {
            status: 400,
            headers: corsHeaders,
          }
        );
      }

      if (!qualification) {
        return Response.json(
          {
            success: false,
            error: "Qualification is required.",
          },
          {
            status: 400,
            headers: corsHeaders,
          }
        );
      }

      if (!skill) {
        return Response.json(
          {
            success: false,
            error: "Skill is required.",
          },
          {
            status: 400,
            headers: corsHeaders,
          }
        );
      }

      if (!result) {
        return Response.json(
          {
            success: false,
            error: "Result is required.",
          },
          {
            status: 400,
            headers: corsHeaders,
          }
        );
      }

      // =========================
      // SUPABASE SERVER CLIENT
      // =========================

      const supabaseUrl =
        Deno.env.get("SUPABASE_URL");

      const serviceRoleKey =
        Deno.env.get(
          "SUPABASE_SERVICE_ROLE_KEY"
        );

      if (!supabaseUrl || !serviceRoleKey) {
        throw new Error(
          "Supabase server environment variables are not configured."
        );
      }

      const supabase = createClient(
        supabaseUrl,
        serviceRoleKey
      );

      // =========================
      // GENERATE CERTIFICATE ID
      // =========================

      const year = new Date()
        .getFullYear();

      const randomPart = Math.floor(
        100000 + Math.random() * 900000
      );

      const certificateId =
        `CERT-${year}-${randomPart}`;

      // =========================
      // DATE
      // =========================

      const issuedOn =
        new Date()
          .toISOString()
          .split("T")[0];

      // =========================
      // TRAINEE ID
      // =========================

      const traineeId =
        `TR-${crypto.randomUUID()}`;

      // =========================
      // INSERT
      // =========================

      const {
        data,
        error,
      } = await supabase
        .from("certificates")
        .insert({
          certificate_id:
            certificateId,

          trainee_id:
            traineeId,

          trainee_name:
            name,

          student_id:
            studentId,

          qualification:
            qualification,

          skill:
            skill,

          issued_on:
            issuedOn,

          result:
            result,

          /*
           * Security values will be generated
           * by the signing stage.
           *
           * DO NOT generate fake values here.
           */
          token: null,
          hash: null,
          signature: null,

          status: "Valid",
        })
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
        .single();

      if (error) {
        console.error(
          "Certificate insert failed:",
          error
        );

        throw error;
      }

      // =========================
      // RESPONSE
      // =========================

      return Response.json(
        {
          success: true,

          certificate: {
            certificateId:
              data.certificate_id,

            traineeId:
              data.trainee_id,

            traineeName:
              data.trainee_name,

            studentId:
              data.student_id,

            qualification:
              data.qualification,

            skill:
              data.skill,

            issuedOn:
              data.issued_on,

            result:
              data.result,

            token:
              data.token,

            hash:
              data.hash,

            signature:
              data.signature,

            status:
              data.status,

            createdAt:
              data.created_at,
          },
        },
        {
          status: 201,
          headers: corsHeaders,
        }
      );
    } catch (error) {
      console.error(
        "Create certificate failed:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : String(error);

      return Response.json(
        {
          success: false,
          error: message,
        },
        {
          status: 500,
          headers: corsHeaders,
        }
      );
    }
  },
};