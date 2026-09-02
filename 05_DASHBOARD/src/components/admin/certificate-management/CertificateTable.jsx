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

  useEffect(() => {
    setCurrentPage(1);
  }, [safeCertificates.length]);

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

  const showingStart =
    safeCertificates.length === 0
      ? 0
      : startIndex + 1;

  const showingEnd = Math.min(
    startIndex + rowsPerPage,
    safeCertificates.length
  );

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow">
        Loading certificates...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-white p-5 text-red-500 shadow">
        {error}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.35)]">

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
                    className="border-b border-gray-200 transition hover:bg-gray-50"
                  >

                    <td className="px-4 py-4 font-medium text-gray-900">
                      {certificateId}
                    </td>

                    <td className="px-4 py-4 text-gray-700">
                      {traineeName}
                    </td>

                    <td className="px-4 py-4 text-gray-700">
                      {course}
                    </td>

                    <td className="px-4 py-4 text-gray-700">
                      {dateIssued}
                    </td>

                    <td className="px-4 py-4">
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

                              onView?.(certificate);
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