import CertificateOverviewCards from "../../components/admin/certificate-management/CertificateOverviewCards.jsx";
import CertificateFilters from "../../components/admin/certificate-management/CertificateFilters.jsx";
import CertificateTable from "../../components/admin/certificate-management/CertificateTable.jsx";
import CertificateDetailsModal from "../../components/admin/certificate-management/CertificateDetailsModal.jsx";
import CertificateTrackingModal from "../../components/admin/certificate-management/CertificateTrackingModal.jsx";
import RevokeCertificateModal from "../../components/admin/certificate-management/RevokeCertificateModal.jsx";
import DashboardPageHeader from "../../components/common/DashboardPageHeader.jsx";
import { supabase } from "../../supabaseClient.js";

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

  const [selectedCertificate, setSelectedCertificate] =
    useState(null);

  const [showDetailsModal, setShowDetailsModal] =
    useState(false);

  const [showTrackingModal, setShowTrackingModal] =
    useState(false);

  const [showRevokeModal, setShowRevokeModal] =
    useState(false);

  const [openUpload, setOpenUpload] =
    useState(false);

  // =========================
  // DATA STATE
  // =========================

  const [allCertificates, setAllCertificates] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState(null);

  // =========================
  // LOAD CERTIFICATES
  // =========================

  const loadCertificates = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(
        "========================================"
      );

      console.log(
        "NOERION CERTIFICATE MANAGEMENT"
      );

      console.log(
        "Loading certificates..."
      );

      console.log(
        "========================================"
      );

      // =========================
      // CHECK AUTHENTICATION
      // =========================

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      console.log(
        "Current Supabase user:",
        user
      );

      console.log(
        "Authentication error:",
        userError
      );

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error(
          "You are not authenticated. Please log in again."
        );
      }

      // =========================
      // LOAD DATABASE RECORDS
      // =========================

      const {
        data,
        error: fetchError,
      } = await supabase
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
        .order("created_at", {
          ascending: false,
        });

      console.log(
        "Supabase certificate data:",
        data
      );

      console.log(
        "Supabase certificate error:",
        fetchError
      );

      if (fetchError) {
        throw fetchError;
      }

      // =========================
      // FORMAT DATABASE DATA
      // =========================

      const formattedCertificates =
        (data || []).map((certificate) => ({
          certificateId:
            certificate.certificate_id,

          traineeId:
            certificate.trainee_id,

          traineeName:
            certificate.trainee_name,

          studentId:
            certificate.student_id,

          course:
            certificate.qualification,

          qualification:
            certificate.qualification,

          skill:
            certificate.skill,

          dateIssued:
            certificate.issued_on,

          issuedOn:
            certificate.issued_on,

          result:
            certificate.result,

          token:
            certificate.token,

          hash:
            certificate.hash,

          signature:
            certificate.signature,

          status:
            certificate.status,

          verificationStatus:
            certificate.status === "Valid"
              ? "Verified"
              : certificate.status ===
                "Revoked"
              ? "Revoked"
              : certificate.status ||
                "Unknown",

          lastVerificationDate:
            null,

          createdAt:
            certificate.created_at,

          qrCodeUrl:
            "",
        }));

      console.log(
        "Formatted certificates:",
        formattedCertificates
      );

      console.log(
        "Certificate count:",
        formattedCertificates.length
      );

      setAllCertificates(
        formattedCertificates
      );

      console.log(
        "========================================"
      );

      console.log(
        "Certificate loading complete."
      );

      console.log(
        "========================================"
      );
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

    return allCertificates.filter(
      (certificate) => {
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

        // =========================
        // SEARCH
        // =========================

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

        // =========================
        // STATUS
        // =========================

        const statusMatch =
          status === "All" ||
          certificate.status === status;

        // =========================
        // DATE
        // =========================

        const dateValue =
          certificate.dateIssued;

        const date = dateValue
          ? new Date(dateValue)
          : null;

        const validDate =
          date &&
          !Number.isNaN(
            date.getTime()
          );

        const dayMatch =
          !day ||
          (validDate &&
            date.getDate() ===
              Number(day));

        const monthMatch =
          !month ||
          (validDate &&
            date.getMonth() + 1 ===
              Number(month));

        const yearMatch =
          !year ||
          (validDate &&
            date.getFullYear() ===
              Number(year));

        return (
          searchMatch &&
          statusMatch &&
          dayMatch &&
          monthMatch &&
          yearMatch
        );
      }
    );
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

  const handleRevoke = async (
    certificate
  ) => {
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

      const {
        error: revokeError,
      } = await supabase
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

      setAllCertificates(
        (previous) =>
          previous.map((item) =>
            item.certificateId ===
            certificate.certificateId
              ? {
                  ...item,
                  status: "Revoked",
                  verificationStatus:
                    "Revoked",
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
  // CERTIFICATE SAVED
  // =========================

  const handleCertificateSaved = async (
    newCertificate
  ) => {
    try {
      setError(null);

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

      {/* HEADER */}

      <DashboardPageHeader
        title="Certificate Management"
        subtitle="Issue, monitor, and manage trainee certificates and their verification status."
      />

      {/* OVERVIEW */}

      <CertificateOverviewCards
        data={allCertificates}
      />

      {/* FILTERS */}

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

      {/* ERROR */}

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

      {/* TABLE */}

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

      {/* DETAILS MODAL */}

      <CertificateDetailsModal
        open={showDetailsModal}
        certificate={selectedCertificate}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedCertificate(null);
        }}
      />

      {/* TRACKING MODAL */}

      <CertificateTrackingModal
        open={showTrackingModal}
        certificate={selectedCertificate}
        onClose={() => {
          setShowTrackingModal(false);
          setSelectedCertificate(null);
        }}
      />

      {/* REVOKE MODAL */}

      <RevokeCertificateModal
        open={showRevokeModal}
        certificate={selectedCertificate}
        onClose={() => {
          setShowRevokeModal(false);
          setSelectedCertificate(null);
        }}
        onRevoke={handleRevoke}
      />

      {/* UPLOAD MODAL */}

      {openUpload && (
        <CertificateUploadModal
          onClose={() =>
            setOpenUpload(false)
          }
          onSave={
            handleCertificateSaved
          }
        />
      )}

    </div>
  );
}