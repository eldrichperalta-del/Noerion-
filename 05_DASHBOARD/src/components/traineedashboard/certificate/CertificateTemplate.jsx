import { QRCodeSVG } from "qrcode.react";

import tesdaLogo from "../../../assets/tesda1.png";
import certificateBorder from "../../../assets/certificate-border-frame.png";

export default function CertificateTemplate({
  traineeName = "",
  qualification = "",
  result = "",
  certificateId = "",
  dateIssued = "",

}) {
  const normalizedCertificateId = String(
    certificateId || ""
  ).replace(/^#/, "");

  const verificationUrl = normalizedCertificateId
    ? `${globalThis.location.origin}/verify/${encodeURIComponent(
        normalizedCertificateId
      )}`
    : "";

  return (
    <div className="flex w-full justify-center py-4">
      <section
        className="
          certificate-print-sheet
          relative
          w-full
          max-w-[1100px]
          aspect-[599/399]
          overflow-hidden
          bg-white
          p-[10px]
          text-[#111827]
          shadow-[0_12px_24px_rgba(15,23,42,0.32)]
        "
      >
        {/* Certificate Border */}
        <div className="certificate-frame relative h-full w-full bg-white p-[5px]">
          <img
            src={certificateBorder}
            alt=""
            className="
              certificate-border-image
              pointer-events-none
              absolute
              inset-0
              h-full
              w-full
              object-fill
            "
          />

          {/* Certificate Content */}
          <div
            className="
              relative
              z-10
              flex
              h-full
              flex-col
              items-center
              px-14
              pb-8
              pt-7
              text-center
            "
          >
            {/* TESDA LOGO */}
            <img
              src={tesdaLogo}
              alt="TESDA"
              className="
                certificate-logo
                h-16
                w-16
                shrink-0
                object-contain
              "
            />

            <p
              className="
                certificate-logo-text
                mt-1
                text-[15px]
                font-extrabold
                leading-none
                text-[#102a6c]
              "
            >
              TESDA
            </p>

            {/* NATIONAL CERTIFICATE */}
            <p
              className="
                certificate-subtitle
                mt-2
                text-[19px]
                font-semibold
                uppercase
                leading-tight
              "
            >
              National Certificate
            </p>

            {/* TITLE */}
            <h2
              className="
                certificate-title
                mt-1
                text-[34px]
                font-extrabold
                uppercase
                leading-tight
                text-[#071d5b]
              "
            >
              CERTIFICATE OF COMPETENCY
            </h2>

            {/* MAIN CERTIFICATE CONTENT */}
            <div
              className="
                certificate-body
                mt-4
                w-full
                max-w-[760px]
                text-[19px]
                font-medium
                leading-[1.55]
              "
            >
              {/* FIRST SENTENCE */}
              <p>
                This is to certify that{" "}
                <span className="font-extrabold">
                  {traineeName || "Trainee Name"}
                </span>{" "}
                has successfully demonstrated competency in
              </p>

              {/* QUALIFICATION */}
              <p
                className="
                  mt-3
                  text-[23px]
                  font-extrabold
                  leading-tight
                  text-[#071d5b]
                "
              >
                {qualification || "Qualification"}
              </p>

              {/* ASSESSMENT STATEMENT */}
              <p className="mt-3">
                Having undergone the required assessment, the individual has
                successfully demonstrated the competencies prescribed for the
                qualification stated above and has been assessed as{" "}
                <span className="font-extrabold">
                  {result || "Passed"}
                </span>
                .
              </p>

              {/* ISSUANCE STATEMENT + CERTIFICATE NUMBER */}
              <p className="mt-3">
                This Certificate of Competency is issued in recognition of the
                successful demonstration of the required competencies and is
                dated{" "}
                <span className="font-extrabold">
                  {dateIssued || "—"}
                </span>
                , under Certificate Number{" "}
                <span className="font-extrabold">
                  {normalizedCertificateId || "—"}
                </span>
                .
              </p>
            </div>

                        {/* FOOTER */}
            <div
              className="
                certificate-footer-grid
                mt-auto
                grid
                w-full
                grid-cols-[1fr_1fr_82px]
                items-end
                gap-7
                px-8
              "
            >
              {/* ASSESSOR */}
              <div className="text-center">
                <div className="h-8" />

                <div
                  className="
                    certificate-signature-label
                    border-t-2
                    border-[#111827]
                    pt-1
                    text-[13px]
                    font-extrabold
                  "
                >
                  Assessor Name &amp; Signature
                </div>
              </div>

              {/* TESDA AUTHORITY */}
              <div className="text-center">
                <div className="h-8" />

                <div
                  className="
                    certificate-signature-label
                    border-t-2
                    border-[#111827]
                    pt-1
                    text-[13px]
                    font-extrabold
                  "
                >
                  TESDA Authority Signature
                </div>
              </div>

              {/* QR CODE */}
              <div className="flex flex-col items-center">
                <div
                  className="
                    certificate-qr
                    flex
                    h-[76px]
                    w-[76px]
                    items-center
                    justify-center
                    overflow-hidden
                    border-2
                    border-[#111827]
                    bg-white
                    p-[4px]
                  "
                >
                  {verificationUrl ? (
                    <QRCodeSVG
                      value={verificationUrl}
                      size={90}
                      level="M"
                      includeMargin={false}
                      className="block h-[90px] w-[90px]"
                    />
                  ) : (
                    <div
                      className="
                        flex
                        h-full
                        w-full
                        items-center
                        justify-center
                        text-center
                        text-[8px]
                        leading-tight
                      "
                    >
                      QR unavailable
                    </div>
                  )}
                </div>

                <p
                  className="
                    certificate-qr-label
                    mt-1
                    text-[10px]
                    font-extrabold
                    leading-tight
                  "
                >
                  Scan to Verify
                </p>
              </div>
            </div>

            {/* DIGITAL VERIFICATION MESSAGE */}
            <p className="certificate-verification">
              This certificate is digitally verified through the NOERION system.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}