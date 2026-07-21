import { useNavigate } from "react-router-dom";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import "./certificateVerification.css";

const certificate = {
  traineeName: "J*** D***",
  studentId: "20****123",
  qualification: "AI-Driven TVET Certificate",
  issuedOn: "October 26, 2023",
  result: "Competent",
};

export default function CertificateVerification() {
  const navigate = useNavigate();

  return (
    <main className="verification-page">
      <div className="verification-grid" aria-hidden="true" />
      <div className="verification-circuit circuit-left" aria-hidden="true" />
      <div className="verification-circuit circuit-right" aria-hidden="true" />

      <section className="verification-content" aria-labelledby="verification-title">
        <header className="verification-heading">
          <p className="verification-brand">NOERION</p>
          <h1 id="verification-title">Certificate Verification</h1>
        </header>

        <article className="verification-card">
          <div className="verification-status">
            <BadgeCheck aria-hidden="true" size={30} strokeWidth={2.3} />
            <span>VERIFIED</span>
          </div>

          <dl className="certificate-details">
            <div><dt>Name:</dt><dd>{certificate.traineeName}</dd></div>
            <div><dt>Student ID:</dt><dd>{certificate.studentId}</dd></div>
            <div><dt>Qualification / Skill:</dt><dd>{certificate.qualification}</dd></div>
            <div><dt>Date Issued:</dt><dd>{certificate.issuedOn}</dd></div>
            <div><dt>Result:</dt><dd>{certificate.result}</dd></div>
          </dl>

          <div className="verification-divider" />
          <p className="verification-note"><ShieldCheck aria-hidden="true" size={17} /> This certificate is verified through the <strong>NOERION</strong> system.</p>
        </article>

        <button className="verify-another-button" type="button" onClick={() => navigate("/certificate-verification")}>
          Verify Another Certificate
        </button>
      </section>

      <p className="verification-footer">All verified data is securely handled in compliance with global data protection standards.</p>
    </main>
  );
}
