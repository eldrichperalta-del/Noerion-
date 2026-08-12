import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { hashCertificate } from "../../utils/hashCertificate";
import { certificateStore } from "../../data/certificates";
import "./certificateVerification.css";

export default function CertificateVerification() {
  const navigate = useNavigate();
  const { certificateId } = useParams();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");
  const receivedHash = searchParams.get("hash");

  const [generatedHash, setGeneratedHash] = useState("");
  const [hashLoading, setHashLoading] = useState(true);

  const certificate = useMemo(() => {
    const id = decodeURIComponent(certificateId || "")
      .replace(/^#/, "")
      .trim();

    return certificateStore.find(
      (item) => item.certificateId.toLowerCase() === id.toLowerCase()
    );
  }, [certificateId]);

  useEffect(() => {
    if (!certificate) {
      setHashLoading(false);
      return;
    }

    let cancelled = false;

    async function verifyHash() {
      try {
        setHashLoading(true);

        const hash = await hashCertificate({
          certificateId: certificate.certificateId,
          traineeName: certificate.traineeName,
          studentId: certificate.studentId,
          qualification: certificate.qualification,
          skill: certificate.skill,
          issuedOn: certificate.issuedOn,
          result: certificate.result,
        });

        if (!cancelled) {
          setGeneratedHash(hash);
          setHashLoading(false);

          console.log(
            "========== NOERION CERTIFICATE VERIFICATION =========="
          );
          console.log("Certificate:", certificate.certificateId);

          console.log("--------------------------------");
          console.log("Expected Token:", certificate.token);
          console.log("Received Token:", token);
          console.log(
            "Token Valid:",
            certificate.token === token
          );

          console.log("--------------------------------");
          console.log("Expected Hash:", hash);
          console.log("Received Hash:", receivedHash);
          console.log(
            "Hash Valid:",
            hash === receivedHash
          );

          console.log("================================");
        }
      } catch (error) {
        console.error("Hash verification failed:", error);
        setHashLoading(false);
      }
    }

    verifyHash();

    return () => {
      cancelled = true;
    };
  }, [certificate, token, receivedHash]);

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
              This certificate could not be found in the
              NOERION verification records.
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
          All verified data is securely handled in compliance
          with global data protection standards.
        </p>
      </main>
    );
  }

  /*
   * IMPORTANT:
   * The UI waits until the SHA-256 hash has actually been
   * generated before deciding whether the certificate is valid.
   */
  const tokenValid = certificate.token === token;

  const hashValid =
    !hashLoading &&
    generatedHash !== "" &&
    generatedHash === receivedHash;

  const isVerified =
    certificate.valid === true &&
    tokenValid &&
    hashValid;

  console.log("UI VERIFICATION RESULT:", {
    certificateValid: certificate.valid,
    tokenValid,
    hashValid,
    isVerified,
  });

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
              {hashLoading
                ? "VERIFYING..."
                : isVerified
                ? "VERIFIED"
                : "INVALID"}
            </span>
          </div>

          <dl className="certificate-details">
            <div>
              <dt>Name:</dt>
              <dd>{certificate.traineeName}</dd>
            </div>

            <div>
              <dt>Student ID:</dt>
              <dd>{certificate.studentId}</dd>
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
              <dd>{certificate.issuedOn}</dd>
            </div>

            <div>
              <dt>Result:</dt>
              <dd>{certificate.result}</dd>
            </div>

            <div>
              <dt>Certificate Number:</dt>
              <dd>#{certificate.certificateId}</dd>
            </div>
          </dl>

          <div className="verification-divider" />

          <p className="verification-note">
            <ShieldCheck
              aria-hidden="true"
              size={17}
            />

            {hashLoading ? (
              <>
                Verifying this certificate through the{" "}
                <strong>NOERION</strong> system...
              </>
            ) : isVerified ? (
              <>
                This certificate has been successfully
                verified through the{" "}
                <strong>NOERION</strong> system.
              </>
            ) : (
              <>
                The verification failed because the
                certificate token or SHA-256 hash does not
                match our records.
              </>
            )}
          </p>

          {!hashLoading && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px",
                fontSize: "12px",
                borderRadius: "8px",
                background: isVerified
                  ? "#f0fdf4"
                  : "#fef2f2",
              }}
            >
              <div>
                Token:{" "}
                <strong>
                  {tokenValid ? "VALID" : "INVALID"}
                </strong>
              </div>

              <div>
                SHA-256:{" "}
                <strong>
                  {hashValid ? "VALID" : "INVALID"}
                </strong>
              </div>
            </div>
          )}
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