
import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import "./certificateVerification.css";

export default function CertificateSearch() {
  const hasNavigatedRef = useRef(false);
  const navigate = useNavigate();

  const [certificateNumber, setCertificateNumber] = useState("");
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    let active = true;
    let scanner = null;

    hasNavigatedRef.current = false;
    setCameraError("");

    const startScanner = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(
            "Camera access requires HTTPS or localhost and a supported browser."
          );
        }

        scanner = new Html5Qrcode("qr-reader");

        const cameras = await Html5Qrcode.getCameras();

        if (!active) {
          await scanner.clear().catch(() => { });
          return;
        }

        if (!cameras?.length) {
          throw new Error(
            "No camera was found. Check your device and camera settings."
          );
        }

        const rearCamera = cameras.find((camera) =>
          /back|rear|environment|world/i.test(camera.label || "")
        );

        const selectedCamera = rearCamera || cameras[0];

        await scanner.start(
          selectedCamera.id,
          {
            fps: 10,
            aspectRatio: 1.5,
            disableFlip: false,
          },
          async (decodedText) => {
            if (!active || hasNavigatedRef.current) return;

            const scannedValue = decodedText.trim();
            if (!scannedValue) return;


            let destination;

            try {
              const url = new URL(scannedValue);

              const isNoerionDomain =
                url.protocol === "https:" &&
                url.hostname === "noerion.vercel.app";

              const pathParts = url.pathname.split("/").filter(Boolean);

              const isVerificationPath =
                (pathParts[0] === "verify-certificate" ||
                  pathParts[0] === "verify") &&
                Boolean(pathParts[1]);

              if (isNoerionDomain && isVerificationPath) {
                // Valid NOERION verification URL.
                destination = url.pathname + url.search + url.hash;
              } else {
                // Any other QR content is treated like a certificate number.
                destination = `/verify-certificate/${encodeURIComponent(
                  scannedValue
                )}`;
              }
            } catch {
              // Plain text or another non-URL QR value.
              destination = `/verify-certificate/${encodeURIComponent(
                scannedValue
              )}`;
            }

            hasNavigatedRef.current = true;

            try {
              if (scanner?.isScanning) {
                await scanner.stop();
              }
            } catch (error) {
              console.warn("Could not stop QR scanner:", error);
            }

            if (active) {
              navigate(destination);
            }
          },
          () => {
            // Ignore routine QR decoding failures.
          }
        );


      } catch (error) {
        const isPermissionDenied =
          error?.name === "NotAllowedError" ||
          error?.name === "PermissionDeniedError";

        // Permission denial is an expected user action, not an application error.

        if (!isPermissionDenied) {
          console.error("QR scanner initialization failed:", error);
        }


        let message = "Unable to start the QR scanner. Please try again.";

        if (isPermissionDenied) {
          message =
            "Camera access was denied. Allow camera access in your browser settings and reload the page, or enter your certificate number below.";
        } else if (error?.name === "NotFoundError") {
          message =
            "No camera was found. Connect or enable a camera and try again.";
        } else if (error?.name === "NotReadableError") {
          message =
            "The camera could not be opened. It may be in use by another application.";
        } else if (error?.name === "OverconstrainedError") {
          message =
            "The selected camera does not support the requested settings. Try another camera.";
        } else if (!window.isSecureContext) {
          message =
            "Camera access requires HTTPS or localhost. Open NOERION using a secure connection.";
        }

        if (active) {
          setCameraError(message);
        }
      }

    };

    startScanner();

    return () => {
      active = false;

      const currentScanner = scanner;

      if (currentScanner) {
        const cleanup = async () => {
          try {
            if (currentScanner.isScanning) {
              await currentScanner.stop();
            }
          } catch (error) {
            console.warn(
              "QR scanner stop during cleanup:",
              error
            );
          }

          try {
            await currentScanner.clear();
          } catch {
            // Scanner may already be cleared.
          }
        };

        cleanup();
      }
    };
  }, [navigate]);

  const verifyCertificate = (value = certificateNumber) => {
    const id = value.trim();

    if (id) {
      navigate(
        `/verify-certificate/${encodeURIComponent(id)}`
      );
    }
  };

  return (
    <main className="verification-page search-page">
      <div className="verification-grid" aria-hidden="true" />

      <div
        className="verification-circuit circuit-left"
        aria-hidden="true"
      />

      <div
        className="verification-circuit circuit-right"
        aria-hidden="true"
      />

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

            <div
              className="custom-scanner-overlay"
              aria-hidden="true"
            >
              <span className="scanner-corner scanner-corner-tl" />
              <span className="scanner-corner scanner-corner-tr" />
              <span className="scanner-corner scanner-corner-bl" />
              <span className="scanner-corner scanner-corner-br" />
              <span className="scanner-line" />
            </div>
          </div>

          {cameraError && (
            <p className="camera-error" role="alert">
              {cameraError}
            </p>
          )}

          <div className="or-divider">
            <span>OR</span>
          </div>

          <label
            className="certificate-label"
            htmlFor="certificate-number"
          >
            Certificate Number
          </label>

          <input
            id="certificate-number"
            className="certificate-input"
            value={certificateNumber}
            onChange={(e) =>
              setCertificateNumber(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                verifyCertificate();
              }
            }}
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
        All verified data is securely handled in compliance with
        global data protection standards.
      </p>
    </main>
  );
}
