export async function hashCertificate(certificate) {
  // Create one consistent string from the certificate
  const data = [
    certificate.certificateId,
    certificate.traineeName,
    certificate.studentId,
    certificate.qualification,
    certificate.skill,
    certificate.issuedOn,
    certificate.result,
  ].join("|");

  // Encode to bytes
  const encoder = new TextEncoder();
  const bytes = encoder.encode(data);

  // SHA-256
  const hashBuffer = await crypto.subtle.digest("SHA-256", bytes);

  // Convert bytes to hex
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}