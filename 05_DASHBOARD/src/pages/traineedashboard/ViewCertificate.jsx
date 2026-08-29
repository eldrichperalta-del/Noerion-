import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import CertificateTemplate from "../../components/traineedashboard/certificate/CertificateTemplate.jsx";
import { getCertificateById } from "../../services/certificateVerificationService.js";

export default function ViewCertificate() {
  const { id } = useParams();

  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCertificate() {
      try {
        setLoading(true);
        setErrorMessage("");

        console.log("========================================");
        console.log("VIEW CERTIFICATE");
        console.log("Certificate route ID:", id);
        console.log("========================================");

        const data = await getCertificateById(id);

        if (cancelled) {
          return;
        }

        console.log("Certificate data returned:", data);

        if (!data) {
          setCertificate(null);
          setErrorMessage("Certificate not found.");
          return;
        }

        setCertificate(data);
      } catch (error) {
        console.error(
          "Failed to load certificate:",
          error
        );

        if (!cancelled) {
          setCertificate(null);
          setErrorMessage(
            error?.message ||
              "Unable to load certificate."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (id) {
      loadCertificate();
    } else {
      setLoading(false);
      setErrorMessage("Certificate ID is missing.");
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

  // ---------------------------------------------------------
  // LOADING
  // ---------------------------------------------------------

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-10 text-center shadow">
        <p className="text-gray-600">
          Loading certificate...
        </p>
      </div>
    );
  }

  // ---------------------------------------------------------
  // ERROR
  // ---------------------------------------------------------

  if (errorMessage || !certificate) {
    return (
      <div className="rounded-xl bg-white p-10 text-center shadow">
        <p className="font-semibold text-red-600">
          Unable to load certificate
        </p>

        <p className="mt-2 text-sm text-gray-600">
          {errorMessage || "Certificate not found."}
        </p>

        <Link
          to="/trainee/certificates"
          className="mt-5 inline-block font-semibold text-[#002f86] hover:underline"
        >
          Back to My Certificates
        </Link>
      </div>
    );
  }

  // ---------------------------------------------------------
  // FORMAT DATE
  // ---------------------------------------------------------

  const rawDate =
    certificate.issuedOn ||
    certificate.issued_on;

  let displayDate = "—";

  if (rawDate) {
    const parsedDate = new Date(rawDate);

    if (!Number.isNaN(parsedDate.getTime())) {
      displayDate = parsedDate.toLocaleDateString(
        "en-US",
        {
          month: "long",
          day: "numeric",
          year: "numeric",
        }
      );
    }
  }

  // ---------------------------------------------------------
  // CERTIFICATE VALUES
  // ---------------------------------------------------------

  const traineeName =
    certificate.traineeName ||
    "Trainee Name";

  const qualification =
    certificate.qualification ||
    "Qualification";

  const result =
    certificate.result ||
    "Passed";

  const certificateId =
    certificate.certificateId ||
    id ||
    "";

  const assessorName =
    certificate.assessorName ||
    "Assessor Name";

  const authorityName =
    certificate.authorityName ||
    "TESDA Authority";

  console.log("Certificate display values:", {
    traineeName,
    qualification,
    result,
    certificateId,
    displayDate,
    assessorName,
    authorityName,
  });

  // ---------------------------------------------------------
  // CERTIFICATE TEMPLATE
  // ---------------------------------------------------------

  const certificatePreview = (
    <CertificateTemplate
      traineeName={traineeName}
      qualification={qualification}
      result={result}
      certificateId={certificateId}
      dateIssued={displayDate}
      assessorName={assessorName}
      authorityName={authorityName}
    />
  );

  // ---------------------------------------------------------
  // PRINT / DOWNLOAD
  // ---------------------------------------------------------

  const handlePrint = () => {
    const previousTitle = document.title;

    document.title =
      `Certificate of Competency - ${traineeName}`;

    globalThis.print();

    setTimeout(() => {
      document.title = previousTitle;
    }, 500);
  };

  // ---------------------------------------------------------
  // PAGE
  // ---------------------------------------------------------

  return (
    <>
      {/* PRINT VERSION */}
      <div className="certificate-print-only">
        {certificatePreview}
      </div>

      {/* SCREEN VERSION */}
      <div className="certificate-view-page min-h-[calc(100vh-7rem)] py-2">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 print:hidden">

          {/* BREADCRUMB */}
          <nav className="flex gap-2 text-sm font-semibold">
            <Link
              to="/trainee/certificates"
              className="text-gray-500 hover:text-[#002f86] hover:underline"
            >
              My Certificates
            </Link>

            <span>&gt;</span>

            <span className="text-[#002f86]">
              {qualification}
            </span>
          </nav>

          {/* DOWNLOAD */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-lg bg-[#002f86] px-5 py-2.5 text-sm font-medium text-white shadow-[0_4px_10px_rgba(0,47,134,0.35)] hover:bg-[#00266b]"
          >
            <Download size={17} />

            Download PDF
          </button>
        </div>

        {/* CERTIFICATE */}
        <div className="certificate-print-area certificate-screen-preview">
          {certificatePreview}
        </div>
      </div>
    </>
  );
}