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
  const skillName = assessment.replace(" Certificate", "");
  const qrCells =
    "1111111010011011111111000001011101010000011011101010111010111011011101010111010101011011101010111011011101010000011000101000001111111010101011111110000000011110000000001101001110010111010100110101010110001010011110101110110101110010100011011001010100010011010111010001011110010101001010101110101011100010011101000000011010101011001111111011100010111111";

  return (
    <div className="flex justify-center py-4">
      <section className="certificate-print-sheet relative w-full max-w-[880px] aspect-[599/399] bg-white p-[10px] text-[#111827] shadow-[0_12px_24px_rgba(15,23,42,0.32)]">
        <div className="certificate-frame relative h-full bg-white p-[5px]">
          <img
            src={certificateBorder}
            alt=""
            className="certificate-border-image pointer-events-none absolute inset-0 h-full w-full object-fill"
          />

          <div className="relative z-10 flex h-full flex-col items-center px-12 pb-8 pt-10 text-center">
            <img src={tesdaLogo} alt="TESDA" className="certificate-logo h-14 w-14 object-contain" />

            <p className="certificate-logo-text mt-1 text-[14px] font-extrabold leading-none text-[#102a6c]">
              TESDA
            </p>
            <p className="certificate-subtitle text-[18px] font-semibold uppercase leading-tight">
              National Certificate
            </p>
            <h2 className="certificate-title mt-1 text-[32px] font-extrabold uppercase leading-tight text-[#071d5b]">
              Certificate of Competency
            </h2>

            <div className="certificate-body mt-3 max-w-[680px] text-[17px] font-medium leading-7">
              <p>This is to certify that the individual has demonstrated competency in</p>
              <p>
                This is to certify that{" "}
                <span className="font-extrabold">[{traineeName}]</span>, with
                Student ID <span className="font-extrabold">{traineeId}</span>,
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
                Assessment Result: <span className="font-extrabold">{result}</span>
              </p>
              <p>
                Date Issued: <span className="font-extrabold">{dateIssued}</span>
              </p>
              <p>
                Certificate Number: <span className="font-medium">{certificateId}</span>
              </p>
              <p>
                Name of Training Center:{" "}
                <span className="font-extrabold">[{trainingCenter}]</span>
              </p>
            </div>

            <div className="certificate-footer-grid mt-auto grid w-full grid-cols-[1fr_1fr_92px] items-end gap-6 px-8">
              <div className="text-center">
                <p className="certificate-signature-script font-['Brush_Script_MT',cursive] text-2xl leading-none">
                  Signature
                </p>
                <div className="certificate-signature-label mt-1 border-t-2 border-[#111827] pt-1 text-[13px] font-extrabold">
                  {assessorName} &amp; Signature
                </div>
              </div>

              <div className="text-center">
                <p className="certificate-signature-script font-['Brush_Script_MT',cursive] text-2xl leading-none">
                  Signature
                </p>
                <div className="certificate-signature-label mt-1 border-t-2 border-[#111827] pt-1 text-[13px] font-extrabold">
                  {authorityName} Signature
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="certificate-qr grid h-[78px] w-[78px] grid-cols-[repeat(17,1fr)] gap-[1px] border-2 border-[#111827] bg-white p-[3px]">
                  {qrCells.split("").map((cell, index) => (
                    <span
                      key={index}
                      className={cell === "1" ? "bg-[#111827]" : "bg-white"}
                    />
                  ))}
                </div>
                <p className="certificate-qr-label mt-1 text-[10px] font-extrabold leading-tight">
                  Scan to Verify
                  <br />
                  Certificates
                </p>
              </div>
            </div>

            <p className="certificate-verification mt-3 text-[12px] font-medium">
              This certificate is digitally verified through the NOERION system.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}



