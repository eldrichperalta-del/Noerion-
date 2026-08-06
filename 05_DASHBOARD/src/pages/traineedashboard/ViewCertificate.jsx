import { Download } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import CertificateTemplate from "../../components/traineedashboard/certificate/CertificateTemplate";

const certificateFallbacks = [
  {
    id: 1,
    name: "Advanced Robotics Assembly Certificate",
    certificateId: "#NOE-NNC-001",
    qualification: "TESDA NC III Electronics",
    issued: "2025-04-14",
    status: "Valid",
  },
  {
    id: 2,
    name: "Web Application Development Certificate",
    certificateId: "#NOE-WD-002",
    qualification: "TESDA NC IV IT",
    issued: "2025-04-16",
    status: "Valid",
  },
  {
    id: 3,
    name: "Culinary Arts Technique Certificate",
    certificateId: "#NOE-CA-003",
    qualification: "TESDA NC II Cookery",
    issued: "2025-04-10",
    status: "Valid",
  },
  {
    id: 4,
    name: "Industrial Electronics Certificate",
    certificateId: "#NOE-IE-004",
    qualification: "TESDA NC III Electronics",
    issued: "2025-04-17",
    status: "Valid",
  },
  {
    id: 5,
    name: "Mechatronics Systems Certificate",
    certificateId: "#NOE-MS-005",
    qualification: "TESDA NC IV Mechatronics",
    issued: "2025-04-18",
    status: "Valid",
  },
  {
    id: 6,
    name: "Computer System Servicing Certificate",
    certificateId: "#NOE-CS-006",
    qualification: "TESDA NC II CSS",
    issued: "2025-03-28",
    status: "Invalid",
  },
];

export default function ViewCertificate() {
  const { id } = useParams();
  const { state } = useLocation();

  const certificate =
    state?.certificate ||
    certificateFallbacks.find((item) => String(item.id) === String(id));

  if (!certificate) {
    return (
      <div className="rounded-xl bg-white p-10 text-center shadow">
        <p className="text-gray-600">Certificate not found.</p>
      </div>
    );
  }

  const displayDate = new Date(certificate.issued).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const title = certificate.name.replace(" Certificate", "");

  const handlePrint = () => {
    const previousTitle = document.title;

    document.title = "Certificate of Competency";
    window.print();

    setTimeout(() => {
      document.title = previousTitle;
    }, 500);
  };

  const certificatePreview = (
    <CertificateTemplate
      traineeName="Trainee's Full Name"
      traineeId="#NOE-TRAINEE-001"
      qualification={certificate.qualification}
      assessment={title}
      certificateId={certificate.certificateId}
      dateIssued={displayDate}
      trainingCenter="Training Center Name"
    />
  );

  return (
    <>
      <div className="certificate-print-only">{certificatePreview}</div>

      <div className="certificate-view-page min-h-[calc(100vh-7rem)] py-2">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <nav className="flex gap-2 text-sm font-semibold">
            <Link to="/trainee/certificates" className="text-gray-500 hover:text-[#002f86] hover:underline">My Certificates</Link><span>&gt;</span><span className="text-[#002f86]">{title}</span>
          </nav>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-lg bg-[#002f86] px-5 py-2.5 text-sm font-medium text-white shadow-[0_4px_10px_rgba(0,47,134,0.35)] hover:bg-[#00266b]"
          >
            <Download size={17} />
            Download PDF
          </button>
        </div>

        <div className="certificate-print-area certificate-screen-preview">
          {certificatePreview}
        </div>
      </div>
    </>
  );
}
