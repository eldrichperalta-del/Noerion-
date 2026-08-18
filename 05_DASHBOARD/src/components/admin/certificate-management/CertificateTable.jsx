import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CertificateTable({
  certificates = [],
  loading = false,
  error = null,
  onView,
  onTrack,
  onRevoke,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);

  const rowsPerPage = 5;

  // ==========================================
  // NORMALIZE CERTIFICATE DATA
  // ==========================================

  const safeCertificates = useMemo(() => {
    if (!Array.isArray(certificates)) {
      console.error(
        "CertificateTable: certificates is not an array:",
        certificates
      );

      return [];
    }

    return certificates.filter(Boolean);
  }, [certificates]);

  // ==========================================
  // DEBUG
  // ==========================================

  useEffect(() => {
    console.log("========================================");
    console.log("CERTIFICATE TABLE");
    console.log("Received certificates:", certificates);
    console.log("Certificate count:", safeCertificates.length);

    if (safeCertificates.length > 0) {
      console.log(
        "First certificate:",
        safeCertificates[0]
      );
    }

    console.log("========================================");
  }, [certificates, safeCertificates]);

  // ==========================================
  // RESET PAGE WHEN DATA CHANGES
  // ==========================================

  useEffect(() => {
    setCurrentPage(1);
  }, [safeCertificates.length]);

  // ==========================================
  // CLOSE MENU ON ESC
  // ==========================================

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        setOpenMenuId(null);
      }
    };

    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, []);

  // ==========================================
  // PAGINATION
  // ==========================================

  const totalPages = Math.max(
    Math.ceil(
      safeCertificates.length / rowsPerPage
    ),
    1
  );

  const paginatedCertificates = useMemo(() => {
    const start =
      (currentPage - 1) * rowsPerPage;

    return safeCertificates.slice(
      start,
      start + rowsPerPage
    );
  }, [safeCertificates, currentPage]);

  const startIndex =
    (currentPage - 1) * rowsPerPage;

  const showingStart =
    safeCertificates.length === 0
      ? 0
      : startIndex + 1;

  const showingEnd = Math.min(
    startIndex + rowsPerPage,
    safeCertificates.length
  );

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow">
        Loading certificates...
      </div>
    );
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow text-red-500">
        {error}
      </div>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">

      {/* ======================================
          TABLE
      ====================================== */}

      <div className="overflow-x-auto rounded-xl border-2 border-gray-100 shadow-[0_4px_12px_rgba(0,0,0,0.20)]">

        <table className="w-full">

          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-4 text-left font-bold">
                Certificate ID
              </th>

              <th className="px-4 py-4 text-left font-bold">
                Trainee Name
              </th>

              <th className="px-4 py-4 text-left font-bold">
                Course
              </th>

              <th className="px-4 py-4 text-left font-bold">
                Date Issued
              </th>

              <th className="px-4 py-4 text-left font-bold">
                Status
              </th>

              <th className="px-4 py-4 text-center font-bold">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>

            {/* ==================================
                EMPTY STATE
            ================================== */}

            {paginatedCertificates.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-gray-500"
                >
                  No certificates found.
                </td>
              </tr>
            )}

            {/* ==================================
                CERTIFICATE ROWS
            ================================== */}

            {paginatedCertificates.map(
              (certificate, index) => {

                const certificateId =
                  certificate?.certificateId ||
                  `certificate-${index}`;

                const traineeName =
                  certificate?.traineeName ||
                  "—";

                const course =
                  certificate?.course ||
                  certificate?.qualification ||
                  "—";

                const dateIssued =
                  certificate?.dateIssued ||
                  certificate?.issuedOn ||
                  "—";

                const status =
                  certificate?.status ||
                  "Unknown";

                const isValid =
                  status.toLowerCase() === "valid" ||
                  status.toLowerCase() === "issued";

                return (
                  <tr
                    key={certificateId}
                    className="border-b border-gray-200 hover:bg-gray-50 transition"
                  >

                    {/* CERTIFICATE ID */}

                    <td className="px-4 py-4 font-medium text-gray-900">
                      {certificateId}
                    </td>

                    {/* TRAINEE */}

                    <td className="px-4 py-4 text-gray-700">
                      {traineeName}
                    </td>

                    {/* COURSE */}

                    <td className="px-4 py-4 text-gray-700">
                      {course}
                    </td>

                    {/* DATE */}

                    <td className="px-4 py-4 text-gray-700">
                      {dateIssued}
                    </td>

                    {/* STATUS */}

                    <td className="px-4 py-4">

                      <span
                        className={
                          isValid
                            ? "inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700"
                            : status.toLowerCase() ===
                              "revoked"
                            ? "inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700"
                            : "inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700"
                        }
                      >
                        {status}
                      </span>

                    </td>

                    {/* ACTIONS */}

                    <td className="relative px-4 py-4 text-center">

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();

                          setOpenMenuId(
                            openMenuId === certificateId
                              ? null
                              : certificateId
                          );
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-200"
                        aria-label="Certificate actions"
                      >
                        <div className="flex flex-col gap-[2px]">
                          <span className="h-1 w-1 rounded-full bg-gray-700" />
                          <span className="h-1 w-1 rounded-full bg-gray-700" />
                          <span className="h-1 w-1 rounded-full bg-gray-700" />
                        </div>
                      </button>

                      {/* DROPDOWN */}

                      {openMenuId === certificateId && (
                        <div
                          className="absolute right-2 top-12 z-50 w-36 rounded-lg border border-gray-200 bg-white py-1 text-left shadow-xl"
                          onClick={(event) => {
                            event.stopPropagation();
                          }}
                        >

                          <button
                            type="button"
                            onClick={() => {
                              onView?.(certificate);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                          >
                            Details
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onTrack?.(certificate);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                          >
                            Track
                          </button>

                          {status.toLowerCase() !==
                            "revoked" && (
                            <button
                              type="button"
                              onClick={() => {
                                onRevoke?.(certificate);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                            >
                              Revoke
                            </button>
                          )}

                        </div>
                      )}

                    </td>

                  </tr>
                );
              }
            )}

          </tbody>

        </table>

      </div>

      {/* ======================================
          PAGINATION
      ====================================== */}

      <div className="flex items-center justify-between border-t border-gray-200 px-4 py-4 text-sm">

        <p className="font-medium text-gray-700">
          Showing {showingStart}-{showingEnd} of{" "}
          {safeCertificates.length}
        </p>

        <div className="flex items-center gap-3">

          <button
            type="button"
            onClick={() => {
              setCurrentPage((page) =>
                Math.max(page - 1, 1)
              );
            }}
            disabled={currentPage === 1}
            className="flex items-center gap-1 text-gray-500 disabled:opacity-40"
          >
            <ChevronLeft size={16} />
            Prev
          </button>

          <span className="rounded-lg border px-3 py-2">
            {currentPage}
          </span>

          <button
            type="button"
            onClick={() => {
              setCurrentPage((page) =>
                Math.min(
                  page + 1,
                  totalPages
                )
              );
            }}
            disabled={
              currentPage >= totalPages
            }
            className="flex items-center gap-1 text-gray-500 disabled:opacity-40"
          >
            Next
            <ChevronRight size={16} />
          </button>

        </div>

      </div>

    </div>
  );
}