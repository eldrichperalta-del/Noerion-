import { supabase } from "../supabaseClient";

export async function getCertificateById(certificateId) {
  const id = decodeURIComponent(certificateId || "")
    .replace(/^#/, "")
    .trim();

  if (!id) {
    return null;
  }

  const { data, error } = await supabase
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
    .eq("certificate_id", id)
    .maybeSingle();

  if (error) {
    console.error("Certificate lookup failed:", error);
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    certificateId: data.certificate_id,
    traineeId: data.trainee_id,
    traineeName: data.trainee_name,
    studentId: data.student_id,
    qualification: data.qualification,
    skill: data.skill,
    issuedOn: data.issued_on,
    result: data.result,
    token: data.token,
    hash: data.hash,
    signature: data.signature,
    status: data.status,
    createdAt: data.created_at,
  };
}