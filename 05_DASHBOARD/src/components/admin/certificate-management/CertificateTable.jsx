import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function CertificateTable({
  certificates = [],
  loading = false,
  error = null,
  onView,
  onTrack,
  onDownload,
  onRevoke,
}) {
  const [currentPage, setCurrentPage] =
    useState(1);

  const [openMenuId, setOpenMenuId] =
    useState(null);

  // ------------------------------------------------------------
  // HANDOFF:
  // Keep the Certificate Management table limited to 5 rows
  // per page, matching the ResultsTable.jsx pagination behavior.
  // ------------------------------------------------------------
  const rowsPerPage = 5;

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

  // Reset to page 1 whenever the certificate list changes.
  useEffect(() => {
    setCurrentPage(1);
  }, [safeCertificates.length]);

  // Close the actions menu when Escape is pressed.
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        setOpenMenuId(null);
      }
    };

    globalThis.addEventListener(
      "keydown",
      handleEsc
    );

    return () => {
      globalThis.removeEventListener(
        "keydown",
        handleEsc
      );
    };
  }, []);

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
  }, [
    safeCertificates,
    currentPage,
  ]);

  const startIndex =
    (currentPage - 1) * rowsPerPage;

  const endIndex =
    startIndex + rowsPerPage;

  const showingStart =
    safeCertificates.length === 0
      ? 0
      : startIndex + 1;

  const showingEnd = Math.min(
    endIndex,
    safeCertificates.length
  );

  // ------------------------------------------------------------
  // LOADING STATE
  // Matches the rounded table-card style used by ResultsTable.
  // ------------------------------------------------------------
  if (loading) {
    return (
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="px-6 py-12 text-center text-sm font-medium text-gray-500">
          Loading certificates...
        </div>
      </section>
    );
  }

  // ------------------------------------------------------------
  // ERROR STATE
  // ------------------------------------------------------------
  if (error) {
    return (
      <section className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
        <div className="px-6 py-12 text-center text-sm font-medium text-red-600">
          {error}
        </div>
      </section>
    );
  }

  return (
    // ----------------------------------------------------------
    // HANDOFF:
    // The white background is now only the table container,
    // instead of having another white card wrapped around it.
    //
    // Pagination is also INSIDE this same section, just like
    // ResultsTable.jsx.
    // ----------------------------------------------------------
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.40)]">

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">

          {/* ---------------------------------------------------
              TABLE HEADER
              Copied from the ResultsTable UI style.
          --------------------------------------------------- */}
          <thead className="border-b border-gray-200 bg-gray-50/80">
            <tr>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                Certificate ID
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                Trainee Name
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                Course
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                Date Issued
              </th>

              <th className="px-5 py-4 text-left text-xs font-semibold uppercase text-gray-500">
                Status
              </th>

              <th className="px-5 py-4 text-center text-xs font-semibold uppercase text-gray-500">
                Actions
              </th>

            </tr>
          </thead>

          {/* ---------------------------------------------------
              TABLE BODY
              --------------------------------------------------- */}
          <tbody className="divide-y divide-gray-100">

            {paginatedCertificates.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-12 text-center text-sm font-medium text-gray-500"
                >
                  No certificates found.
                </td>
              </tr>
            )}

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

                const normalizedStatus =
                  status.toLowerCase();

                const isValid =
                  normalizedStatus === "valid" ||
                  normalizedStatus === "issued";

                return (
                  <tr
                    key={certificateId}
                    className="transition-colors hover:bg-gray-50/60"
                  >

                    <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                      {certificateId}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">
                        {traineeName}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-600">
                        {course}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-gray-700">
                      {(() => {
                        if (!dateIssued || dateIssued === "—") {
                          return "—";
                        }

                        const date = new Date(dateIssued);

                        if (Number.isNaN(date.getTime())) {
                          return dateIssued;
                        }

                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        });
                      })()}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={
                          isValid
                            ? "inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700"
                            : normalizedStatus === "revoked"
                              ? "inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700"
                              : "inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700"
                        }
                      >
                        {status}
                      </span>
                    </td>

                    {/* ------------------------------------------------
                        ACTIONS
                        Existing Certificate Management actions are
                        preserved.
                        ------------------------------------------------ */}
                    <td className="relative px-5 py-4 text-center">

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
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-gray-100"
                        aria-label="Certificate actions"
                      >
                        <div className="flex flex-col gap-[2px]">
                          <span className="h-1 w-1 rounded-full bg-gray-700" />
                          <span className="h-1 w-1 rounded-full bg-gray-700" />
                          <span className="h-1 w-1 rounded-full bg-gray-700" />
                        </div>
                      </button>

                      {openMenuId === certificateId && (
                        <div
                          className="absolute right-2 top-12 z-50 w-40 rounded-lg border border-gray-200 bg-white py-1 text-left shadow-xl"
                          onClick={(event) => {
                            event.stopPropagation();
                          }}
                        >

                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);

                              onView?.(
                                certificate
                              );
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-black hover:bg-gray-100"
                          >
                            Details
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);

                              setTimeout(() => {
                                onDownload?.(
                                  certificate
                                );
                              }, 50);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-black hover:bg-gray-100"
                          >
                            Download
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);

                              onTrack?.(
                                certificate
                              );
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-black hover:bg-gray-100"
                          >
                            Track
                          </button>

                          {normalizedStatus !== "revoked" && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpenMenuId(null);

                                onRevoke?.(
                                  certificate
                                );
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

      {/* ----------------------------------------------------------
          PAGINATION
          
          HANDOFF:
          Pagination is now INSIDE the table card and uses the
          exact same structure/style as ResultsTable.jsx.
          ---------------------------------------------------------- */}
      <div className="flex flex-col gap-3 border-t border-gray-200 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">

        <p className="font-medium text-gray-600">
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
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={16} />
            Prev
          </button>

          <span className="rounded-lg border border-gray-200 px-3 py-2 font-medium text-gray-700">
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
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 font-medium text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ChevronRight size={16} />
          </button>

        </div>
      </div>

    </section>
  );
}

