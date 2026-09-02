import { useEffect, useMemo, useState } from "react";

import CertificateOverviewCards from "../../components/admin/certificate-management/CertificateOverviewCards.jsx";
import CertificateFilters from "../../components/admin/certificate-management/CertificateFilters.jsx";
import CertificateTable from "../../components/admin/certificate-management/CertificateTable.jsx";
import CertificateDetailsModal from "../../components/admin/certificate-management/CertificateDetailsModal.jsx";
import CertificateTrackingModal from "../../components/admin/certificate-management/CertificateTrackingModal.jsx";
import RevokeCertificateModal from "../../components/admin/certificate-management/RevokeCertificateModal.jsx";
import CertificateUploadModal from "../../components/admin/certificate-management/CertificateUploadModal.jsx";
import DashboardPageHeader from "../../components/common/DashboardPageHeader.jsx";

import { supabase } from "../../supabaseClient.js";

export default function CertificateManagement() {
  // =========================
  // FILTER STATE
  // =========================

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("All");

  const [day, setDay] =
    useState("");

  const [month, setMonth] =
    useState("");

  const [year, setYear] =
    useState("");

  // =========================
  // UI STATE
  // =========================

  const [
    selectedCertificate,
    setSelectedCertificate,
  ] = useState(null);

  const [
    selectedCertificateIndex,
    setSelectedCertificateIndex,
  ] = useState(0);

  const [
    showDetailsModal,
    setShowDetailsModal,
  ] = useState(false);

  const [
    showTrackingModal,
    setShowTrackingModal,
  ] = useState(false);

  const [
    showRevokeModal,
    setShowRevokeModal,
  ] = useState(false);

  const [
    openUpload,
    setOpenUpload,
  ] = useState(false);

  // =========================
  // DATA STATE
  // =========================

  const [
    allCertificates,
    setAllCertificates,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState(null);

  // =========================
  // LOAD CERTIFICATES
  // =========================

  const loadCertificates = async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (!session) {
        throw new Error(
          "Your Supabase session is missing. Please log in again."
        );
      }

      console.log(
        "Authenticated user:",
        session.user?.id
      );

      // =========================
      // LOAD CERTIFICATES
      // =========================

      const {
        data: certificates,
        error: certificateError,
      } = await supabase
        .from("certificates")
        .select(`
          id,
          certificate_id,
          trainee_id,
          assessment_id,
          qualification,
          issued_on,
          result,
          token,
          hash,
          signature,
          status,
          created_at
        `)
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      console.log(
        "Supabase certificate data:",
        certificates
      );

      if (certificateError) {
        throw new Error(
          certificateError.message ||
          "Unable to load certificates from Supabase."
        );
      }

      // =========================
      // GET TRAINEE IDS
      // =========================

      const traineeIds = [
        ...new Set(
          (certificates || [])
            .map(
              (certificate) =>
                certificate.trainee_id
            )
            .filter(Boolean)
        ),
      ];

      // =========================
      // LOAD PROFILES
      // =========================

      let profiles = [];

      if (traineeIds.length > 0) {
        const {
          data: profileData,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(`
            id,
            first_name,
            middle_name,
            last_name,
            suffix
          `)
          .in(
            "id",
            traineeIds
          );

        if (profileError) {
          console.warn(
            "Unable to load trainee profiles:",
            profileError
          );
        } else {
          profiles =
            profileData || [];
        }
      }

      // =========================
      // PROFILE MAP
      // =========================

      const profileMap =
        new Map(
          profiles.map(
            (profile) => [
              profile.id,
              profile,
            ]
          )
        );

      // =========================
      // FORMAT CERTIFICATES
      // =========================

      const formattedCertificates =
        (certificates || []).map(
          (certificate) => {
            const profile =
              profileMap.get(
                certificate.trainee_id
              );

            const traineeName = [
              profile?.first_name,
              profile?.middle_name,
              profile?.last_name,
              profile?.suffix,
            ]
              .filter(Boolean)
              .join(" ")
              .trim();

            return {
              id:
                certificate.id,

              certificateId:
                certificate.certificate_id,

              traineeId:
                certificate.trainee_id,

              assessmentId:
                certificate.assessment_id,

              traineeName:
                traineeName || "—",

              studentId:
                certificate.trainee_id || "—",

              course:
                certificate.qualification,

              qualification:
                certificate.qualification,

              skill:
                certificate.qualification,

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
                  : certificate.status === "Revoked"
                  ? "Revoked"
                  : certificate.status ||
                    "Unknown",

              lastVerificationDate:
                null,

              createdAt:
                certificate.created_at,

              qrCodeUrl:
                "",
            };
          }
        );

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

    } catch (err) {
      console.error(
        "Failed to load certificates:",
        err
      );

      setAllCertificates([]);

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

        const searchMatch =
          !normalizedSearch ||
          traineeName
            .toLowerCase()
            .includes(
              normalizedSearch
            ) ||
          certificateId
            .toLowerCase()
            .includes(
              normalizedSearch
            ) ||
          traineeId
            .toLowerCase()
            .includes(
              normalizedSearch
            ) ||
          studentId
            .toLowerCase()
            .includes(
              normalizedSearch
            ) ||
          qualification
            .toLowerCase()
            .includes(
              normalizedSearch
            );

        const statusMatch =
          status === "All" ||
          certificate.status === status;

        const dateValue =
          certificate.dateIssued;

        const date =
          dateValue
            ? new Date(dateValue)
            : null;

        const validDate =
          date &&
          !Number.isNaN(
            date.getTime()
          );

        const dayMatch =
          !day ||
          (
            validDate &&
            date.getDate() ===
              Number(day)
          );

        const monthMatch =
          !month ||
          (
            validDate &&
            date.getMonth() + 1 ===
              Number(month)
          );

        const yearMatch =
          !year ||
          (
            validDate &&
            date.getFullYear() ===
              Number(year)
          );

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
  // VIEW CERTIFICATE
  // =========================

  const handleViewCertificate = (
    certificate
  ) => {
    const index =
      filtered.findIndex(
        (item) =>
          item.certificateId ===
          certificate.certificateId
      );

    setSelectedCertificate(
      certificate
    );

    setSelectedCertificateIndex(
      index >= 0
        ? index
        : 0
    );

    setShowDetailsModal(true);
  };

  // =========================
  // PREVIOUS CERTIFICATE
  // =========================

  const handlePreviousCertificate = () => {
    if (
      selectedCertificateIndex <= 0
    ) {
      return;
    }

    const newIndex =
      selectedCertificateIndex - 1;

    setSelectedCertificateIndex(
      newIndex
    );

    setSelectedCertificate(
      filtered[newIndex]
    );
  };

  // =========================
  // NEXT CERTIFICATE
  // =========================

  const handleNextCertificate = () => {
    if (
      selectedCertificateIndex >=
      filtered.length - 1
    ) {
      return;
    }

    const newIndex =
      selectedCertificateIndex + 1;

    setSelectedCertificateIndex(
      newIndex
    );

    setSelectedCertificate(
      filtered[newIndex]
    );
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
        throw new Error(
          revokeError.message ||
          "Failed to revoke certificate."
        );
      }

      setAllCertificates(
        (previous) =>
          previous.map(
            (item) =>
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

      setSelectedCertificateIndex(0);
    }
  };

  // =========================
  // CERTIFICATE SAVED
  // =========================

  const handleCertificateSaved =
    async (
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

      <DashboardPageHeader
        title="Certificate Management"
        subtitle="Issue, monitor, and manage trainee certificates and their verification status."
      />

      <CertificateOverviewCards
        data={allCertificates}
      />

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

      <div className="table-section">

        {loading && (
          <p>
            Loading certificates...
          </p>
        )}

        {!loading && (
          <CertificateTable
            certificates={filtered}
            onView={
              handleViewCertificate
            }
            onTrack={(item) => {
              setSelectedCertificate(
                item
              );

              setShowTrackingModal(
                true
              );
            }}
            onRevoke={(item) => {
              setSelectedCertificate(
                item
              );

              setShowRevokeModal(
                true
              );
            }}
          />
        )}

      </div>

      {/* ========================= */}
      {/* CERTIFICATE DETAILS */}
      {/* ========================= */}

      <CertificateDetailsModal
        open={showDetailsModal}
        certificate={selectedCertificate}

        certificates={filtered}

        currentIndex={
          selectedCertificateIndex
        }

        onPrevious={
          handlePreviousCertificate
        }

        onNext={
          handleNextCertificate
        }

        onClose={() => {
          setShowDetailsModal(false);

          setSelectedCertificate(
            null
          );

          setSelectedCertificateIndex(
            0
          );
        }}
      />

      {/* ========================= */}
      {/* CERTIFICATE TRACKING */}
      {/* ========================= */}

      <CertificateTrackingModal
        open={showTrackingModal}
        certificate={selectedCertificate}
        onClose={() => {
          setShowTrackingModal(false);

          setSelectedCertificate(null);
        }}
      />

      {/* ========================= */}
      {/* REVOKE MODAL */}
      {/* ========================= */}

      <RevokeCertificateModal
        open={showRevokeModal}
        certificate={selectedCertificate}
        onClose={() => {
          setShowRevokeModal(false);

          setSelectedCertificate(null);
        }}
        onRevoke={handleRevoke}
      />

      {/* ========================= */}
      {/* UPLOAD MODAL */}
      {/* ========================= */}

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