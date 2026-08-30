import { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Html5QrcodeScanner } from "html5-qrcode";
import "./certificateVerification.css";

export default function CertificateSearch() {
  const navigate = useNavigate();
  const [certificateNumber, setCertificateNumber] = useState("");


  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        rememberLastUsedCamera: true,
        aspectRatio: 1.5,
      },
      false
    );

    scanner.render(
      (decodedText) => {
        console.log("QR detected:", decodedText);

        scanner.clear().catch(() => { });

        try {
          const url = new URL(decodedText);
          navigate(url.pathname + url.search);
        } catch {
          navigate(`/verify/${encodeURIComponent(decodedText.trim())}`);
        }
      },
      () => {
        // Ignore scan errors
      }
    );

    /*
     * Html5QrcodeScanner creates the camera permission
     * button dynamically. Wait for it to appear, then
     * trigger it automatically.
     */
    const waitForPermissionButton = setInterval(() => {
      const permissionButton = document.querySelector(
        "#html5-qrcode-button-camera-permission"
      );

      if (permissionButton) {
        clearInterval(waitForPermissionButton);

        permissionButton.click();
      }
    }, 100);

    return () => {
      clearInterval(waitForPermissionButton);

      scanner.clear().catch(() => { });
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
            <div className="qr-video-clip">
              <div id="qr-reader" />
            </div>

            <div className="custom-scanner-overlay" aria-hidden="true">
              <span className="scanner-corner scanner-corner-tl" />
              <span className="scanner-corner scanner-corner-tr" />
              <span className="scanner-corner scanner-corner-bl" />
              <span className="scanner-corner scanner-corner-br" />

              <span className="scanner-line" />
            </div>
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