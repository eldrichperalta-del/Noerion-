import { useEffect, useMemo, useState } from "react";

import CertificateOverviewCards from "../../components/admin/certificate-management/CertificateOverviewCards";
import CertificateFilters from "../../components/admin/certificate-management/CertificateFilters";
import CertificateTable from "../../components/admin/certificate-management/CertificateTable";

import CertificateDetailsModal from "../../components/admin/certificate-management/CertificateDetailsModal";
import CertificateTrackingModal from "../../components/admin/certificate-management/CertificateTrackingModal";
import RevokeCertificateModal from "../../components/admin/certificate-management/RevokeCertificateModal";
import CertificateUploadModal from "../../components/admin/certificate-management/CertificateUploadModal";
import DashboardPageHeader from "../../components/common/DashboardPageHeader";

import "../../styles/CertificateManagement.css";
import { certificateRecords } from "../../data/certificateRecords";

/**
 * ==========================================
 * CERTIFICATE MANAGEMENT (FRONTEND LAYER)
 * ==========================================
 * This component is now structured for backend integration.
 * - Mock data can be replaced by API calls
 * - Filtering is currently frontend-only (can be moved to backend later)
 * - All actions have backend hooks marked
 */

export default function CertificateManagement() {

  // =========================
  // FILTER STATE (UI ONLY)
  // =========================
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");

  // =========================
  // UI STATE
  // =========================
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [openUpload, setOpenUpload] = useState(false);

  // =========================
  // BACKEND READY STATES
  // =========================
  const [allCertificates, setAllCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * ==========================================
   * MOCK DATA (REMOVE ONCE BACKEND IS READY)
   * ==========================================
   */
  const mockCertificates = [
    {
      certificateId: "CERT-2026-0001",
      traineeId: "TR-001",
      traineeName: "Emily Chen",
      course: "Culinary Arts",
      status: "Issued",
      dateIssued: "2023-06-21",
      qrCodeUrl: "",
      verificationStatus: "Verified",
      lastVerificationDate: "2026-06-20 09:45:22",
    },
    {
      certificateId: "CERT-2026-0002",
      traineeId: "TR-002",
      traineeName: "Marcus Kim",
      course: "Culinary Arts",
      status: "Issued",
      dateIssued: "2024-06-20",
      qrCodeUrl: "",
      verificationStatus: "Never Scanned",
      lastVerificationDate: null,
    },
    {
      certificateId: "CERT-2026-0003",
      traineeId: "TR-001",
      traineeName: "Emily Chen",
      course: "Culinary Arts",
      status: "Issued",
      dateIssued: "2023-06-21",
      qrCodeUrl: "",
      verificationStatus: "Verified",
      lastVerificationDate: "2026-06-20 09:45:22",
    },
    {
      certificateId: "CERT-2026-0004",
      traineeId: "TR-002",
      traineeName: "Marcus Kim",
      course: "Culinary Arts",
      status: "Issued",
      dateIssued: "2024-06-20",
      qrCodeUrl: "",
      verificationStatus: "Never Scanned",
      lastVerificationDate: null,
    },{
      certificateId: "CERT-2026-0005",
      traineeId: "TR-001",
      traineeName: "MAMAMO",
      course: "Culinary Arts",
      status: "Issued",
      dateIssued: "2023-06-21",
      qrCodeUrl: "",
      verificationStatus: "Verified",
      lastVerificationDate: "2026-06-20 09:45:22",
    },
   

  ];

  /**
   * ==========================================
   * FUTURE BACKEND FETCH (REPLACE MOCK DATA)
   * ==========================================
   * Example:
   * GET /api/certificates
   */
  useEffect(() => {
  const loadCertificates = () => {
    try {
      setLoading(true);

      const savedCertificates = localStorage.getItem(
        "noerion_certificates"
      );

      if (savedCertificates) {
        setAllCertificates(JSON.parse(savedCertificates));
      } else {
        setAllCertificates(certificateRecords);
        localStorage.setItem(
          "noerion_certificates",
          JSON.stringify(certificateRecords)
        );
      }
    } catch (err) {
      console.error("Failed to load certificates:", err);
      setError("Failed to load certificates");
    } finally {
      setLoading(false);
    }
  };

  loadCertificates();
}, []);

  // =========================
  // FRONTEND FILTERING (TEMPORARY)
  // =========================
  const filtered = useMemo(() => {
    return allCertificates.filter((c) => {
      const searchMatch =
        !search ||
        c.traineeName.toLowerCase().includes(search.toLowerCase()) ||
        c.certificateId.toLowerCase().includes(search.toLowerCase()) ||
        c.traineeId.toLowerCase().includes(search.toLowerCase());

      const statusMatch =
        status === "All" || c.status === status;

      const date = new Date(c.dateIssued);

      const dayMatch = !day || date.getDate() === Number(day);
      const monthMatch = !month || date.getMonth() + 1 === Number(month);
      const yearMatch = !year || date.getFullYear() === Number(year);

      return searchMatch && statusMatch && dayMatch && monthMatch && yearMatch;
    });
  }, [allCertificates, search, status, day, month, year]);

  // =========================
  // FILTER ACTIONS
  // =========================

  const handleApplyFilters = () => {
    // BACKEND NOTE:
    // Future implementation:
    // GET /api/certificates?search=&status=&day=&month=&year=
    console.log("Apply filters clicked");
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatus("All");
    setDay("");
    setMonth("");
    setYear("");
  };

  // =========================
  // REVOKE HANDLER (BACKEND READY)
  // =========================
  const handleRevoke = async (certificate) => {
    try {
      console.log("Revoke request:", certificate);

      // BACKEND HOOK:
      // PATCH /api/certificates/:id/revoke

      // optimistic UI update
      setAllCertificates((prev) => {
  const updatedCertificates = prev.map((c) =>
    c.certificateId === certificate.certificateId
      ? {
          ...c,
          status: "Revoked",
          verificationStatus: "Revoked",
        }
      : c
  );

  localStorage.setItem(
    "noerion_certificates",
    JSON.stringify(updatedCertificates)
  );

  return updatedCertificates;
});

    } catch (err) {
      console.error("Revoke failed:", err);
    } finally {
      setShowRevokeModal(false);
      setSelectedCertificate(null);
    }
  };

  return (
    <div className="cert-page">

      {/* ================= HEADER ================= */}
      <DashboardPageHeader
        title="Certificate Management"
        subtitle="Issue, monitor, and manage trainee certificates and their verification status."
      />

      {/* ================= OVERVIEW CARDS ================= */}
      <CertificateOverviewCards data={allCertificates} />

      {/* ================= FILTER SECTION ================= */}
      <CertificateFilters
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
        day={day}
        setDay={setDay}
        month={month}
        setMonth={setMonth}
        year={year}
        setYear={setYear}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />

      {/* ================= TABLE SECTION ================= */}
      <div className="table-section">

        {loading && <p>Loading certificates...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && !error && (
          <CertificateTable
            certificates={filtered}
            onView={(item) => {
              setSelectedCertificate(item);
              setShowDetailsModal(true);
            }}
            onTrack={(item) => {
              setSelectedCertificate(item);
              setShowTrackingModal(true);
            }}
            onRevoke={(item) => {
              setSelectedCertificate(item);
              setShowRevokeModal(true);
            }}
          />
        )}
      </div>

      {/* ================= MODALS ================= */}

      <CertificateDetailsModal
        open={showDetailsModal}
        certificate={selectedCertificate}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedCertificate(null);
        }}
      />

      <CertificateTrackingModal
        open={showTrackingModal}
        certificate={selectedCertificate}
        onClose={() => {
          setShowTrackingModal(false);
          setSelectedCertificate(null);
        }}
      />

      <RevokeCertificateModal
        open={showRevokeModal}
        certificate={selectedCertificate}
        onClose={() => {
          setShowRevokeModal(false);
          setSelectedCertificate(null);
        }}
        onRevoke={handleRevoke}
      />

      {openUpload && (
  <CertificateUploadModal
    onClose={() => setOpenUpload(false)}
    onSave={(newCertificate) => {
      setAllCertificates((prev) => {
        const updatedCertificates = [...prev, newCertificate];

        localStorage.setItem(
          "noerion_certificates",
          JSON.stringify(updatedCertificates)
        );

        return updatedCertificates;
      });

      setOpenUpload(false);
    }}
  />
)}
    </div>
  );
}
