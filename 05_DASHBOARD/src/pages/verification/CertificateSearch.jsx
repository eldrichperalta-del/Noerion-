import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./certificateVerification.css";

export default function CertificateSearch() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [certificateNumber, setCertificateNumber] = useState("");

  useEffect(() => {
    let stream;
    let frame;
    let scanned = false;
    const startCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) return;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        if (!("BarcodeDetector" in window)) return;
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        const detect = async () => {
          if (scanned) return;
          if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            const codes = await detector.detect(video);
            if (codes[0]?.rawValue) {
              scanned = true;
              const value = codes[0].rawValue;
              const match = value.match(/\/verify\/([^/?#]+)/);
              navigate(`/verify/${encodeURIComponent(match ? decodeURIComponent(match[1]) : value)}`);
              return;
            }
          }
          frame = requestAnimationFrame(detect);
        };
        frame = requestAnimationFrame(detect);
      } catch {
        // The empty camera frame remains available while the user enters a certificate number.
      }
    };
    startCamera();
    return () => {
      if (frame) cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [navigate]);

  const verifyCertificate = (value = certificateNumber) => {
    const id = value.trim();
    if (id) navigate(`/verify/${encodeURIComponent(id)}`);
  };
  return <main className="verification-page search-page">
    <div className="verification-grid" aria-hidden="true" /><div className="verification-circuit circuit-left" aria-hidden="true" /><div className="verification-circuit circuit-right" aria-hidden="true" />
    <section className="verification-content" aria-labelledby="search-title">
      <header className="verification-heading"><p className="verification-brand">NOERION</p><h1>Certificate Verification</h1></header>
      <article className="verification-card search-card">
        <p className="scan-label"><Camera size={19} aria-hidden="true" /> Scan QR Code</p>
        <div className="qr-scan-frame">
          <video className="qr-camera-preview" ref={videoRef} playsInline muted aria-label="Camera preview for QR code scanning" />
          <span className="scan-corner corner-top-left" aria-hidden="true" />
          <span className="scan-corner corner-top-right" aria-hidden="true" />
          <span className="scan-corner corner-bottom-left" aria-hidden="true" />
          <span className="scan-corner corner-bottom-right" aria-hidden="true" />
          <span className="scan-line" aria-hidden="true" />
        </div>
        <div className="or-divider"><span>OR</span></div>
        <label className="certificate-label" htmlFor="certificate-number">Certificate Number</label>
        <input id="certificate-number" className="certificate-input" value={certificateNumber} onChange={(event) => setCertificateNumber(event.target.value)} onKeyDown={(event) => event.key === "Enter" && verifyCertificate()} placeholder="Enter certificate number" autoComplete="off" />
        <div className="verification-divider" />
        <button type="button" className="verify-another-button verify-submit" onClick={() => verifyCertificate()} disabled={!certificateNumber.trim()}>Verify</button>
      </article>
    </section>
    <p className="verification-footer">All verified data is securely handled in compliance with global data protection standards.</p>
  </main>;
}
