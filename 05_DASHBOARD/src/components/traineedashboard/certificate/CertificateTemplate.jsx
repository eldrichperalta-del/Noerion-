import { useEffect, useMemo, useState } from "react";
import { hashCertificate } from "../../../utils/hashCertificate";
import { QRCodeSVG } from "qrcode.react";

import tesdaLogo from "../../../assets/tesda1.png";
import certificateBorder from "../../../assets/certificate-border-frame.png";

export default function CertificateTemplate({
  traineeName = "Juan Dela Cruz",
  traineeId = "#NOE-TRAINEE-001",
  qualification = "TESDA NC III Electronics",
  assessment = "Advanced Robotics Assembly",
  result = "Competent",
  certificateId = "#NOE-NNC-001",
  dateIssued = "April 14, 2025",
  trainingCenter = "NOERION Training Center",
  assessorName = "Assessor Name",
  authorityName = "TESDA Authority",
}) {
  console.log("CertificateTemplate rendered");

  const skillName = assessment.replace(" Certificate", "");

  // Keep the certificate data consistent with the verification page.
  const certificate = useMemo(
    () => ({
      certificateId: certificateId.replace(/^#/, ""),
      traineeName,
      studentId: traineeId,
      qualification,
      skill: skillName,
      issuedOn: dateIssued,
      result,
    }),
    [
      certificateId,
      traineeName,
      traineeId,
      qualification,
      skillName,
      dateIssued,
      result,
    ]
  );

  const [certificateHash, setCertificateHash] = useState("");

  // Generate SHA-256 hash for this certificate.
  useEffect(() => {
    let cancelled = false;

    async function generateHash() {
      try {
        const hash = await hashCertificate(certificate);

        if (!cancelled) {
          setCertificateHash(hash);
          console.log("================================");
          console.log("NOERION CERTIFICATE");
          console.log("Certificate ID:", certificate.certificateId);
          console.log("Generated Hash:", hash);
          console.log("================================");
        }
      } catch (error) {
        console.error("Failed to generate certificate hash:", error);
      }
    }

    generateHash();

    return () => {
      cancelled = true;
    };
  }, [certificate]);

  // Temporary token for the prototype.
  // This will later be replaced by a server-generated secure token.
  const secureToken = btoa(certificate.certificateId);

  // QR code points to the verification page.
  const verificationUrl = certificateHash
    ? `${window.location.origin}/verify/${encodeURIComponent(
        certificate.certificateId
      )}?token=${encodeURIComponent(secureToken)}&hash=${encodeURIComponent(
        certificateHash
      )}`
    : "";

  return (
    <div className="flex justify-center py-4">
      <section className="certificate-print-sheet relative w-full max-w-[880px] aspect-[599/399] bg-white p-[10px] text-[#111827] shadow-[0_12px_24px_rgba(15,23,42,0.32)]">
        <div className="certificate-frame relative h-full bg-white p-[5px]">
          <img
            src={certificateBorder}
            alt=""
            className="certificate-border-image pointer-events-none absolute inset-0 h-full w-full object-fill"
          />

          <div className="relative z-10 flex h-full flex-col items-center px-12 pb-10 pt-8 text-center">
            <img
              src={tesdaLogo}
              alt="TESDA"
              className="certificate-logo h-14 w-14 object-contain"
            />

            <p className="certificate-logo-text mt-1 text-[14px] font-extrabold leading-none text-[#102a6c]">
              TESDA
            </p>

            <p className="certificate-subtitle text-[18px] font-semibold uppercase leading-tight">
              National Certificate
            </p>

            <h2 className="certificate-title mt-1 text-[32px] font-extrabold uppercase leading-tight text-[#071d5b]">
              CERTIFICATE OF COMPETENCY
            </h2>

            <div className="certificate-body mt-2 max-w-[680px] text-[15px] font-medium leading-6">
              <p>
                This is to certify that the individual has demonstrated
                competency in
              </p>

              <p>
                This is to certify that{" "}
                <span className="font-extrabold">[{traineeName}]</span>, with
                Student ID{" "}
                <span className="font-extrabold">{traineeId}</span>,
              </p>

              <p>has demonstrated competency in</p>

              <p>
                [Qualification / Skill:{" "}
                <span className="font-extrabold">
                  {qualification}: {skillName}
                </span>
                ].
              </p>

              <p>
                Assessment Result:{" "}
                <span className="font-extrabold">{result}</span>
              </p>

              <p>
                Date Issued:{" "}
                <span className="font-extrabold">{dateIssued}</span>
              </p>

              <p>
                Certificate Number:{" "}
                <span className="font-medium">{certificateId}</span>
              </p>

              <p>
                Name of Training Center:{" "}
                <span className="font-extrabold">[{trainingCenter}]</span>
              </p>
            </div>

            <div className="certificate-footer-grid mt-auto grid w-full grid-cols-[1fr_1fr_76px] items-end gap-5 px-7">
              <div className="text-center">
                <p className="certificate-signature-script font-['Brush_Script_MT',cursive] text-2xl leading-none">
                  Signature
                </p>

                <div className="certificate-signature-label mt-1 border-t-2 border-[#111827] pt-1 text-[11px] font-extrabold">
                  {assessorName} &amp; Signature
                </div>
              </div>

              <div className="text-center">
                <p className="certificate-signature-script font-['Brush_Script_MT',cursive] text-2xl leading-none">
                  Signature
                </p>

                <div className="certificate-signature-label mt-1 border-t-2 border-[#111827] pt-1 text-[11px] font-extrabold">
                  {authorityName} Signature
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="certificate-qr border-2 border-[#111827] bg-white p-[3px]">
                  {certificateHash ? (
                    <QRCodeSVG
                      value={verificationUrl}
                      size={58}
                      level="M"
                      includeMargin={false}
                    />
                  ) : (
                    <div
                      style={{
                        width: "58px",
                        height: "58px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "8px",
                        textAlign: "center",
                      }}
                    >
                      Generating...
                    </div>
                  )}
                </div>

                <p className="certificate-qr-label mt-1 text-[10px] font-extrabold leading-tight">
                  Scan to Verify
                  <br />
                  Certificates
                </p>
              </div>
            </div>

            <p className="certificate-verification mt-2 text-[10px] font-medium">
              This certificate is digitally verified through the NOERION
              system.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}