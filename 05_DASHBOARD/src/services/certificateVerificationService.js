import { supabase } from "../supabaseClient.js";

/**
 * Get a certificate using either:
 *
 * 1. certificates.id (UUID)
 * 2. certificates.certificate_id (e.g. CERT-2026-931368)
 *
 * The trainee's name is fetched from profiles using certificates.trainee_id.
 */
export async function getCertificateById(identifier) {
  const value = decodeURIComponent(identifier || "")
    .replace(/^#/, "")
    .trim();

  if (!value) {
    console.warn("No certificate identifier provided.");
    return null;
  }

  console.log("========================================");
  console.log("CERTIFICATE LOOKUP");
  console.log("Identifier:", value);
  console.log("========================================");

  try {
    // ---------------------------------------------------------
    // 1. FIND CERTIFICATE
    // ---------------------------------------------------------

    let certificate = null;
    let certificateError = null;

    // UUID-looking value = probably certificates.id
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value
      );

    if (isUuid) {
      const result = await supabase
        .from("certificates")
        .select(`
          id,
          certificate_id,
          trainee_id,
          qualification,
          issued_on,
          result,
          token,
          hash,
          signature,
          status,
          created_at,
          assessment_id,
          token_hash
        `)
        .eq("id", value)
        .maybeSingle();

      certificate = result.data;
      certificateError = result.error;
    }

    // If UUID lookup did not find anything, try certificate_id.
    if (!certificate && !certificateError) {
      const result = await supabase
        .from("certificates")
        .select(`
          id,
          certificate_id,
          trainee_id,
          qualification,
          issued_on,
          result,
          token,
          hash,
          signature,
          status,
          created_at,
          assessment_id,
          token_hash
        `)
        .eq("certificate_id", value)
        .maybeSingle();

      certificate = result.data;
      certificateError = result.error;
    }

    if (certificateError) {
      console.error(
        "Certificate lookup failed:",
        certificateError
      );

      throw certificateError;
    }

    if (!certificate) {
      console.error(
        "Certificate not found:",
        value
      );

      return null;
    }

    console.log(
      "Certificate found:",
      certificate
    );

    // ---------------------------------------------------------
    // 2. GET TRAINEE PROFILE
    // ---------------------------------------------------------

    let trainee = null;

    if (certificate.trainee_id) {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          id,
          email,
          first_name,
          middle_name,
          last_name,
          suffix,
          profile_photo_url
        `)
        .eq("id", certificate.trainee_id)
        .maybeSingle();

      if (error) {
        console.error(
          "Trainee profile lookup failed:",
          error
        );
      } else {
        trainee = data;
      }
    }

    console.log(
      "Trainee profile:",
      trainee
    );

    // ---------------------------------------------------------
    // 3. BUILD FULL TRAINEE NAME
    // ---------------------------------------------------------

    const traineeName = [
      trainee?.first_name,
      trainee?.middle_name,
      trainee?.last_name,
      trainee?.suffix,
    ]
      .filter(
        (part) =>
          part !== null &&
          part !== undefined &&
          String(part).trim() !== ""
      )
      .map((part) => String(part).trim())
      .join(" ");

    // ---------------------------------------------------------
    // 4. GET TRAINEE TRAINING INFORMATION
    // ---------------------------------------------------------

    let traineeProfile = null;

    if (certificate.trainee_id) {
      const { data, error } = await supabase
        .from("trainee_profiles")
        .select(`
          user_id,
          training_center,
          nc_level,
          qualification_course,
          batch,
          center_id
        `)
        .eq("user_id", certificate.trainee_id)
        .maybeSingle();

      if (error) {
        console.error(
          "Trainee training profile lookup failed:",
          error
        );
      } else {
        traineeProfile = data;
      }
    }

    console.log(
      "Trainee training profile:",
      traineeProfile
    );

    // ---------------------------------------------------------
    // 5. RETURN DATA FOR CERTIFICATE PAGE
    // ---------------------------------------------------------

    return {
      id: certificate.id,

      certificateId:
        certificate.certificate_id,

      traineeId:
        certificate.trainee_id,

      traineeName:
        traineeName || "Trainee Name",

      studentId:
        certificate.trainee_id,

      qualification:
        certificate.qualification ||
        traineeProfile?.qualification_course ||
        "Qualification",

      issuedOn:
        certificate.issued_on,

      result:
        certificate.result || "Passed",

      status:
        certificate.status,

      token:
        certificate.token,

      hash:
        certificate.hash,

      signature:
        certificate.signature,

      createdAt:
        certificate.created_at,

      assessmentId:
        certificate.assessment_id,

      tokenHash:
        certificate.token_hash,

      trainingCenter:
        traineeProfile?.training_center || "",

      ncLevel:
        traineeProfile?.nc_level || "",

      batch:
        traineeProfile?.batch || "",

      email:
        trainee?.email || "",

      profilePhotoUrl:
        trainee?.profile_photo_url || "",
    };
  } catch (error) {
    console.error(
      "getCertificateById error:",
      error
    );

    throw error;
  }
}
