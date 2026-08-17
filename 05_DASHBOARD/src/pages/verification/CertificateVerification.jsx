import { verifyHash } from "../../utils/ecdsa";
import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { hashCertificate } from "../../utils/hashCertificate";
import { getCertificateById } from "../../services/certificateVerificationService";
import "./certificateVerification.css";

export default function CertificateVerification() {
  const navigate = useNavigate();
  const { certificateId } = useParams();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");
  const receivedHash = searchParams.get("hash");
  const signature = searchParams.get("sig");

  const [certificate, setCertificate] = useState(null);
  const [generatedHash, setGeneratedHash] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  /*
   * Convert Supabase date:
   *
   * 2025-04-14
   *
   * back to the format used when the certificate hash
   * was originally generated:
   *
   * April 14, 2025
   */
  function formatIssuedDate(dateValue) {
    if (!dateValue) {
      return "";
    }

    const date = new Date(`${dateValue}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  /*
   * Load certificate from Supabase.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadCertificate() {
      try {
        setLoading(true);
        setErrorMessage("");
        setCertificate(null);
        setGeneratedHash("");

        console.log("========================================");
        console.log("NOERION CERTIFICATE LOOKUP");
        console.log("Certificate ID:", certificateId);
        console.log("========================================");

        const data = await getCertificateById(certificateId);

        if (cancelled) {
          return;
        }

        if (!data) {
          console.log("Certificate not found.");
          setCertificate(null);
          setLoading(false);
          return;
        }

        console.log("Certificate loaded from Supabase:");
        console.log(data);

        setCertificate(data);
      } catch (error) {
        console.error("Certificate lookup failed:", error);

        if (!cancelled) {
          setErrorMessage(
            "Unable to access the NOERION certificate verification records."
          );
          setCertificate(null);
          setLoading(false);
        }
      }
    }

    loadCertificate();

    return () => {
      cancelled = true;
    };
  }, [certificateId]);

  /*
   * Generate the certificate hash.
   */
  useEffect(() => {
    if (!certificate) {
      return;
    }

    let cancelled = false;

    async function generateCertificateHash() {
      try {
        console.log("========================================");
        console.log("NOERION HASH GENERATION");
        console.log("Certificate:", certificate.certificateId);
        console.log("Issued on DB:", certificate.issuedOn);
        console.log(
          "Issued on Hash:",
          formatIssuedDate(certificate.issuedOn)
        );

        const hash = await hashCertificate({
          certificateId: certificate.certificateId,
          traineeName: certificate.traineeName,
          studentId: certificate.studentId,
          qualification: certificate.qualification,
          skill: certificate.skill,
          issuedOn: formatIssuedDate(certificate.issuedOn),
          result: certificate.result,
        });

        if (cancelled) {
          return;
        }

        console.log("Generated Hash:", hash);
        console.log("Database Hash:", certificate.hash);
        console.log("QR Hash:", receivedHash);
        console.log("Database Signature:", certificate.signature);
        console.log("QR Signature:", signature);
        console.log("========================================");

        setGeneratedHash(hash);
        setLoading(false);
      } catch (error) {
        console.error("Hash generation failed:", error);

        if (!cancelled) {
          setErrorMessage("Unable to generate the certificate hash.");
          setLoading(false);
        }
      }
    }

    generateCertificateHash();

    return () => {
      cancelled = true;
    };
  }, [certificate, receivedHash, signature]);

  /*
   * LOADING SCREEN
   *
   * This is important because certificate is initially null.
   */
  if (loading) {
    return (
      <main className="verification-page">
        <div className="verification-grid" aria-hidden="true" />

        <div
          className="verification-circuit circuit-left"
          aria-hidden="true"
        />

        <div
          className="verification-circuit circuit-right"
          aria-hidden="true"
        />

        <section
          className="verification-content"
          aria-labelledby="verification-title"
        >
          <header className="verification-heading">
            <p className="verification-brand">NOERION</p>

            <h1 id="verification-title">
              Certificate Verification
            </h1>
          </header>

          <article className="verification-card">
            <div
              className="verification-status"
              style={{ color: "#2563eb" }}
            >
              <ShieldCheck
                aria-hidden="true"
                size={30}
                strokeWidth={2.3}
              />

              <span>VERIFYING...</span>
            </div>

            <p className="verification-note">
              Verifying this certificate through the{" "}
              <strong>NOERION</strong> system...
            </p>
          </article>
        </section>

        <p className="verification-footer">
          All verified data is securely handled in compliance with global data
          protection standards.
        </p>
      </main>
    );
  }

  /*
   * Certificate does not exist.
   */
  if (!certificate) {
    return (
      <main className="verification-page">
        <div className="verification-grid" aria-hidden="true" />

        <div
          className="verification-circuit circuit-left"
          aria-hidden="true"
        />

        <div
          className="verification-circuit circuit-right"
          aria-hidden="true"
        />

        <section
          className="verification-content"
          aria-labelledby="verification-title"
        >
          <header className="verification-heading">
            <p className="verification-brand">NOERION</p>

            <h1 id="verification-title">
              Certificate Verification
            </h1>
          </header>

          <article className="verification-card">
            <div
              className="verification-status"
              style={{ color: "#dc2626" }}
            >
              <ShieldCheck
                aria-hidden="true"
                size={30}
                strokeWidth={2.3}
              />

              <span>NOT VERIFIED</span>
            </div>

            <p className="verification-note">
              {errorMessage ||
                "This certificate could not be found in the NOERION verification records."}
            </p>
          </article>

          <button
            className="verify-another-button"
            type="button"
            onClick={() =>
              navigate("/certificate-verification")
            }
          >
            Verify Another Certificate
          </button>
        </section>

        <p className="verification-footer">
          All verified data is securely handled in compliance with global data
          protection standards.
        </p>
      </main>
    );
  }

  /*
   * VERIFICATION CHECKS
   */

  // QR token vs database token
  const tokenValid =
    Boolean(token) &&
    token === certificate.token;

  // Generated certificate hash vs database hash
  const databaseHashValid =
    Boolean(generatedHash) &&
    generatedHash === certificate.hash;

  // QR hash vs database hash
  const qrHashValid =
    Boolean(receivedHash) &&
    receivedHash === certificate.hash;

  // QR signature vs database signature
  const signatureMatchesDatabase =
    Boolean(signature) &&
    signature === certificate.signature;

  // Cryptographically verify database hash using QR signature
  const signatureValid =
    Boolean(certificate.hash) &&
    Boolean(signature) &&
    verifyHash(certificate.hash, signature);

  // Certificate must also have Valid status
  const certificateStatusValid =
    certificate.status === "Valid";

  const isVerified =
    tokenValid &&
    databaseHashValid &&
    qrHashValid &&
    signatureMatchesDatabase &&
    signatureValid &&
    certificateStatusValid;

  /*
   * Debug information.
   */
  console.log("========================================");
  console.log("NOERION CERTIFICATE VERIFICATION");
  console.log("Certificate:", certificate.certificateId);
  console.log("----------------------------------------");
  console.log("Token Valid:", tokenValid);
  console.log("Generated Hash:", generatedHash);
  console.log("Database Hash:", certificate.hash);
  console.log("QR Hash:", receivedHash);
  console.log("Generated Hash Valid:", databaseHashValid);
  console.log("QR Hash Valid:", qrHashValid);
  console.log(
    "Signature Matches Database:",
    signatureMatchesDatabase
  );
  console.log("ECDSA Valid:", signatureValid);
  console.log(
    "Certificate Status:",
    certificate.status
  );
  console.log("----------------------------------------");
  console.log(
    "Overall Verification:",
    isVerified
      ? "VERIFIED"
      : "INVALID"
  );
  console.log("========================================");

  return (
    <main className="verification-page">
      <div className="verification-grid" aria-hidden="true" />

      <div
        className="verification-circuit circuit-left"
        aria-hidden="true"
      />

      <div
        className="verification-circuit circuit-right"
        aria-hidden="true"
      />

      <section
        className="verification-content"
        aria-labelledby="verification-title"
      >
        <header className="verification-heading">
          <p className="verification-brand">
            NOERION
          </p>

          <h1 id="verification-title">
            Certificate Verification
          </h1>
        </header>

        <article className="verification-card">
          <div
            className="verification-status"
            style={{
              color: isVerified
                ? "#16a34a"
                : "#dc2626",
            }}
          >
            {isVerified ? (
              <BadgeCheck
                aria-hidden="true"
                size={30}
                strokeWidth={2.3}
              />
            ) : (
              <ShieldCheck
                aria-hidden="true"
                size={30}
                strokeWidth={2.3}
              />
            )}

            <span>
              {isVerified
                ? "VERIFIED"
                : "INVALID"}
            </span>
          </div>

          <dl className="certificate-details">
            <div>
              <dt>Name:</dt>
              <dd>
                {certificate.traineeName}
              </dd>
            </div>

            <div>
              <dt>Student ID:</dt>
              <dd>
                {certificate.studentId}
              </dd>
            </div>

            <div>
              <dt>Qualification / Skill:</dt>
              <dd>
                {certificate.qualification}:{" "}
                {certificate.skill}
              </dd>
            </div>

            <div>
              <dt>Date Issued:</dt>
              <dd>
                {formatIssuedDate(
                  certificate.issuedOn
                )}
              </dd>
            </div>

            <div>
              <dt>Result:</dt>
              <dd>
                {certificate.result}
              </dd>
            </div>

            <div>
              <dt>Certificate Number:</dt>
              <dd>
                #{certificate.certificateId}
              </dd>
            </div>
          </dl>

          <div className="verification-divider" />

          <p className="verification-note">
            <ShieldCheck
              aria-hidden="true"
              size={17}
            />

            {isVerified ? (
              <>
                This certificate has been successfully
                verified through the{" "}
                <strong>NOERION</strong> system.
              </>
            ) : (
              <>
                The verification failed because one or
                more security checks do not match the
                NOERION records.
              </>
            )}
          </p>

          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              fontSize: "12px",
              borderRadius: "8px",
              background: isVerified
                ? "#f0fdf4"
                : "#fef2f2",
              color: "#111827",
            }}
          >
            <div>
              Token:{" "}
              <strong>
                {tokenValid
                  ? "VALID"
                  : "INVALID"}
              </strong>
            </div>

            <div>
              SHA-256 (QR):{" "}
              <strong>
                {qrHashValid
                  ? "VALID"
                  : "INVALID"}
              </strong>
            </div>

            <div>
              SHA-256 (Database):{" "}
              <strong>
                {databaseHashValid
                  ? "VALID"
                  : "INVALID"}
              </strong>
            </div>

            <div>
              ECDSA:{" "}
              <strong>
                {signatureValid
                  ? "VALID"
                  : "INVALID"}
              </strong>
            </div>

            <div>
              Signature Match:{" "}
              <strong>
                {signatureMatchesDatabase
                  ? "VALID"
                  : "INVALID"}
              </strong>
            </div>

            <div>
              Certificate Status:{" "}
              <strong>
                {certificateStatusValid
                  ? "VALID"
                  : certificate.status ||
                    "INVALID"}
              </strong>
            </div>
          </div>
        </article>

        <button
          className="verify-another-button"
          type="button"
          onClick={() =>
            navigate("/certificate-verification")
          }
        >
          Verify Another Certificate
        </button>
      </section>

      <p className="verification-footer">
        All verified data is securely handled in compliance
        with global data protection standards.
      </p>
    </main>
  );
}