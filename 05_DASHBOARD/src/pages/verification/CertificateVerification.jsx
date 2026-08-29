import { useEffect, useState } from "react";
import {
  BadgeCheck,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { supabase } from "../../supabaseClient.js";
import "./certificateVerification.css";

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

export default function CertificateVerification() {
  const navigate = useNavigate();
  const { certificateId } = useParams();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token") || "";
  const receivedHash = searchParams.get("hash") || "";
  const signature = searchParams.get("sig") || "";

  const [certificate, setCertificate] = useState(null);
  const [checks, setChecks] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function verifyCertificate() {
      try {
        setLoading(true);
        setErrorMessage("");
        setCertificate(null);
        setChecks(null);
        setIsVerified(false);

        if (!certificateId) {
          if (!cancelled) {
            setErrorMessage(
              "Certificate number is required."
            );
            setLoading(false);
          }

          return;
        }

        console.log("========================================");
        console.log(
          "NOERION SERVER-SIDE CERTIFICATE VERIFICATION"
        );
        console.log(
          "Certificate ID:",
          certificateId
        );
        console.log("========================================");

        const { data, error } =
          await supabase.functions.invoke(
            "verify-certificate",
            {
              body: {
                certificateId,
                token,
                hash: receivedHash,
                signature,
              },
            }
          );

        if (cancelled) {
          return;
        }

        if (error) {
          console.error(
            "Server-side verification request failed:",
            error
          );

          setErrorMessage(
            "Unable to access the NOERION certificate verification service."
          );

          setLoading(false);
          return;
        }

        console.log("========================================");
        console.log("NOERION SERVER RESPONSE");
        console.log("Response:", data);
        console.log("CERTIFICATE DATA:", data?.certificate);
        console.log("TRAINEE NAME FROM SERVER:", data?.certificate?.traineeName);
        console.log("========================================");

        if (!data) {
          setErrorMessage(
            "The verification service returned no response."
          );

          setLoading(false);
          return;
        }

        setCertificate(data.certificate || null);
        setChecks(data.checks || null);
        setIsVerified(Boolean(data.verified));

        if (!data.verified && data.error) {
          setErrorMessage(data.error);
        }

        console.log(
          "Token Valid:",
          data.checks?.tokenValid
        );

        console.log(
          "SHA-256 Database Valid:",
          data.checks?.databaseHashValid
        );

        console.log(
          "SHA-256 QR Valid:",
          data.checks?.qrHashValid
        );

        console.log(
          "Signature Match:",
          data.checks?.signatureMatchesDatabase
        );

        console.log(
          "ECDSA Valid:",
          data.checks?.signatureValid
        );

        console.log(
          "Certificate Status:",
          data.checks?.certificateStatusValid
        );

        console.log(
          "Overall Verification:",
          data.verified
            ? "VERIFIED"
            : "INVALID"
        );

        console.log("========================================");

        setLoading(false);
      } catch (error) {
        console.error(
          "Server-side certificate verification failed:",
          error
        );

        if (!cancelled) {
          setErrorMessage(
            "Unable to verify this certificate through the NOERION system."
          );

          setLoading(false);
        }
      }
    }

    verifyCertificate();

    return () => {
      cancelled = true;
    };
  }, [
    certificateId,
    token,
    receivedHash,
    signature,
  ]);

  if (loading) {
    return (
      <main className="verification-page">
        <div
          className="verification-grid"
          aria-hidden="true"
        />

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
              <strong>NOERION</strong> server...
            </p>
          </article>
        </section>

        <p className="verification-footer">
          All verified data is securely handled in
          compliance with global data protection standards.
        </p>
      </main>
    );
  }

  if (!certificate) {
    return (
      <main className="verification-page">
        <div
          className="verification-grid"
          aria-hidden="true"
        />

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
              style={{ color: "#dc2626" }}
            >
              <AlertCircle
                aria-hidden="true"
                size={30}
                strokeWidth={2.3}
              />

              <span>NOT VERIFIED</span>
            </div>

            <p className="verification-note">
              {errorMessage ||
                "This certificate could not be verified through the NOERION system."}
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
          All verified data is securely handled in
          compliance with global data protection standards.
        </p>
      </main>
    );
  }

  return (
    <main className="verification-page">
      <div
        className="verification-grid"
        aria-hidden="true"
      />

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
                : "NOT VERIFIED"}
            </span>
          </div>

          <dl className="certificate-details">
            <div>
              <dt>Name:</dt>

              <dd>
                {certificate.traineeName || "—"}
              </dd>
            </div>

            <div>
              <dt>Qualification:</dt>

              <dd>
                {certificate.qualification || "—"}
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
                {certificate.result || "—"}
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

          {checks && (
            <div
              style={{
                marginTop: "16px",
                padding: "14px",
                fontSize: "12px",
                lineHeight: "1.8",
                borderRadius: "8px",
                background: isVerified
                  ? "#f0fdf4"
                  : "#fef2f2",
                color: "#111827",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  marginBottom: "6px",
                }}
              >
                Security Verification
              </div>

              <div>
                ✓ Verification Token:{" "}
                <strong>
                  {checks.tokenValid
                    ? "VALID"
                    : "INVALID"}
                </strong>
              </div>

              <div>
                ✓ Certificate Integrity:{" "}
                <strong>
                  {checks.databaseHashValid
                    ? "VALID"
                    : "INVALID"}
                </strong>
              </div>

              <div>
                ✓ QR Code Integrity:{" "}
                <strong>
                  {checks.qrHashValid
                    ? "VALID"
                    : "INVALID"}
                </strong>
              </div>

              <div>
                ✓ Digital Signature:{" "}
                <strong>
                  {checks.signatureValid
                    ? "VALID"
                    : "INVALID"}
                </strong>
              </div>

              <div>
                ✓ Signature Match:{" "}
                <strong>
                  {checks.signatureMatchesDatabase
                    ? "VALID"
                    : "INVALID"}
                </strong>
              </div>

              <div>
                ✓ Certificate Status:{" "}
                <strong>
                  {checks.certificateStatusValid
                    ? "VALID"
                    : "INVALID"}
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
        All verified data is securely handled in
        compliance with global data protection standards.
      </p>
    </main>
  );
}