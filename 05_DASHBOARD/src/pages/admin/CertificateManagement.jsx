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

import { supabase } from "../../supabaseClient";

/**
 * ==========================================
 * CERTIFICATE MANAGEMENT
 * ==========================================
 *
 * Supabase is the single source of truth.
 *
 * This page:
 * - Loads certificates from Supabase
 * - Filters certificates on the frontend
 * - Displays certificate information
 * - Revokes certificates directly in Supabase
 *
 * Certificate table:
 *
 * Supabase
 * certificates
 *      ↓
 * CertificateManagement
 *      ↓
 * CertificateTable
 *
 */

export default function CertificateManagement() {
  // =========================
  // FILTER STATE
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
  // DATA STATE
  // =========================

  const [allCertificates, setAllCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // =========================
  // LOAD CERTIFICATES
  // =========================

  const loadCertificates = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("certificates")
        .select(`
          certificate_id,
          trainee_id,
          trainee_name,
          student_id,
          qualification,
          skill,
          issued_on,
          result,
          token,
          hash,
          signature,
          status,
          created_at
        `)
        .order("created_at", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      /**
       * Convert Supabase database fields
       * into the field names expected by
       * the existing certificate management UI.
       */
      const formattedCertificates = (data || []).map((certificate) => ({
        certificateId: certificate.certificate_id,

        traineeId: certificate.trainee_id,

        traineeName: certificate.trainee_name,

        studentId: certificate.student_id,

        course: certificate.qualification,

        qualification: certificate.qualification,

        skill: certificate.skill,

        dateIssued: certificate.issued_on,

        issuedOn: certificate.issued_on,

        result: certificate.result,

        token: certificate.token,

        hash: certificate.hash,

        signature: certificate.signature,

        status: certificate.status,

        /**
         * These fields are kept for compatibility
         * with the current CertificateTable and
         * CertificateDetailsModal.
         */
        verificationStatus:
          certificate.status === "Valid"
            ? "Verified"
            : certificate.status === "Revoked"
            ? "Revoked"
            : certificate.status || "Unknown",

        lastVerificationDate: null,

        createdAt: certificate.created_at,

        qrCodeUrl: "",
      }));

      setAllCertificates(formattedCertificates);
    } catch (err) {
      console.error(
        "Failed to load certificates:",
        err
      );

      setError(
        err?.message ||
          "Failed to load certificates."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // INITIAL LOAD
  // =========================

  useEffect(() => {
    loadCertificates();
  }, []);

  // =========================
  // FRONTEND FILTERING
  // =========================

  const filtered = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return allCertificates.filter((certificate) => {
      // -------------------------
      // SEARCH
      // -------------------------

      const traineeName =
        certificate.traineeName || "";

      const certificateId =
        certificate.certificateId || "";

      const traineeId =
        certificate.traineeId || "";

      const studentId =
        certificate.studentId || "";

      const qualification =
        certificate.qualification ||
        certificate.course ||
        "";

      const searchMatch =
        !normalizedSearch ||
        traineeName
          .toLowerCase()
          .includes(normalizedSearch) ||
        certificateId
          .toLowerCase()
          .includes(normalizedSearch) ||
        traineeId
          .toLowerCase()
          .includes(normalizedSearch) ||
        studentId
          .toLowerCase()
          .includes(normalizedSearch) ||
        qualification
          .toLowerCase()
          .includes(normalizedSearch);

      // -------------------------
      // STATUS
      // -------------------------

      const statusMatch =
        status === "All" ||
        certificate.status === status;

      // -------------------------
      // DATE
      // -------------------------

      const dateValue =
        certificate.dateIssued;

      const date = dateValue
        ? new Date(dateValue)
        : null;

      const validDate =
        date &&
        !Number.isNaN(date.getTime());

      const dayMatch =
        !day ||
        (validDate &&
          date.getDate() === Number(day));

      const monthMatch =
        !month ||
        (validDate &&
          date.getMonth() + 1 === Number(month));

      const yearMatch =
        !year ||
        (validDate &&
          date.getFullYear() === Number(year));

      return (
        searchMatch &&
        statusMatch &&
        dayMatch &&
        monthMatch &&
        yearMatch
      );
    });
  }, [
    allCertificates,
    search,
    status,
    day,
    month,
    year,
  ]);

  // =========================
  // FILTER ACTIONS
  // =========================

  const handleApplyFilters = () => {
    /**
     * Filtering is currently performed
     * through useMemo above.
     *
     * If the certificate table becomes very large,
     * these filters can later be moved into
     * the Supabase query.
     */
    console.log(
      "Certificate filters applied:",
      {
        search,
        status,
        day,
        month,
        year,
      }
    );
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatus("All");
    setDay("");
    setMonth("");
    setYear("");
  };

  // =========================
  // REVOKE CERTIFICATE
  // =========================

  const handleRevoke = async (certificate) => {
    if (!certificate?.certificateId) {
      console.error(
        "Cannot revoke certificate: missing certificate ID."
      );

      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log(
        "Revoking certificate:",
        certificate.certificateId
      );

      /**
       * Update the real Supabase certificate.
       *
       * IMPORTANT:
       *
       * The verification Edge Function checks:
       *
       * certificate.status === "Valid"
       *
       * Therefore a revoked certificate must
       * have status = "Revoked".
       */
      const { error: revokeError } =
        await supabase
          .from("certificates")
          .update({
            status: "Revoked",
          })
          .eq(
            "certificate_id",
            certificate.certificateId
          );

      if (revokeError) {
        throw revokeError;
      }

      /**
       * Update the local UI immediately.
       */
      setAllCertificates((previous) =>
        previous.map((item) =>
          item.certificateId ===
          certificate.certificateId
            ? {
                ...item,
                status: "Revoked",
                verificationStatus: "Revoked",
              }
            : item
        )
      );

      console.log(
        "Certificate revoked successfully:",
        certificate.certificateId
      );
    } catch (err) {
      console.error(
        "Certificate revoke failed:",
        err
      );

      setError(
        err?.message ||
          "Failed to revoke certificate."
      );
    } finally {
      setLoading(false);

      setShowRevokeModal(false);
      setSelectedCertificate(null);
    }
  };

  // =========================
  // UPLOAD / NEW CERTIFICATE
  // =========================

  const handleCertificateSaved = async (
    newCertificate
  ) => {
    /**
     * The current CertificateUploadModal
     * supplies a certificate object through
     * onSave().
     *
     * If the modal has already inserted the
     * certificate into Supabase, reload the
     * database list.
     *
     * Otherwise, the modal can be updated next
     * so that the INSERT happens there.
     */
    try {
      setError(null);

      /**
       * If the upload modal returned a certificate
       * that already has a certificateId, reload
       * from Supabase so the database remains the
       * source of truth.
       */
      if (newCertificate) {
        console.log(
          "Certificate saved:",
          newCertificate
        );
      }

      await loadCertificates();

      setOpenUpload(false);
    } catch (err) {
      console.error(
        "Failed to refresh certificates:",
        err
      );

      setError(
        err?.message ||
          "Certificate was saved, but the list could not be refreshed."
      );
    }
  };

  // =========================
  // RENDER
  // =========================

  return (
    <div className="cert-page">

      {/* ================= HEADER ================= */}

      <DashboardPageHeader
        title="Certificate Management"
        subtitle="Issue, monitor, and manage trainee certificates and their verification status."
      />

      {/* ================= OVERVIEW CARDS ================= */}

      <CertificateOverviewCards
        data={allCertificates}
      />

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

      {/* ================= ERROR ================= */}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-medium">
            Certificate Management Error
          </p>

          <p className="mt-1 text-sm">
            {error}
          </p>
        </div>
      )}

      {/* ================= TABLE SECTION ================= */}

      <div className="table-section">

        {loading && (
          <p>
            Loading certificates...
          </p>
        )}

        {!loading && (
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

      {/* ================= DETAILS MODAL ================= */}

      <CertificateDetailsModal
        open={showDetailsModal}
        certificate={selectedCertificate}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedCertificate(null);
        }}
      />

      {/* ================= TRACKING MODAL ================= */}

      <CertificateTrackingModal
        open={showTrackingModal}
        certificate={selectedCertificate}
        onClose={() => {
          setShowTrackingModal(false);
          setSelectedCertificate(null);
        }}
      />

      {/* ================= REVOKE MODAL ================= */}

      <RevokeCertificateModal
        open={showRevokeModal}
        certificate={selectedCertificate}
        onClose={() => {
          setShowRevokeModal(false);
          setSelectedCertificate(null);
        }}
        onRevoke={handleRevoke}
      />

      {/* ================= UPLOAD MODAL ================= */}

      {openUpload && (
        <CertificateUploadModal
          onClose={() =>
            setOpenUpload(false)
          }
          onSave={handleCertificateSaved}
        />
      )}

    </div>
  );
}