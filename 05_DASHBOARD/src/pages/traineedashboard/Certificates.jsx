import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, ChevronDown, Search } from "lucide-react";

import { supabase } from "../../supabaseClient.js";
import CertificateTemplate from "../../components/traineedashboard/certificate/CertificateTemplate.jsx";
import DashboardPageHeader from "../../components/common/DashboardPageHeader.jsx";

export default function Certificates() {
  const navigate = useNavigate();

  const [certificates, setCertificates] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [printCertificate, setPrintCertificate] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) {
      return "N/A";
    }

    const parsed = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) {
      return "N/A";
    }

    return parsed.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // =========================================================
  // LOAD CURRENT TRAINEE CERTIFICATES
  // =========================================================

  useEffect(() => {
    let isMounted = true;

    async function loadCertificates() {
      try {
        setLoading(true);
        setError("");

        // -----------------------------------------------------
        // CURRENT USER
        // -----------------------------------------------------

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          throw new Error(
            "You must be logged in to view your certificates."
          );
        }

        // -----------------------------------------------------
        // FETCH CERTIFICATES
        // -----------------------------------------------------

        const {
          data,
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
          .eq("trainee_id", user.id)
          .order("issued_on", { ascending: false })
          .order("created_at", { ascending: false });

        if (certificateError) {
          throw certificateError;
        }

        if (!isMounted) {
          return;
        }

        // -----------------------------------------------------
        // CONVERT DATABASE RECORDS TO UI RECORDS
        // -----------------------------------------------------

        const formattedCertificates = (data || []).map(
          (certificate) => ({
            id: certificate.id,

            name: `${certificate.qualification} Certificate`,

            certificateId: certificate.certificate_id,

            traineeId: certificate.trainee_id,

            assessmentId: certificate.assessment_id,

            qualification: certificate.qualification,

            issued: certificate.issued_on,

            result: certificate.result,

            token: certificate.token,

            hash: certificate.hash,

            signature: certificate.signature,

            status: certificate.status || "Valid",

            createdAt: certificate.created_at,
          })
        );

        setCertificates(formattedCertificates);
      } catch (err) {
        console.error(
          "Error loading certificates:",
          err
        );

        if (isMounted) {
          setError(
            err?.message ||
              "Failed to load certificates."
          );

          setCertificates([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCertificates();

    return () => {
      isMounted = false;
    };
  }, []);

  // =========================================================
  // CERTIFICATE TITLE
  // =========================================================

  const getCertificateTitle = (certificate) => {
    return certificate.name.replace(
      " Certificate",
      ""
    );
  };

  // =========================================================
  // PRINT / DOWNLOAD
  // =========================================================

  const handleDownload = (certificate) => {
    const previousTitle = document.title;

    setPrintCertificate(certificate);

    document.title = "Certificate of Competency";

    setTimeout(() => {
      globalThis.print();

      setTimeout(() => {
        document.title = previousTitle;
        setPrintCertificate(null);
      }, 500);
    }, 100);
  };

  // =========================================================
  // FILTER CERTIFICATES
  // =========================================================

  const filteredCertificates = useMemo(() => {
    return certificates.filter((certificate) => {
      const matchesStatus =
        statusFilter === "All" ||
        certificate.status === statusFilter;

      const matchesDate =
        !dateFilter ||
        certificate.issued === dateFilter;

      const searchValue = `
        ${certificate.name}
        ${certificate.certificateId || ""}
        ${certificate.qualification || ""}
        ${certificate.result || ""}
      `.toLowerCase();

      const matchesSearch =
        searchValue.includes(
          searchTerm.toLowerCase()
        );

      return (
        matchesStatus &&
        matchesDate &&
        matchesSearch
      );
    });
  }, [
    certificates,
    statusFilter,
    dateFilter,
    searchTerm,
  ]);

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <>
      {/* =====================================================
          PRINT VERSION
      ===================================================== */}

      {printCertificate && (
        <div className="certificate-print-only">
          <CertificateTemplate
            traineeName="Trainee"
            traineeId={
              printCertificate.traineeId || "N/A"
            }
            qualification={
              printCertificate.qualification
            }
            assessment={getCertificateTitle(
              printCertificate
            )}
            certificateId={
              printCertificate.certificateId
            }
            dateIssued={formatDate(
              printCertificate.issued
            )}
            trainingCenter="Training Center"
          />
        </div>
      )}

      {/* =====================================================
          MAIN PAGE
      ===================================================== */}

      <div className="p-0">
        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="mb-8">
          <DashboardPageHeader
            title="My Certificates"
            subtitle="View, download, and keep track of your earned certificates."
          />

          {/* =================================================
              FILTERS
          ================================================= */}

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* SEARCH */}

            <div className="relative w-full lg:max-w-md">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Search certificates"
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none shadow-sm focus:border-[#002f86] focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {/* STATUS */}

              <div className="rounded-xl bg-white shadow-sm">
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(
                        event.target.value
                      )
                    }
                    className="appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="All">
                      All
                    </option>

                    <option value="Valid">
                      Valid
                    </option>

                    <option value="Invalid">
                      Invalid
                    </option>
                  </select>

                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />
                </div>
              </div>

              {/* DATE */}

              <div className="rounded-xl bg-white shadow-sm">
                <div className="relative">
                  <CalendarDays
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />

                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(event) =>
                      setDateFilter(
                        event.target.value
                      )
                    }
                    className="rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* ===================================================
            TABLE HEADER
        =================================================== */}

        <div className="mb-4 rounded-xl bg-gray-200 px-6 py-3">
          <div className="grid grid-cols-[2fr_1.5fr_1fr_0.8fr_1fr] gap-4 text-sm font-semibold text-gray-700">
            <p>Certificate Name / ID</p>
            <p>Qualification / Skill</p>
            <p>Date Issued</p>
            <p>Status</p>
            <p />
          </div>
        </div>

        {/* ===================================================
            CERTIFICATE CARDS
        =================================================== */}

        <div className="space-y-4">
          {loading ? (
            <div className="rounded-xl bg-white py-10 text-center shadow">
              <p className="text-gray-500">
                Loading certificates...
              </p>
            </div>
          ) : filteredCertificates.length > 0 ? (
            filteredCertificates.map(
              (certificate) => (
                <div
                  key={certificate.id}
                  className="grid grid-cols-[2fr_1.5fr_1fr_0.8fr_1fr] items-center gap-4 rounded-2xl border border-gray-100 bg-white px-6 py-5 shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                >
                  {/* CERTIFICATE */}

                  <div>
                    <p className="font-semibold text-gray-800">
                      {certificate.name}
                    </p>

                    <p className="text-sm text-gray-500">
                      {certificate.certificateId ||
                        "N/A"}
                    </p>
                  </div>

                  {/* QUALIFICATION */}

                  <div>
                    <p className="text-gray-700">
                      {certificate.qualification ||
                        "N/A"}
                    </p>

                    {certificate.result && (
                      <p className="text-sm text-gray-500">
                        Result:{" "}
                        {certificate.result}
                      </p>
                    )}
                  </div>

                  {/* DATE */}

                  <div>
                    <p className="text-gray-700">
                      {formatDate(
                        certificate.issued
                      )}
                    </p>
                  </div>

                  {/* STATUS */}

                  <div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        certificate.status ===
                        "Valid"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {certificate.status}
                    </span>
                  </div>

                  {/* BUTTONS */}

                  <div className="flex flex-col items-end gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/trainee/certificates/${certificate.id}`,
                          {
                            state: {
                              certificate,
                            },
                          }
                        )
                      }
                      className="w-40 rounded-lg bg-blue-700 py-2 text-sm font-medium text-white hover:bg-blue-800"
                    >
                      View Certificate
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDownload(
                          certificate
                        )
                      }
                      className="w-40 rounded-lg bg-blue-700 py-2 text-sm font-medium text-white hover:bg-blue-800"
                    >
                      Download
                    </button>
                  </div>
                </div>
              )
            )
          ) : (
            <div className="rounded-xl bg-white py-10 text-center shadow">
              <p className="text-gray-500">
                No certificates found.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}