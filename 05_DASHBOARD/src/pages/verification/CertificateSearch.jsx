import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Html5QrcodeScanner } from "html5-qrcode";
import "./certificateVerification.css";

export default function CertificateSearch() {
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const [certificateNumber, setCertificateNumber] = useState("");

  useEffect(() => {
  const scanner = new Html5QrcodeScanner(
    "qr-reader",
    {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
    },
    false
  );

  scanner.render(
    (decodedText) => {
      console.log("QR detected:", decodedText);

      scanner.clear().catch(() => {});

      try {
        const url = new URL(decodedText);
        navigate(url.pathname + url.search);
      } catch {
        navigate(`/verify/${encodeURIComponent(decodedText.trim())}`);
      }
    },
    () => {
      // ignore scan errors
    }
  );

  return () => {
    scanner.clear().catch(() => {});
  };
}, [navigate]);

  const verifyCertificate = (value = certificateNumber) => {
    const id = value.trim();
    if (id) navigate(`/verify/${encodeURIComponent(id)}`);
  };

  return (
    <main className="verification-page search-page">
      <div className="verification-grid" aria-hidden="true" />
      <div className="verification-circuit circuit-left" aria-hidden="true" />
      <div className="verification-circuit circuit-right" aria-hidden="true" />

      <section className="verification-content">
        <header className="verification-heading">
          <p className="verification-brand">NOERION</p>
          <h1>Certificate Verification</h1>
        </header>

        <article className="verification-card search-card">
          <p className="scan-label">
            <Camera size={19} /> Scan QR Code
          </p>

          <div className="qr-scan-frame">
            <div
              id="qr-reader"
              style={{ width: "100%", minHeight: "260px" }}
            />
          </div>

          <div className="or-divider">
            <span>OR</span>
          </div>

          <label className="certificate-label" htmlFor="certificate-number">
            Certificate Number
          </label>

          <input
            id="certificate-number"
            className="certificate-input"
            value={certificateNumber}
            onChange={(e) => setCertificateNumber(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && verifyCertificate()}
            placeholder="Enter certificate number"
          />

          <div className="verification-divider" />

          <button
            type="button"
            className="verify-another-button verify-submit"
            onClick={() => verifyCertificate()}
            disabled={!certificateNumber.trim()}
          >
            Verify
          </button>
        </article>
      </section>

      <p className="verification-footer">
        All verified data is securely handled in compliance with global data
        protection standards.
      </p>
    </main>
  );
}